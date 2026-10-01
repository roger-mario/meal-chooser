/** Remembers in this browser that the site password was entered, so phones never ask again. */
export const AUTH_COOKIE = "otao_auth";
/** Browsers cap cookie lifetimes at 400 days. */
export const AUTH_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

/** The cookie holds a hash of the password, so changing APP_PASSWORD signs everyone out. */
export async function authToken(password: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`otao-site:${password}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
