const DEFAULT_DEV_ADMIN_HOST = "admin.localhost:3000";

function normalizeHost(host: string | null | undefined) {
  return host?.split(",")[0]?.trim().toLowerCase().replace(/\.$/, "") ?? "";
}

export function getAdminHosts() {
  // Temporary Railway fallback: until a dedicated admin domain is configured,
  // use Railway's generated public domain as the production admin host.
  const productionHost = normalizeHost(process.env.ADMIN_HOST || process.env.RAILWAY_PUBLIC_DOMAIN);
  const hosts = process.env.NODE_ENV === "production"
    ? [productionHost]
    : [normalizeHost(process.env.ADMIN_DEV_HOST || DEFAULT_DEV_ADMIN_HOST)];
  return new Set(hosts.filter(Boolean));
}

export function isTemporaryRailwayAdminHost(host: string | null | undefined) {
  const configuredAdminHost = normalizeHost(process.env.ADMIN_HOST);
  const railwayPublicDomain = normalizeHost(process.env.RAILWAY_PUBLIC_DOMAIN);
  return process.env.NODE_ENV === "production"
    && !configuredAdminHost
    && Boolean(railwayPublicDomain)
    && normalizeHost(host) === railwayPublicDomain;
}

export function isAdminHost(host: string | null | undefined) {
  const normalized = normalizeHost(host);
  return Boolean(normalized) && getAdminHosts().has(normalized);
}

export function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

export function getNormalizedHost(host: string | null | undefined) {
  return normalizeHost(host);
}
