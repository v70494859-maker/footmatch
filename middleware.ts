import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME_ROUTES } from "@/lib/constants";

const protectedRoutes = [
  "/matches",
  "/my-matches",
  "/subscription",
  "/profile",
  "/players",
  "/operator",
  "/operator-onboarding",
  "/onboarding",
  "/admin",
];

const authRoutes = ["/login"];

export async function middleware(request: NextRequest) {
  const { user, role, supabaseResponse } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // Not logged in, trying to access protected route
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in, trying to access auth route — redirect to role home
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = role ? ROLE_HOME_ROUTES[role] : "/matches";
    return NextResponse.redirect(url);
  }

  // Role-based route protection
  if (user && role) {
    const url = request.nextUrl.clone();

    // /matches, /my-matches, /subscription → player only
    if (
      (pathname.startsWith("/matches") ||
        pathname.startsWith("/my-matches") ||
        pathname.startsWith("/subscription")) &&
      role !== "player" &&
      role !== "admin"
    ) {
      url.pathname = ROLE_HOME_ROUTES[role];
      return NextResponse.redirect(url);
    }

    // /players → player + operator + admin
    if (
      pathname.startsWith("/players") &&
      role !== "player" &&
      role !== "operator" &&
      role !== "admin"
    ) {
      url.pathname = ROLE_HOME_ROUTES[role];
      return NextResponse.redirect(url);
    }

    // /operator/* → operator only
    if (pathname.startsWith("/operator") && !pathname.startsWith("/operator-onboarding") && role !== "operator" && role !== "admin") {
      url.pathname = ROLE_HOME_ROUTES[role];
      return NextResponse.redirect(url);
    }

    // /admin/* → admin only
    if (pathname.startsWith("/admin") && role !== "admin") {
      url.pathname = ROLE_HOME_ROUTES[role];
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/login",
    "/matches/:path*",
    "/my-matches/:path*",
    "/subscription/:path*",
    "/profile/:path*",
    "/players/:path*",
    "/onboarding",
    "/operator/:path*",
    "/operator-onboarding/:path*",
    "/admin/:path*",
    "/payment/:path*",
  ],
};
