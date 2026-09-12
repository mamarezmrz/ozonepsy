import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/constants";
import { getNormalizedHost, isAdminHost, isAdminPath, isTemporaryRailwayAdminHost } from "@/lib/admin/host";

function notFoundResponse() {
  return new NextResponse("Not Found", { status: 404 });
}

function adminResponse(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

function isStaticAsset(pathname: string) {
  return /\.(?:css|js|map|ico|png|jpe?g|gif|svg|webp|avif|woff2?|ttf|otf|mp4|webm)$/i.test(pathname);
}

const temporaryAdminPathPrefixes = [
  "/users",
    "/individual-consultation",
  "/specialists",
  "/sessions",
  "/reviews",
  "/categories",
  "/consultation-benefits",
  "/consultation-issues",
  "/audit-logs",
  "/admins",
  "/orders",
  "/media",
  "/content",
  "/forbidden",
];

function isTemporaryAdminPath(pathname: string) {
  return temporaryAdminPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Routes the private admin host to the internal /admin route tree.
 * Authentication and authorization are intentionally enforced again in the
 * admin layout and server-side application services.
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = getNormalizedHost(request.headers.get("host"));
  const adminHost = isAdminHost(host);
  const temporarySameHost = isTemporaryRailwayAdminHost(host);

  if (temporarySameHost) {
    if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/api/admin" || pathname.startsWith("/api/admin/")) {
      return adminResponse(NextResponse.next());
    }

    if (pathname === "/" || pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname === "/favicon.ico" || isStaticAsset(pathname)) {
      return NextResponse.next();
    }

    const hasAdminSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (hasAdminSession && isTemporaryAdminPath(pathname)) {
      return adminResponse(NextResponse.rewrite(new URL(`/admin${pathname}${request.nextUrl.search}`, request.url)));
    }

    return NextResponse.next();
  }

  if (isAdminPath(pathname) && !adminHost) {
    return notFoundResponse();
  }

  if (!adminHost || pathname.startsWith("/_next/") || pathname === "/favicon.ico" || isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return pathname.startsWith("/api/admin/") || pathname === "/api/admin"
      ? adminResponse(NextResponse.next())
      : notFoundResponse();
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return adminResponse(NextResponse.next());
  }

  const internalPath = pathname === "/" ? "/admin" : `/admin${pathname}`;
  return adminResponse(NextResponse.rewrite(new URL(`${internalPath}${request.nextUrl.search}`, request.url)));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
