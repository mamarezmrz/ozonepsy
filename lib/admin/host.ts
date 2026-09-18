/**
 * Admin routing is path-based on the primary domain.
 *
 * The admin UI lives under /admin and its API under /api/admin. Authentication
 * and authorization are handled by the admin layout and API route guards.
 */
export function isAdminPath(pathname: string) {
  return pathname === "/admin"
    || pathname.startsWith("/admin/")
    || pathname === "/api/admin"
    || pathname.startsWith("/api/admin/");
}
