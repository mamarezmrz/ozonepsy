export function getRequestMetadata(request: Request) {
  return {
    userAgent: request.headers.get("user-agent")?.slice(0, 500),
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) ?? request.headers.get("x-real-ip")?.slice(0, 64),
    requestId: request.headers.get("x-request-id")?.slice(0, 120),
  };
}

export function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originHost = new URL(origin).host.toLowerCase().replace(/\.$/, "");
    const requestHost = (request.headers.get("host") ?? new URL(request.url).host)
      .split(",")[0]
      .trim()
      .toLowerCase()
      .replace(/\.$/, "");

    return originHost === requestHost;
  } catch {
    return false;
  }
}
