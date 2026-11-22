import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export type Provider = "apple" | "google" | "microsoft";
export type ProviderResult = { provider: Provider; idToken: string; nonce: string; name?: string } | null;

const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
const MICROSOFT_CLIENT_ID = process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID || "";

export const providerReady = {
  apple: Platform.OS === "ios",
  google: !!GOOGLE_IOS_CLIENT_ID,
  microsoft: !!MICROSOFT_CLIENT_ID,
};

function randomNonce() {
  return Array.from(Crypto.getRandomBytes(16), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Returns null when the person cancelled. Throws on real errors. */
export async function signInWith(provider: Provider): Promise<ProviderResult> {
  if (provider === "apple") return apple();
  if (provider === "google") {
    const reversed = GOOGLE_IOS_CLIENT_ID.split(".").reverse().join(".");
    return oidc("google", "https://accounts.google.com", GOOGLE_IOS_CLIENT_ID, `${reversed}:/oauthredirect`);
  }
  return oidc("microsoft", "https://login.microsoftonline.com/common/v2.0", MICROSOFT_CLIENT_ID, AuthSession.makeRedirectUri({ scheme: "otao", path: "auth" }));
}

async function apple(): Promise<ProviderResult> {
  const nonce = randomNonce();
  // Apple gets the hash; the server receives the raw nonce and checks the token carries its hash.
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
  try {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashed,
    });
    if (!cred.identityToken) throw new Error("Apple didn't return a sign-in token.");
    return { provider: "apple", idToken: cred.identityToken, nonce, name: cred.fullName?.givenName ?? undefined };
  } catch (e) {
    if ((e as { code?: string }).code === "ERR_REQUEST_CANCELED") return null;
    throw e;
  }
}

/** Google and Microsoft: authorization code with PKCE, then the code is swapped for an ID token on the device. */
async function oidc(provider: "google" | "microsoft", issuer: string, clientId: string, redirectUri: string): Promise<ProviderResult> {
  if (!clientId) throw new Error(`${provider === "google" ? "Google" : "Microsoft"} sign-in is not set up yet.`);
  const discovery = await AuthSession.fetchDiscoveryAsync(issuer);
  const nonce = randomNonce();
  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: ["openid", "profile", "email"],
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: { nonce, ...(provider === "microsoft" ? { prompt: "select_account" } : {}) },
  });
  const result = await request.promptAsync(discovery);
  if (result.type !== "success") {
    if (result.type === "error") throw new Error(result.error?.message || "Sign-in failed.");
    return null;
  }
  const tokens = await AuthSession.exchangeCodeAsync(
    { clientId, code: result.params.code, redirectUri, extraParams: { code_verifier: request.codeVerifier ?? "" } },
    discovery,
  );
  if (!tokens.idToken) throw new Error("No sign-in token came back. Please try again.");
  return { provider, idToken: tokens.idToken, nonce };
}
