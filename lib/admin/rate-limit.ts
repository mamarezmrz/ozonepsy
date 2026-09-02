import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ADMIN_LOGIN_RATE_LIMIT_MAX, DEFAULT_ADMIN_LOGIN_RATE_LIMIT_WINDOW_SECONDS } from "@/lib/admin/constants";

export function isAdminLoginRateLimitEnabled() {
  const configured = process.env.ADMIN_LOGIN_RATE_LIMIT_ENABLED?.trim().toLowerCase();
  if (process.env.NODE_ENV === "production") return true;
  if (configured === "true" || configured === "1") return true;
  if (configured === "false" || configured === "0") return false;
  return false;
}

function numberFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export const adminLoginRateLimitConfig = {
  maxAttempts: numberFromEnv("ADMIN_LOGIN_RATE_LIMIT_MAX", DEFAULT_ADMIN_LOGIN_RATE_LIMIT_MAX),
  windowSeconds: numberFromEnv("ADMIN_LOGIN_RATE_LIMIT_WINDOW_SECONDS", DEFAULT_ADMIN_LOGIN_RATE_LIMIT_WINDOW_SECONDS),
};

function keyHashes(email: string, ipAddress?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedIp = ipAddress?.trim() || "unknown";
  return [
    createHash("sha256").update(`admin-login-email:${normalizedEmail}`).digest("hex"),
    createHash("sha256").update(`admin-login-ip:${normalizedIp}`).digest("hex"),
  ];
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function isAdminLoginBlocked(email: string, ipAddress?: string) {
  if (!isAdminLoginRateLimitEnabled()) return false;
  const records = await prisma.adminLoginRateLimit.findMany({ where: { keyHash: { in: keyHashes(email, ipAddress) } }, select: { blockedUntil: true } });
  const now = new Date();
  return records.some((record) => Boolean(record.blockedUntil && record.blockedUntil > now));
}

export async function recordAdminLoginFailure(email: string, ipAddress?: string) {
  if (!isAdminLoginRateLimitEnabled()) return;

  await Promise.all(keyHashes(email, ipAddress).map((hash) => recordFailureForKey(hash)));
}

async function recordFailureForKey(hash: string) {

  const now = new Date();
  try {
    await prisma.adminLoginRateLimit.create({
      data: { keyHash: hash, attempts: 1, windowStartedAt: now, blockedUntil: null },
    });
    return;
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
  }

  const windowStart = new Date(now.getTime() - adminLoginRateLimitConfig.windowSeconds * 1000);
  const reset = await prisma.adminLoginRateLimit.updateMany({
    where: { keyHash: hash, windowStartedAt: { lte: windowStart } },
    data: { attempts: 1, windowStartedAt: now, blockedUntil: null },
  });
  if (reset.count === 1) return;

  const incremented = await prisma.adminLoginRateLimit.updateMany({
    where: { keyHash: hash, windowStartedAt: { gt: windowStart }, blockedUntil: null },
    data: { attempts: { increment: 1 } },
  });
  if (incremented.count === 1) {
    await prisma.adminLoginRateLimit.updateMany({
      where: { keyHash: hash, blockedUntil: null, attempts: { gte: adminLoginRateLimitConfig.maxAttempts } },
      data: { blockedUntil: new Date(now.getTime() + adminLoginRateLimitConfig.windowSeconds * 1000) },
    });
  }
}

export async function clearAdminLoginFailures(email: string, ipAddress?: string) {
  if (!isAdminLoginRateLimitEnabled()) return;
  await prisma.adminLoginRateLimit.deleteMany({ where: { keyHash: { in: keyHashes(email, ipAddress) } } });
}
