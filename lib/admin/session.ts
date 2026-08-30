import { cookies } from "next/headers";
import { RoleName, UserStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashSessionToken } from "@/lib/auth/session";
import {
  ADMIN_ROLES,
  ADMIN_SESSION_COOKIE,
  DEFAULT_ADMIN_IDLE_TTL_SECONDS,
  DEFAULT_ADMIN_SESSION_TTL_SECONDS,
  type AdminRole,
} from "@/lib/admin/constants";
import { AdminAuthorizationError, isAdminRole } from "@/lib/admin/authorization";

const adminRoleNames = ADMIN_ROLES as unknown as RoleName[];

function positiveNumberFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export const adminSessionConfig = {
  ttlSeconds: positiveNumberFromEnv("ADMIN_SESSION_TTL_SECONDS", DEFAULT_ADMIN_SESSION_TTL_SECONDS),
  idleTtlSeconds: positiveNumberFromEnv("ADMIN_IDLE_TTL_SECONDS", DEFAULT_ADMIN_IDLE_TTL_SECONDS),
};

export type AdminSessionView = {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  roles: AdminRole[];
  permissions: string[];
  expiresAt: Date;
};

type SessionMetadata = {
  ipAddress?: string;
  userAgent?: string;
};

function adminCookieOptions(maxAge: number) {
  return {
    name: ADMIN_SESSION_COOKIE,
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function setAdminSessionCookie(token: string, maxAge = adminSessionConfig.ttlSeconds) {
  const cookieStore = await cookies();
  cookieStore.set({ ...adminCookieOptions(maxAge), value: token });
}

export async function getAdminSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function createAdminSession(userId: string, metadata: SessionMetadata) {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + adminSessionConfig.ttlSeconds * 1000);
  const session = await prisma.adminSession.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
      lastSeenAt: new Date(),
      ipAddress: metadata.ipAddress?.slice(0, 64),
      userAgent: metadata.userAgent?.slice(0, 500),
    },
    select: { id: true, expiresAt: true },
  });

  await setAdminSessionCookie(token);
  return { token, ...session };
}

function toAdminSessionView(session: {
  id: string;
  userId: string;
  expiresAt: Date;
  user: {
    email: string;
    profile: { displayName: string | null; avatarUrl: string | null } | null;
    roles: Array<{
      role: {
        name: string;
        rolePermissions: Array<{ permission: { key: string } }>;
      };
    }>;
  };
}): AdminSessionView | null {
  const roles = session.user.roles
    .map(({ role }) => role.name)
    .filter(isAdminRole);

  if (roles.length === 0) return null;

  const permissions = Array.from(
    new Set(
      session.user.roles.flatMap(({ role }) => role.rolePermissions.map(({ permission }) => permission.key)),
    ),
  );

  return {
    id: session.id,
    userId: session.userId,
    email: session.user.email,
    displayName: session.user.profile?.displayName ?? null,
    avatarUrl: session.user.profile?.avatarUrl ?? null,
    roles,
    permissions,
    expiresAt: session.expiresAt,
  };
}

export async function getCurrentAdminSession(): Promise<AdminSessionView | null> {
  const token = await getAdminSessionToken();
  if (!token) return null;

  const now = new Date();
  const session = await prisma.adminSession.findFirst({
    where: {
      tokenHash: hashSessionToken(token),
      revokedAt: null,
      expiresAt: { gt: now },
      user: { status: UserStatus.ACTIVE },
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      lastSeenAt: true,
      user: {
        select: {
          email: true,
          profile: { select: { displayName: true, avatarUrl: true } },
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
      },
    },
  });

  if (!session) return null;

  if (session.lastSeenAt.getTime() + adminSessionConfig.idleTtlSeconds * 1000 <= now.getTime()) {
    await prisma.adminSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: now },
    });
    return null;
  }

  if (session.lastSeenAt.getTime() + 5 * 60 * 1000 <= now.getTime()) {
    await prisma.adminSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { lastSeenAt: now },
    });
  }

  return toAdminSessionView(session);
}

export async function requireAdminSession() {
  const session = await getCurrentAdminSession();
  if (!session) throw new AdminAuthorizationError("UNAUTHORIZED");
  return session;
}

export async function revokeCurrentAdminSession() {
  const token = await getAdminSessionToken();
  if (!token) {
    await clearAdminSessionCookie();
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const current = await prisma.adminSession.findFirst({
    where: { tokenHash },
    select: { id: true, userId: true, revokedAt: true },
  });

  if (current && !current.revokedAt) {
    await prisma.$transaction(async (tx) => {
      await tx.adminSession.updateMany({
        where: { id: current.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: current.userId,
          action: "admin.session.logout",
          targetType: "ADMIN_SESSION",
          targetId: current.id,
        },
      });
    });
  }

  await clearAdminSessionCookie();
  return current?.id ?? null;
}
