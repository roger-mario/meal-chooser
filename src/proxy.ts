import { NextResponse, type NextRequest } from "next/server";

// Open to everyone: shared meals and their photos. The API checks its own key (API_KEY) instead.
const PUBLIC_PREFIXES = ["/s/", "/api/images/", "/api/v1/"];

/** APP_PASSWORD (if set) protects the site with a browser password prompt. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();
  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const pass = decoded.slice(decoded.indexOf(":") + 1);
    if (pass === password) return NextResponse.next();
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Meal Chooser"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
