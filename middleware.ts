import { updateSession } from "@/lib/supabase/middleware";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // First, refresh the session
  const res = await updateSession(req);

  // Now, create a client to check auth state for the rest of the logic
  const supabase = await createServerSupabaseClient(req);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/shop",
    "/main-shop", // Main shop catalog
    "/product", // Product detail pages
    "/cart",
    "/checkout",
    "/demo", // Add demo routes as public
    "/terms",
    "/privacy",
    "/sign-in",
    "/sign-up",
    "/reset",
    "/update-password",
    "/auth/auth-code-error",
    "/influencers", // Add influencers page as public
    "/brands", // Add brands page as public
  ];

  // API routes that don't require authentication
  const publicApiRoutes = [
    "/api/auth/sign-in",
    "/api/auth/sign-up",
    "/api/auth/reset",
    "/api/auth/callback",
    "/api/products", // Public product listing
    "/api/shop", // Public influencer shop data for SSR
    "/api/main-shop", // Main shop feed (read-only aggregated catalog)
    "/api/debug", // Local diagnostic endpoints
    "/api/stripe", // Stripe diagnostics and other public Stripe endpoints
    "/api/checkout", // Allow checkout endpoint to return JSON (route enforces auth/roles itself)
    "/api/webhooks/stripe", // Stripe webhooks must be publicly accessible (secured by signature)
  ];

  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();
  const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const coreFrozen =
    (process.env.CORE_FREEZE ?? "false").toLowerCase() === "true";
  const shopsFrozen =
    (process.env.SHOPS_FREEZE ?? "false").toLowerCase() === "true";

  if (process.env.NODE_ENV !== "production") {
    console.log("[MW]", { coreFrozen, shopsFrozen, method, path: pathname });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CORE FREEZE: Onboarding & Dashboard Write Lock
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // When CORE_FREEZE=true, blocks all write operations (POST/PUT/PATCH/DELETE) to:
  //   - /api/onboarding/*  (document uploads, profile updates, role assignments)
  //   - /auth/onboarding   (UI pages - for completeness)
  //   - /dashboard/*       (all dashboard routes)
  //   - /api/admin/*       (admin management endpoints)
  //   - /api/influencer/*  (influencer-specific APIs like shop curation)
  //   - /api/brand/*       (brand/supplier-specific APIs)
  //   - /api/supplier/*    (supplier management endpoints)
  //
  // EXCEPTIONS (always allowed, even when frozen):
  //   - /api/auth/*        (sign-in, sign-up, password reset)
  //   - /api/checkout/*    (checkout session creation)
  //   - /api/webhooks/*    (Stripe webhooks must remain accessible)
  //
  // READ operations (GET, HEAD, OPTIONS) are always permitted.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (coreFrozen) {
    const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

    // System endpoints that must continue working for auth/payments/webhooks
    const ALLOW_WRITE_PREFIXES = [
      "/api/auth",
      "/api/checkout",
      "/api/stripe",
      "/api/webhooks/stripe",
    ];

    // Areas frozen: onboarding, dashboards, and role-specific APIs
    const isFrozenArea =
      pathname.startsWith("/api/onboarding") ||
      pathname.startsWith("/auth/onboarding") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/app/dashboard") ||
      pathname.startsWith("/api/admin") ||
      pathname.startsWith("/api/influencer") ||
      pathname.startsWith("/api/brand") ||
      pathname.startsWith("/api/supplier");

    if (isFrozenArea) {
      // Allow safe read methods
      if (!SAFE_METHODS.has(method) && isWrite) {
        // Check if this is an allowed system write endpoint
        const isAllowedWrite = ALLOW_WRITE_PREFIXES.some((p) =>
          pathname.startsWith(p)
        );
        if (!isAllowedWrite) {
          return new NextResponse(
            JSON.stringify({
              ok: false,
              error:
                "CORE_FREEZE active: writes are temporarily disabled for onboarding & dashboards.",
            }),
            { status: 423, headers: { "content-type": "application/json" } }
          );
        }
      }
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SHOPS FREEZE: Product & Shop Write Lock
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // When SHOPS_FREEZE=true, blocks all write operations (POST/PUT/PATCH/DELETE) to:
  //   - /api/products/*           (supplier product management: create, update, delete)
  //   - /api/shop/*               (shop configuration updates)
  //   - /api/influencer-shop/*    (influencer shop curation: add/remove products)
  //   - /api/influencer/shop/*    (alternative influencer shop endpoint)
  //
  // This protects shop UIs and product data from accidental modifications.
  // READ operations (GET) for feeds and product listings are always permitted.
  //
  // USE CASE: Enable during integration work to prevent breaking working shop features.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (shopsFrozen) {
    const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

    // Patterns matching shop write endpoints
    const SHOP_WRITE_PATTERNS = [
      /^\/api\/products($|\/)/,          // Product CRUD operations
      /^\/api\/shop($|\/)/,              // Shop configuration
      /^\/api\/influencer-shop($|\/)/,   // Influencer shop curation
      /^\/api\/influencer\/shop($|\/)/,  // Alternative influencer shop endpoint
    ];

    const isShopWriteEndpoint = SHOP_WRITE_PATTERNS.some((pattern) =>
      pattern.test(pathname)
    );

    if (isShopWriteEndpoint && !SAFE_METHODS.has(method) && isWrite) {
      return new NextResponse(
        JSON.stringify({
          ok: false,
          error: "SHOPS_FREEZE active: shop and product writes are temporarily disabled.",
        }),
        { status: 423, headers: { "content-type": "application/json" } }
      );
    }
  }

  // Allow public routes by checking if the path starts with any of them
  if (
    publicRoutes.some(
      (path) => pathname === path || (path !== "/" && pathname.startsWith(path))
    ) ||
    publicApiRoutes.some(
      (path) => pathname === path || (path !== "/" && pathname.startsWith(path))
    )
  ) {
    return res;
  }

  // Redirect to sign-in if no session
  if (!session) {
    console.debug("[middleware] no session", { path: pathname });
    const redirectUrl = new URL("/sign-in", req.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Get user role from the 'users' table with proper type inference
  const query = supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  const { data: user, error } = await query;

  if (error || !user) {
    console.warn("[middleware] user not found for session", {
      path: pathname,
      error: error?.message,
    });
    // This case might happen if a user is deleted but their session persists.
    // Clear session by redirecting to sign-in.
    const redirectUrl = new URL("/sign-in", req.url);
    redirectUrl.searchParams.set("error", "User not found");
    return NextResponse.redirect(redirectUrl);
  }

  // Role-based access control
  const userRole = (user as any).role;
  console.debug("[middleware] session detected", {
    path: pathname,
    role: userRole,
  });

  // Admin route protection
  if (pathname.startsWith("/admin/") && pathname !== "/admin/login") {
    if (userRole !== "admin") {
      return NextResponse.redirect(
        new URL("/admin/login?error=Unauthorized access", req.url)
      );
    }
  }

  // Dashboard route protection
  if (pathname.startsWith("/dashboard/")) {
    const dashboardRole = pathname.split("/")[2]; // e.g., 'supplier', 'influencer', 'admin'

    // Admins can access any dashboard. Other users can only access their own.
    if (userRole !== "admin" && userRole !== dashboardRole) {
      // Redirect non-admin users to their correct dashboard or home if they are a customer.
      const redirectPath =
        userRole === "customer" ? "/" : `/dashboard/${userRole}`;
      console.debug("[middleware] redirecting to role dashboard", {
        requested: pathname,
        role: userRole,
        redirectPath,
      });
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }
  }

  // API route protection
  if (pathname.startsWith("/api/")) {
    // Admin-only API routes
    if (pathname.startsWith("/api/admin/") && userRole !== "admin") {
      return new NextResponse(JSON.stringify({ message: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Supplier-only API routes (for write operations)
    if (
      pathname.startsWith("/api/products/") &&
      req.method !== "GET" &&
      !["supplier", "admin"].includes(userRole)
    ) {
      return new NextResponse(JSON.stringify({ message: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Influencer-only API routes (for write operations)
    if (
      pathname.startsWith("/api/shops/") &&
      req.method !== "GET" &&
      !["influencer", "admin"].includes(userRole)
    ) {
      return new NextResponse(JSON.stringify({ message: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (e.g., .svg, .png, .jpg)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
