import { NextResponse, type NextRequest } from "next/server";

import { clearLegacySessionCookie } from "~/server/auth-cookie";

export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  clearLegacySessionCookie(req, res);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
