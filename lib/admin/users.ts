import { RoleName, UserStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";
import { hashPassword } from "@/lib/auth/password";

const adminRoleNames = [RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.CONTENT_MANAGER, RoleName.SUPPORT, RoleName.INSTRUCTOR, RoleName.THERAPIST];
const publicUserWhere = {
  roles: {
    some: { role: { name: RoleName.USER } },
    none: { role: { name: { in: adminRoleNames } } },
  },
} as const;

const sortMap = {
  createdAt: { createdAt: "desc" as const },
  email: { email: "asc" as const },
  status: { status: "asc" as const },
} as const;

export type AdminUserListRow = {
  id: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
  name: string;
  phone: string;
};

function userName(profile: { displayName: string | null; firstName: string | null; lastName: string | null } | null) {
  return profile?.displayName || [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "بدون نام";
}

function userWhere(query: AdminListQuery, status?: UserStatus) {
  const search = query.search;
  return {
    AND: [
      publicUserWhere,
      status ? { status } : {},
      search ? {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { profile: { is: { displayName: { contains: search, mode: "insensitive" as const } } } },
          { profile: { is: { firstName: { contains: search, mode: "insensitive" as const } } } },
          { profile: { is: { lastName: { contains: search, mode: "insensitive" as const } } } },
          { profile: { is: { phone: { contains: search, mode: "insensitive" as const } } } },
        ],
      } : {},
    ],
  };
}

export async function listAdminUsers(query: AdminListQuery, status?: UserStatus) {
  const where = userWhere(query, status);
  const orderBy = sortMap[query.sort as keyof typeof sortMap] ?? sortMap.createdAt;
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
      skip: paginationOffset(query),
      take: query.pageSize,
      select: { id: true, email: true, status: true, createdAt: true, profile: { select: { displayName: true, firstName: true, lastName: true, phone: true } } },
    }),
  ]);

  return {
    rows: users.map((user): AdminUserListRow => ({ id: user.id, email: user.email, status: user.status, createdAt: user.createdAt, name: userName(user.profile), phone: user.profile?.phone ?? "—" })),
    meta: pageMeta(total, query),
  };
}

export async function getAdminUserDetail(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, ...publicUserWhere },
    select: {
      id: true,
      email: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      profile: { select: { firstName: true, lastName: true, displayName: true, phone: true, country: true, avatarUrl: true } },
      roles: { where: { role: { name: RoleName.USER } }, select: { role: { select: { name: true } } } },
      entitlements: { orderBy: { createdAt: "desc" }, take: 8, select: { id: true, status: true, totalSessions: true, createdAt: true, product: { select: { title: true, kind: true } } } },
      appointments: { orderBy: { startsAt: "desc" }, take: 8, select: { id: true, status: true, startsAt: true, endsAt: true, meetingUrl: true, notes: true, product: { select: { title: true } }, specialist: { select: { displayName: true } } } },
    },
  });

  if (!user) throw new AdminServiceError("NOT_FOUND", "کاربر پیدا نشد.");
  return {
    ...user,
    name: userName(user.profile),
    entitlements: user.entitlements,
  };
}

export async function updateAdminUserStatus(userId: string, actorId: string, status: UserStatus, reason: string) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "برای تغییر وضعیت کاربر، دلیل را وارد کنید.");
  const allowedStatuses: UserStatus[] = [UserStatus.ACTIVE, UserStatus.SUSPENDED];
  if (!allowedStatuses.includes(status)) throw new AdminServiceError("VALIDATION_ERROR", "وضعیت کاربر معتبر نیست.");

  return prisma.$transaction(async (tx) => {
    const before = await tx.user.findFirst({ where: { id: userId, ...publicUserWhere }, select: { id: true, status: true } });
    if (!before) throw new AdminServiceError("NOT_FOUND", "کاربر پیدا نشد.");
    if (before.status === status) throw new AdminServiceError("CONFLICT", "کاربر از قبل همین وضعیت را دارد.");

    const changed = await tx.user.updateMany({ where: { id: userId, status: before.status }, data: { status } });
    if (changed.count !== 1) throw new AdminServiceError("CONFLICT", "وضعیت کاربر هم‌زمان توسط کاربر دیگری تغییر کرده است.");
    const updated = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, status: true } });
    if (status === UserStatus.SUSPENDED || status === UserStatus.ARCHIVED) {
      await tx.authSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    await recordAdminAuditWithClient(tx, {
      actorId,
      action: status === UserStatus.SUSPENDED ? "USER_SUSPENDED" : "USER_RESTORED",
      targetType: "USER",
      targetId: userId,
      beforeState: before,
      afterState: updated,
      reason: trimmedReason,
    });
    return updated;
  });
}

