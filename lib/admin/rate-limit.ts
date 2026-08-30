import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ADMIN_LOGIN_RATE_LIMIT_MAX,
  DEFAULT_ADMIN_LOGIN_RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/admin/constants";

export function isAdminLoginRateLimitEnabled() {
  // Keep development logins easy to retry while production remains protected.
  return process.env.NODE_ENV !== "development";
}

function numberFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export const adminLoginRateLimitConfig = {
  maxAttempts: numberFromEnv("ADMIN_LOGIN_RATE_LIMIT_MAX", DEFAULT_ADMIN_LOGIN_RATE_LIMIT_MAX),
  windowSeconds: numberFromEnv("ADMIN_LOGIN_RATE_LIMIT_WINDOW_SECONDS", DEFAULT_ADMIN_LOGIN_RATE_LIMIT_WINDOW_SECONDS),
};

function keyHash(email: string, ipAddress?: string) {
  return createHash("sha256").update(`${email.trim().toLowerCase()}|${ipAddress ?? "unknown"}`).digest("hex");
}

export async function isAdminLoginBlocked(email: string, ipAddress?: string) {
  if (!isAdminLoginRateLimitEnabled()) {
    return false;
  }

  const record = await prisma.adminLoginRateLimit.findUnique({ where: { keyHash: keyHash(email, ipAddress) } });
  return Boolean(record?.blockedUntil && record.blockedUntil > new Date());
}

export async function recordAdminLoginFailure(email: string, ipAddress?: string) {
  if (!isAdminLoginRateLimitEnabled()) {
    return;
  }

  const now = new Date();
  const hash = keyHash(email, ipAddress);
  const existing = await prisma.adminLoginRateLimit.findUnique({ where: { keyHash: hash } });
  const windowExpired = !existing || existing.windowStartedAt.getTime() + adminLoginRateLimitConfig.windowSeconds * 1000 <= now.getTime();
  const attempts = windowExpired ? 1 : existing.attempts + 1;
  const blockedUntil = attempts >= adminLoginRateLimitConfig.maxAttempts
    ? new Date(now.getTime() + adminLoginRateLimitConfig.windowSeconds * 1000)
    : null;

  await prisma.adminLoginRateLimit.upsert({
    where: { keyHash: hash },
    create: { keyHash: hash, attempts, windowStartedAt: now, blockedUntil },
    update: { attempts, windowStartedAt: windowExpired ? now : existing.windowStartedAt, blockedUntil },
  });
}

export async function clearAdminLoginFailures(email: string, ipAddress?: string) {
  if (!isAdminLoginRateLimitEnabled()) {
    return;
  }

  await prisma.adminLoginRateLimit.deleteMany({ where: { keyHash: keyHash(email, ipAddress) } });
}
