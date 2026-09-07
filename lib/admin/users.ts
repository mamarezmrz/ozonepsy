import { AppointmentStatus, RoleName, SessionUsageStatus, UserStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";

const adminRoleNames = [RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.CONTENT_MANAGER, RoleName.SUPPORT, RoleName.INSTRUCTOR];
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
      entitlements: { orderBy: { createdAt: "desc" }, take: 8, select: { id: true, status: true, totalSessions: true, createdAt: true, product: { select: { title: true, kind: true } }, usages: { where: { status: SessionUsageStatus.COMPLETED }, select: { id: true } }, appointments: { where: { status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED] } }, select: { id: true } } } },
      appointments: { orderBy: { startsAt: "desc" }, take: 8, select: { id: true, status: true, startsAt: true, endsAt: true, meetingUrl: true, product: { select: { title: true } }, specialist: { select: { displayName: true } } } },
    },
  });

  if (!user) throw new AdminServiceError("NOT_FOUND", "کاربر پیدا نشد.");
  return {
    ...user,
    name: userName(user.profile),
    entitlements: user.entitlements.map((entitlement) => ({
      ...entitlement,
      completedCount: entitlement.usages.length,
      reservedCount: entitlement.appointments.length,
      usages: undefined,
      appointments: undefined,
    })),
  };
}

export async function updateAdminUserStatus(userId: string, actorId: string, status: UserStatus, reason: string) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "برای تغییر وضعیت کاربر، دلیل را وارد کنید.");
  if (![UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.ARCHIVED].includes(status)) throw new AdminServiceError("VALIDATION_ERROR", "وضعیت کاربر معتبر نیست.");

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
      action: status === UserStatus.SUSPENDED ? "USER_SUSPENDED" : status === UserStatus.ARCHIVED ? "USER_ARCHIVED" : "USER_RESTORED",
      targetType: "USER",
      targetId: userId,
      beforeState: before,
      afterState: updated,
      reason: trimmedReason,
    });
    return updated;
  });
}
