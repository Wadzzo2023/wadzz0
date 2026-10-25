import type { NextRequest, NextResponse } from "next/server";

/**
 * Single sign-on across *.wadzzo.com: when AUTH_COOKIE_DOMAIN is set (".wadzzo.com" in
 * production only), the NextAuth session cookie is written for the whole domain, so every
 * Wadzzo app on a subdomain reads the same login. All of them must share NEXTAUTH_SECRET.
 * Unset (local dev, Vercel previews) everything behaves as NextAuth's defaults.
 *
 * The cookie keeps NextAuth's default name, so `getToken({ req })` and existing clients
 * keep working unchanged.
 */
export const AUTH_COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN || undefined;

/** NextAuth's default session cookie name over https. */
export const SESSION_COOKIE = "__Secure-next-auth.session-token";

/** `cookies` option for NextAuth: only the session token is shared, the rest stay per site. */
export const sharedSessionCookie = AUTH_COOKIE_DOMAIN
  ? {
      sessionToken: {
        name: SESSION_COOKIE,
        options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure: true, domain: AUTH_COOKIE_DOMAIN },
      },
    }
  : undefined;

/**
 * Clears the old single-site session cookie left from before the login became shared. A browser
 * would send both copies and the stale one would win, so signing out elsewhere would not sign the
 * user out here. The expiry has no Domain, so it only touches that old host-only copy; the shared
 * cookie is left alone. Safe to delete once every old cookie has expired (30 days after
 * AUTH_COOKIE_DOMAIN goes live).
 */
export function clearLegacySessionCookie(req: NextRequest, res: NextResponse) {
  if (!AUTH_COOKIE_DOMAIN) return;
  for (const { name } of req.cookies.getAll()) {
    if (name === SESSION_COOKIE || name.startsWith(`${SESSION_COOKIE}.`)) {
      res.headers.append("Set-Cookie", `${name}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`);
    }
  }
}
