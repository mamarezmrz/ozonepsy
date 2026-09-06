import { AuthTokenType, UserStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, hashSessionToken } from "@/lib/auth/session";
import { AuthRateLimitError, assertAuthRateLimit, recordAuthFailure, recordAuthFailures } from "@/lib/auth/rate-limit";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";

function tokenTtlSeconds() {
  const configured = Number(process.env.PASSWORD_RESET_TOKEN_TTL_SECONDS);
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : 30 * 60;
}

export class PasswordResetError extends Error {
  constructor(message = "لینک بازیابی رمز معتبر نیست یا منقضی شده است.") {
    super(message);
    this.name = "PasswordResetError";
  }
}

export async function requestPasswordReset(email: string, ipAddress: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedIp = ipAddress.trim() || "unknown";
  await assertAuthRateLimit("password-reset-email", normalizedEmail);
  await assertAuthRateLimit("password-reset-ip", normalizedIp);

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true, status: true } });
  if (!user || user.status === UserStatus.ARCHIVED) {
    await recordAuthFailures("password-reset-email", [normalizedEmail]);
    await recordAuthFailure("password-reset-ip", normalizedIp);
    return { token: null };
  }

  const token = createSessionToken();
  await prisma.$transaction(async (tx) => {
    await tx.authToken.updateMany({
      where: { userId: user.id, type: AuthTokenType.PASSWORD_RESET, usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.authToken.create({
      data: {
        userId: user.id,
        type: AuthTokenType.PASSWORD_RESET,
        tokenHash: hashSessionToken(token),
        expiresAt: new Date(Date.now() + tokenTtlSeconds() * 1000),
      },
    });
  });
  return { token };
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = hashSessionToken(token.trim());
  const passwordHash = await hashPassword(password);

  try {
    await prisma.$transaction(async (tx) => {
      const authToken = await tx.authToken.findFirst({
        where: { tokenHash, type: AuthTokenType.PASSWORD_RESET, usedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true, userId: true },
      });
      if (!authToken) throw new PasswordResetError();

      const consumed = await tx.authToken.updateMany({
        where: { id: authToken.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) throw new PasswordResetError();

      const user = await tx.user.update({ where: { id: authToken.userId }, data: { passwordHash }, select: { id: true, status: true } });
      await tx.authSession.updateMany({ where: { userId: authToken.userId, revokedAt: null }, data: { revokedAt: new Date() } });
      await recordAdminAuditWithClient(tx, {
        actorId: user.id,
        action: "USER_PASSWORD_RESET",
        targetType: "USER",
        targetId: user.id,
        afterState: { status: user.status },
      });
    });
  } catch (error) {
    if (error instanceof PasswordResetError) throw error;
    throw new PasswordResetError();
  }
}

export async function verifyEmail(token: string) {
  const tokenHash = hashSessionToken(token.trim());
  await prisma.$transaction(async (tx) => {
    const authToken = await tx.authToken.findFirst({
      where: { tokenHash, type: AuthTokenType.EMAIL_VERIFICATION, usedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userId: true },
    });
    if (!authToken) throw new PasswordResetError("لینک تأیید ایمیل معتبر نیست یا منقضی شده است.");

    const consumed = await tx.authToken.updateMany({ where: { id: authToken.id, usedAt: null }, data: { usedAt: new Date() } });
    if (consumed.count !== 1) throw new PasswordResetError("لینک تأیید ایمیل معتبر نیست یا منقضی شده است.");
    await tx.user.update({ where: { id: authToken.userId }, data: { emailVerifiedAt: new Date() } });
    await recordAdminAuditWithClient(tx, {
      actorId: authToken.userId,
      action: "USER_EMAIL_VERIFIED",
      targetType: "USER",
      targetId: authToken.userId,
    });
  });
}

export function passwordResetDevTokenEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_EXPOSE_RESET_TOKEN === "true";
}

export { AuthRateLimitError };
