const DEFAULT_DEV_ADMIN_HOST = "admin.localhost:3000";

function normalizeHost(host: string | null | undefined) {
  return host?.split(",")[0]?.trim().toLowerCase().replace(/\.$/, "") ?? "";
}

export function getAdminHosts() {
  return new Set(
    [process.env.ADMIN_HOST, process.env.ADMIN_DEV_HOST || DEFAULT_DEV_ADMIN_HOST]
      .map(normalizeHost)
      .filter(Boolean),
  );
}

export function isAdminHost(host: string | null | undefined) {
  return getAdminHosts().has(normalizeHost(host));
}

export function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

export function getNormalizedHost(host: string | null | undefined) {
  return normalizeHost(host);
}
