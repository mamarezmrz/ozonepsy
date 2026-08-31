import { RoleName, UserStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import {
  ADMIN_ROLES,
  type AdminRole,
} from "@/lib/admin/constants";
import {
  clearAdminLoginFailures,
  isAdminLoginBlocked,
  recordAdminLoginFailure,
} from "@/lib/admin/rate-limit";
import {
  adminSessionConfig,
  revokeCurrentAdminSession,
  setAdminSessionCookie,
} from "@/lib/admin/session";
import { createSessionToken, hashSessionToken } from "@/lib/auth/session";

const adminRoleNames = ADMIN_ROLES as unknown as RoleName[];

export type AdminAuthMetadata = {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
};

export class AdminAuthenticationError extends Error {
  constructor(
    public readonly code: "INVALID_CREDENTIALS" | "RATE_LIMITED" | "INVALID_REQUEST",
    message: string,
  ) {
    super(message);
  }
}

const invalidCredentialsMessage = "ایمیل یا رمز ورود نادرست است.";

export async function loginAdmin(email: string, password: string, metadata: AdminAuthMetadata) {
  const normalizedEmail = email.trim().toLowerCase();

  if (await isAdminLoginBlocked(normalizedEmail, metadata.ipAddress)) {
    throw new AdminAuthenticationError("RATE_LIMITED", "تعداد تلاش‌های ورود بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.");
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      status: true,
      profile: { select: { displayName: true } },
      roles: {
        where: { role: { name: { in: adminRoleNames } } },
        select: {
          role: {
            select: {
              name: true,
              rolePermissions: { select: { permission: { select: { key: true } } } },
            },
          },
        },
      },
    },
  });

  const hasAdminRole = user?.roles.some(({ role }) => ADMIN_ROLES.includes(role.name as AdminRole));
  const validPassword = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || user.status !== UserStatus.ACTIVE || !hasAdminRole || !validPassword) {
    await recordAdminLoginFailure(normalizedEmail, metadata.ipAddress);
    throw new AdminAuthenticationError("INVALID_CREDENTIALS", invalidCredentialsMessage);
  }

  await clearAdminLoginFailures(normalizedEmail, metadata.ipAddress);
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + adminSessionConfig.ttlSeconds * 1000);
  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.adminSession.create({
      data: {
        userId: user.id,
        tokenHash: hashSessionToken(token),
        expiresAt,
        lastSeenAt: new Date(),
        ipAddress: metadata.ipAddress?.slice(0, 64),
        userAgent: metadata.userAgent?.slice(0, 500),
      },
      select: { id: true, expiresAt: true },
    });
    await recordAdminAuditWithClient(tx, {
      actorId: user.id,
      action: "admin.session.login",
      targetType: "ADMIN_SESSION",
      targetId: created.id,
      afterState: { userId: user.id, expiresAt: created.expiresAt.toISOString() },
      requestId: metadata.requestId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
    return created;
  });
  await setAdminSessionCookie(token);

  return {
    user: { id: user.id, email: user.email, displayName: user.profile?.displayName ?? null },
      expiresAt: session.expiresAt,
  };
}

export async function logoutAdmin() {
  return revokeCurrentAdminSession();
}
