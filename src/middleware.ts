import { NextRequest, NextResponse } from "next/server";

const PASSWORD = "12734836";
const COOKIE_NAME = "dashboard_auth";

export function middleware(request: NextRequest) {
  // Check auth cookie
  const authCookie = request.cookies.get(COOKIE_NAME);
  if (authCookie?.value === PASSWORD) {
    return NextResponse.next();
  }

  // Allow login page and auth API
  if (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/api/auth"
  ) {
    return NextResponse.next();
  }

  // Redirect to login
  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
