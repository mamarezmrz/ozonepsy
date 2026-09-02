import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

const DEFAULT_MAX_ATTEMPTS = 10;
const DEFAULT_WINDOW_SECONDS = 15 * 60;

function positiveEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export const authRateLimitConfig = {
  maxAttempts: positiveEnv("AUTH_RATE_LIMIT_MAX", DEFAULT_MAX_ATTEMPTS),
  windowSeconds: positiveEnv("AUTH_RATE_LIMIT_WINDOW_SECONDS", DEFAULT_WINDOW_SECONDS),
};

function enabled() {
  const configured = process.env.AUTH_RATE_LIMIT_ENABLED?.trim().toLowerCase();
  if (process.env.NODE_ENV === "production") return true;
  if (configured === "true" || configured === "1") return true;
  if (configured === "false" || configured === "0") return false;
  return true;
}

function hashKey(scope: string, identifier: string) {
  return createHash("sha256").update(`auth:${scope}:${identifier.trim().toLowerCase()}`).digest("hex");
}

async function findRecord(scope: string, identifier: string) {
  return prisma.adminLoginRateLimit.findUnique({ where: { keyHash: hashKey(scope, identifier) } });
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function isAuthRateLimited(scope: string, identifier: string) {
  if (!enabled()) return false;
  const record = await findRecord(scope, identifier);
  return Boolean(record?.blockedUntil && record.blockedUntil > new Date());
}

export async function recordAuthFailure(scope: string, identifier: string) {
  if (!enabled()) return;

  const now = new Date();
  const keyHash = hashKey(scope, identifier);
  try {
    await prisma.adminLoginRateLimit.create({
      data: { keyHash, attempts: 1, windowStartedAt: now, blockedUntil: null },
    });
    return;
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
  }

  const windowStart = new Date(now.getTime() - authRateLimitConfig.windowSeconds * 1000);
  const reset = await prisma.adminLoginRateLimit.updateMany({
    where: { keyHash, windowStartedAt: { lte: windowStart } },
    data: { attempts: 1, windowStartedAt: now, blockedUntil: null },
  });
  if (reset.count === 1) return;

  const incremented = await prisma.adminLoginRateLimit.updateMany({
    where: { keyHash, windowStartedAt: { gt: windowStart }, blockedUntil: null },
    data: { attempts: { increment: 1 } },
  });
  if (incremented.count === 1) {
    await prisma.adminLoginRateLimit.updateMany({
      where: { keyHash, blockedUntil: null, attempts: { gte: authRateLimitConfig.maxAttempts } },
      data: { blockedUntil: new Date(now.getTime() + authRateLimitConfig.windowSeconds * 1000) },
    });
  }
}

export async function clearAuthFailures(scope: string, identifier: string) {
  if (!enabled()) return;
  await prisma.adminLoginRateLimit.deleteMany({ where: { keyHash: hashKey(scope, identifier) } });
}

export async function assertAuthRateLimit(scope: string, identifiers: string | string[]) {
  const values = Array.isArray(identifiers) ? identifiers : [identifiers];
  for (const identifier of values) {
    if (await isAuthRateLimited(scope, identifier)) {
      throw new AuthRateLimitError();
    }
  }
}

export async function recordAuthFailures(scope: string, identifiers: string[]) {
  await Promise.all(identifiers.map((identifier) => recordAuthFailure(scope, identifier)));
}

export async function clearAuthFailureBuckets(scope: string, identifiers: string[]) {
  await Promise.all(identifiers.map((identifier) => clearAuthFailures(scope, identifier)));
}

export class AuthRateLimitError extends Error {
  constructor() {
    super("تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.");
    this.name = "AuthRateLimitError";
  }
}
