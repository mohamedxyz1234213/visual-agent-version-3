import type { NextRequest } from "next/server";

/**
 * Auth is handled client-side via AuthGate.tsx (which calls fetchMe() with
 * credentials: "include" against the backend). This middleware is intentionally
 * empty because the session cookie (wb_session) is set by a *different* domain
 * (teacherbackend-three.vercel.app) and is never visible to this middleware.
 */

export function middleware(_request: NextRequest) {}

export const config = { matcher: [] };

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
