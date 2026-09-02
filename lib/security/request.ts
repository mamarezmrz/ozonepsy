export function getRequestMetadata(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  return {
    userAgent: request.headers.get("user-agent")?.slice(0, 500),
    ipAddress: forwardedFor?.split(",")[0]?.trim().slice(0, 64) ?? realIp?.slice(0, 64),
    requestId: request.headers.get("x-request-id")?.slice(0, 120),
  };
}

function requestHost(request: Request) {
  return (request.headers.get("host") ?? new URL(request.url).host)
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");
}

export function hasSameOrigin(request: Request) {
  const candidate = request.headers.get("origin") ?? request.headers.get("referer");
  if (!candidate) return false;

  try {
    return new URL(candidate).host.toLowerCase().replace(/\.$/, "") === requestHost(request);
  } catch {
    return false;
  }
}
