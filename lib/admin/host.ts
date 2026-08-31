const DEFAULT_DEV_ADMIN_HOST = "admin.localhost:3000";

function normalizeHost(host: string | null | undefined) {
  return host?.split(",")[0]?.trim().toLowerCase().replace(/\.$/, "") ?? "";
}

export function getAdminHosts() {
  const hosts = process.env.NODE_ENV === "production"
    ? [process.env.ADMIN_HOST]
    : [process.env.ADMIN_DEV_HOST || DEFAULT_DEV_ADMIN_HOST, process.env.ADMIN_HOST];

  return new Set(hosts.map(normalizeHost).filter(Boolean));
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