function publicProfileData(input: { firstName: string; lastName: string; phone: string; country: string }) {
  return {
    firstName: input.firstName.trim() || null,
    lastName: input.lastName.trim() || null,
    phone: input.phone.trim() || null,
    country: input.country.trim() || null,
  };
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function createAdminPublicUser(actorId: string, input: { email: string; password: string; firstName: string; lastName: string; phone: string; country: string }) {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);
  try {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          status: UserStatus.ACTIVE,
          profile: { create: { ...publicProfileData(input), displayName: null } },
          roles: { create: { role: { connectOrCreate: { where: { name: RoleName.USER }, create: { name: RoleName.USER } } } } },
        },
        select: { id: true, email: true, status: true, createdAt: true },
      });
      await recordAdminAuditWithClient(tx, { actorId, action: "USER_CREATED_BY_ADMIN", targetType: "USER", targetId: created.id, afterState: { email: created.email, status: created.status } });
      return created;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new AdminServiceError("CONFLICT", "کاربری با این ایمیل از قبل وجود دارد.");
    throw error;
  }
}

export async function updateAdminPublicUser(actorId: string, userId: string, input: { email: string; firstName: string; lastName: string; phone: string; country: string }) {
  const email = input.email.trim().toLowerCase();
  try {
    return await prisma.$transaction(async (tx) => {
      const before = await tx.user.findFirst({ where: { id: userId, ...publicUserWhere }, select: { id: true, email: true, status: true, profile: { select: { firstName: true, lastName: true, displayName: true, phone: true, country: true } } } });
      if (!before) throw new AdminServiceError("NOT_FOUND", "کاربر پیدا نشد.");
      const updated = await tx.user.update({
        where: { id: userId },
        data: { email, profile: { upsert: { create: { ...publicProfileData(input), displayName: null }, update: publicProfileData(input) } } },
        select: { id: true, email: true, status: true, profile: { select: { firstName: true, lastName: true, displayName: true, phone: true, country: true } } },
      });
      if (email !== before.email) await tx.authSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
      await recordAdminAuditWithClient(tx, { actorId, action: "USER_PROFILE_UPDATED", targetType: "USER", targetId: userId, beforeState: before, afterState: updated });
      return updated;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new AdminServiceError("CONFLICT", "این ایمیل برای کاربر دیگری ثبت شده است.");
    throw error;
  }
}

export async function setAdminPublicUserPassword(actorId: string, userId: string, password: string, reason: string) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر رمز را وارد کنید.");
  const passwordHash = await hashPassword(password);
  return prisma.$transaction(async (tx) => {
    const before = await tx.user.findFirst({ where: { id: userId, ...publicUserWhere }, select: { id: true, email: true, status: true } });
    if (!before) throw new AdminServiceError("NOT_FOUND", "کاربر پیدا نشد.");
    await tx.user.update({ where: { id: userId }, data: { passwordHash } });
    const revoked = await tx.authSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await recordAdminAuditWithClient(tx, { actorId, action: "USER_PASSWORD_RESET", targetType: "USER", targetId: userId, beforeState: { email: before.email }, afterState: { sessionsRevoked: revoked.count }, reason: trimmedReason });
    return { id: userId, sessionsRevoked: revoked.count };
  });
}
