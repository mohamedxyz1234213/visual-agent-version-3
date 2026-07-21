import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication — redirect to /login with ?next=
const PROTECTED_ROUTES = [
  "/upload",
  "/lesson",
  "/student",
  "/dashboard",
];

// Routes that should NOT be protected (public)
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/contact",
  "/_next",
  "/api",
  "/favicon",
  "/signup",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
    return NextResponse.next();
  }

  // Check if the current path is protected
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for the session cookie
  const sessionCookie = request.cookies.get("wb_session");
  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Has a session cookie — allow through (validation happens on the backend)
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
