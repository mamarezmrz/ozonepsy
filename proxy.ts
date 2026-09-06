import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getNormalizedHost, isAdminHost, isAdminPath } from "@/lib/admin/host";

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

/**
 * Routes the private admin host to the internal /admin route tree.
 * Authentication and authorization are intentionally enforced again in the
 * admin layout and server-side application services.
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = getNormalizedHost(request.headers.get("host"));
  const adminHost = isAdminHost(host);

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

  const internalPath = pathname === "/" ? "/admin" : `/admin${pathname}`;
  return adminResponse(NextResponse.rewrite(new URL(`${internalPath}${request.nextUrl.search}`, request.url)));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
