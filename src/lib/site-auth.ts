/** Remembers in this browser that the site password was entered, so phones never ask again. */
export const AUTH_COOKIE = "otao_auth";
/** Browsers cap cookie lifetimes at 400 days. */
export const AUTH_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

/** The cookie holds a hash of the password, so changing APP_PASSWORD signs everyone out. */
export async function authToken(password: string): Promise<string> {
  return hex(await sha256(`otao-site:${password}`));
}

/** Compares a typed password with APP_PASSWORD without leaking how many characters matched. */
export async function passwordMatches(given: string, password: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256(given), sha256(password)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function sha256(s: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
