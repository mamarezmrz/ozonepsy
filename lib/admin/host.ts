const DEFAULT_DEV_ADMIN_HOST = "admin.localhost:3000";

function normalizeHost(host: string | null | undefined) {
  return host?.split(",")[0]?.trim().toLowerCase().replace(/\.$/, "") ?? "";
}

function getRailwayHosts() {
  return [process.env.RAILWAY_PUBLIC_DOMAIN, process.env.RAILWAY_PRIVATE_DOMAIN]
    .map(normalizeHost)
    .filter(Boolean);
}

export function getAdminHosts() {
  // Temporary Railway fallback: until a dedicated admin domain is configured,
  // accept both public and private Railway service domains. Depending on the
  // proxy path, the request Host can be either one of them.
  const productionHosts = normalizeHost(process.env.ADMIN_HOST)
    ? [normalizeHost(process.env.ADMIN_HOST)]
    : getRailwayHosts();
  const hosts = process.env.NODE_ENV === "production"
    ? productionHosts
    : [normalizeHost(process.env.ADMIN_DEV_HOST || DEFAULT_DEV_ADMIN_HOST)];
  return new Set(hosts.filter(Boolean));
}

export function isTemporaryRailwayAdminHost(host: string | null | undefined) {
  const configuredAdminHost = normalizeHost(process.env.ADMIN_HOST);
  return process.env.NODE_ENV === "production"
    && !configuredAdminHost
    && getRailwayHosts().includes(normalizeHost(host));
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
