import { NextRequest, NextResponse } from "next/server";

const PASSWORD = "12734836";
const COOKIE_NAME = "dashboard_auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (body.password === PASSWORD) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, PASSWORD, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return response;
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
