import { NextResponse, type NextRequest } from "next/server";

// Optional site-wide password (HTTP Basic Auth). Set APP_PASSWORD to enable.
export function proxy(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const [, pass] = atob(header.slice(6)).split(":");
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
