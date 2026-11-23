import * as AppleAuthentication from "expo-apple-authentication";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { inputStyle } from "@/components/SaveSheet";
import { Icon } from "@/components/icons";
import { Logo, LogoLoader, Wordmark } from "@/components/Logo";
import { Button, T } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { providerReady, signInWith, type Provider, type ProviderResult } from "@/lib/oauth";
import { C } from "@/lib/theme";

const POINTS = [
  { bg: C.peach, icon: <Icon.feed size={20} color={C.coralInk} />, text: "Recipes from friends and family" },
  { bg: C.mint, icon: <Icon.plan size={20} color={C.mintInk} />, text: "One plan for your whole household" },
  { bg: C.butter, icon: <Icon.leaf size={20} />, text: "Every vitamin and mineral, not just calories" },
];

export default function SignIn() {
  const { signIn, signInWithReviewCode } = useAuth();
  const [busy, setBusy] = useState<Provider | "code" | null>(null);
  const [pending, setPending] = useState<NonNullable<ProviderResult> | null>(null);
  const [code, setCode] = useState("");
  const [reviewMode, setReviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // First the intro, then the sign-in buttons. "back" is true for people who already have an account.
  const [stage, setStage] = useState<"intro" | "new" | "back">("intro");

  async function start(provider: Provider) {
    setError(null);
    setBusy(provider);
    try {
      const result = await signInWith(provider);
      if (!result) return;
      try {
        await signIn(result);
      } catch (e) {
        // A new account needs an invite code; keep the provider token and ask for it.
        if (e instanceof ApiError && e.code === "invite_required") setPending(result);
        else throw e;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function submitCode() {
    setError(null);
    setBusy("code");
    try {
      if (reviewMode) await signInWithReviewCode(code.trim());
      else if (pending) await signIn(pending, code.trim());
    } catch (e) {
      const err = e as ApiError;
      // Provider tokens are short-lived; after a few minutes the person has to sign in again.
      if (err.code === "unauthorized" && pending) {
        setPending(null);
        setError("That took a while, please sign in again and enter the code.");
      } else setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const askCode = !!pending || reviewMode;

  if (stage === "intro" && !askCode) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ backgroundColor: C.sky, paddingBottom: 8 }}>
          <SafeAreaView edges={["top"]} style={{ alignItems: "center", paddingTop: 28, gap: 26 }}>
            <Wordmark size={26} />
            <Pressable accessibilityLabel="Otao" onLongPress={() => setReviewMode(true)} delayLongPress={1500}>
              <LogoLoader size={190} label={null} />
            </Pressable>
          </SafeAreaView>
          <Svg width="100%" height={48} viewBox="0 0 390 48" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: -47 }}>
            <Path d="M0 0 H390 V22 C 320 52, 250 46, 190 30 S 70 6, 0 30 Z" fill={C.sky} />
          </Svg>
        </View>
        <SafeAreaView edges={["bottom"]} style={{ flex: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 12, gap: 22 }}>
          <View style={{ gap: 10 }}>
            <T w="extrabold" s={30} style={{ letterSpacing: -0.6, lineHeight: 35 }}>
              Easy, healthy food you’ll actually cook
            </T>
          </View>
          <View style={{ gap: 14 }}>
            {POINTS.map((p) => (
              <View key={p.text} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p.bg, alignItems: "center", justifyContent: "center" }}>{p.icon}</View>
                <T s={16} color={C.ink2} style={{ flex: 1 }}>
                  {p.text}
                </T>
              </View>
            ))}
          </View>
          <View style={{ flex: 1 }} />
          <View style={{ gap: 6 }}>
            <Button label="Get started" size="lg" onPress={() => setStage("new")} />
            <Button label="I already have an account" kind="ghost" onPress={() => setStage("back")} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
          {!askCode && (
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => setStage("intro")} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" }}>
              <Icon.back />
            </Pressable>
          )}
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <Logo size={110} />
          </View>
          <View style={{ gap: 8 }}>
            <T w="extrabold" s={28} style={{ letterSpacing: -0.5, lineHeight: 33 }}>
              {stage === "back" ? "Welcome back" : "Create your account"}
            </T>
            <T s={16} color={C.ink2} style={{ lineHeight: 23 }}>
              {stage === "back" ? "Sign in the same way you did before." : "Pick how you want to sign in. Otao is invite-only for now, so have the code a friend sent you ready."}
            </T>
          </View>

          <View style={{ flex: 1 }} />

          {askCode ? (
            <View style={{ gap: 10 }}>
              <T w="bold" s={17}>
                {reviewMode ? "Review sign-in" : "Otao is invite-only for now"}
              </T>
              <T s={14} color={C.muted}>
                {reviewMode ? "Enter the review code." : "Enter the invite code a friend sent you."}
              </T>
              <TextInput
                accessibilityLabel={reviewMode ? "Review code" : "Invite code"}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder={reviewMode ? "Review code" : "e.g. KX4P-9TQM"}
                placeholderTextColor={C.off}
                value={code}
                onChangeText={setCode}
                onSubmitEditing={submitCode}
                style={[inputStyle, { flex: 0, height: 52, borderRadius: 26, fontSize: 18, letterSpacing: 1 }]}
              />
              <Button label="Continue" size="lg" busy={busy === "code"} disabled={!code.trim()} onPress={submitCode} />
              <Button
                label="Back"
                kind="ghost"
                onPress={() => {
                  setPending(null);
                  setReviewMode(false);
                  setCode("");
                }}
              />
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {providerReady.apple && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={27}
                  style={{ height: 54 }}
                  onPress={() => start("apple")}
                />
              )}
              <Button label="Continue with Google" kind="secondary" size="lg" busy={busy === "google"} icon={<GoogleMark />} onPress={() => start("google")} />
              <Button label="Continue with Microsoft" kind="secondary" size="lg" busy={busy === "microsoft"} icon={<MicrosoftMark />} onPress={() => start("microsoft")} />
              {Platform.OS === "web" && (
                <Button label="Use a review code" kind="ghost" onPress={() => setReviewMode(true)} />
              )}
            </View>
          )}
          {error && (
            <T s={14} color="#B42318" style={{ textAlign: "center" }} onPress={() => Alert.alert("Sign-in", error)}>
              {error}
            </T>
          )}
          <T s={12} color={C.muted} style={{ textAlign: "center" }}>
            We only use your account to sign you in. Your recipes stay with your household and the friends you invite.
          </T>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Small neutral brand marks drawn with views, so no logo files are bundled. */
function GoogleMark() {
  return (
    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: "#4285F4", borderRightColor: "#34A853", borderBottomColor: "#FBBC05", borderLeftColor: "#EA4335" }} />
  );
}
function MicrosoftMark() {
  const sq = (c: string) => <View style={{ width: 8, height: 8, backgroundColor: c }} />;
  return (
    <View style={{ width: 18, height: 18, flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
      {sq("#F25022")}
      {sq("#7FBA00")}
      {sq("#00A4EF")}
      {sq("#FFB900")}
    </View>
  );
}
