import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAdminPath } from "@/lib/admin/host";

function adminResponse(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

/**
 * Keeps admin responses private while serving the admin UI and API from the
 * primary domain's path-based route tree.
 *
 * Authentication and authorization remain enforced by the admin layout and
 * each admin API handler. The proxy intentionally does not inspect hostnames
 * or rewrite alternate admin paths.
 */
export function proxy(request: NextRequest) {
  if (!isAdminPath(request.nextUrl.pathname)) return NextResponse.next();
  return adminResponse(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
