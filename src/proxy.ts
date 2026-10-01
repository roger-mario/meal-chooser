import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, AUTH_COOKIE_MAX_AGE, authToken } from "@/lib/site-auth";

// Open to everyone: shared meals, their photos and the ingredient pages Bring! imports. The API checks its own key (API_KEY) instead.
const PUBLIC_PREFIXES = ["/s/", "/api/images/", "/api/v1/", "/api/bring/", "/login"];

/** APP_PASSWORD (if set) protects the site. The password is asked once on /login and remembered in a cookie. */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();
  const token = await authToken(password);
  if (request.cookies.get(AUTH_COOKIE)?.value === token) return NextResponse.next();

  // Browsers that still remember the old password prompt get the cookie without being asked.
  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    if (decoded.slice(decoded.indexOf(":") + 1) === password) {
      const response = NextResponse.next();
      response.cookies.set(AUTH_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: AUTH_COOKIE_MAX_AGE, path: "/" });
      return response;
    }
  }

  if (request.method !== "GET" || pathname.startsWith("/api/")) {
    return new NextResponse("Authentication required", { status: 401 });
  }
  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Icons and the manifest stay public so phones can show the app icon before signing in.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-touch-icon|manifest.webmanifest).*)"],
};
