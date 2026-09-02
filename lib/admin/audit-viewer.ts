import { prisma } from "@/lib/prisma";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";
import { AuditResult, RoleName } from "@/lib/generated/prisma/enums";

const adminRoleNames = [RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.CONTENT_MANAGER, RoleName.SUPPORT, RoleName.INSTRUCTOR];
const publicUserWhere = { roles: { some: { role: { name: RoleName.USER } }, none: { role: { name: { in: adminRoleNames } } } } } as const;

export type AdminAuditFilters = { user?: string; result?: AuditResult; from?: Date; to?: Date };

type UserActivityRow = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  result: AuditResult;
  reason: string | null;
  createdAt: Date;
};

const actionLabels: Record<string, string> = {
  USER_REGISTERED: "ثبت‌نام کاربر",
  USER_LOGIN: "ورود کاربر",
  USER_PASSWORD_RESET: "بازیابی رمز کاربر",
  USER_EMAIL_VERIFIED: "تأیید ایمیل کاربر",
  USER_SUSPENDED: "تعلیق کاربر",
  USER_ARCHIVED: "بایگانی کاربر",
  USER_RESTORED: "فعال‌سازی کاربر",
};

function getUserName(profile: { displayName: string | null; firstName: string | null; lastName: string | null } | null) {
  return profile?.displayName || [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "بدون نام";
}

export async function listAdminAuditLogs(query: AdminListQuery, filters: AdminAuditFilters = {}) {
  const userSearch = (filters.user || query.search).trim();
  const matchingUsers = userSearch
    ? await prisma.user.findMany({
        where: {
          AND: [
            publicUserWhere,
            { OR: [
              { email: { contains: userSearch, mode: "insensitive" as const } },
              { profile: { is: { displayName: { contains: userSearch, mode: "insensitive" as const } } } },
              { profile: { is: { firstName: { contains: userSearch, mode: "insensitive" as const } } } },
              { profile: { is: { lastName: { contains: userSearch, mode: "insensitive" as const } } } },
            ] },
          ],
        },
        select: { id: true },
      })
    : [];
  const matchingUserIds = matchingUsers.map((user) => user.id);
  const where = {
    AND: [
      { targetType: "USER" },
      filters.result ? { result: filters.result } : {},
      filters.from || filters.to ? { createdAt: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } } : {},
      userSearch ? { targetId: { in: matchingUserIds } } : {},
    ],
  };
  const [total, auditRows] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: paginationOffset(query),
      take: query.pageSize,
      select: { id: true, targetId: true, action: true, result: true, reason: true, createdAt: true },
    }),
  ]);
  const targetIds = [...new Set(auditRows.map((row) => row.targetId).filter((id) => /^[0-9a-f-]{36}$/i.test(id)))];
  const targetUsers = targetIds.length
    ? await prisma.user.findMany({ where: { id: { in: targetIds }, ...publicUserWhere }, select: { id: true, email: true, profile: { select: { displayName: true, firstName: true, lastName: true } } } })
    : [];
  const targetUserMap = new Map(targetUsers.map((user) => [user.id, user]));
  const rows = auditRows.flatMap((row): UserActivityRow[] => {
    const user = targetUserMap.get(row.targetId);
    return user ? [{ id: row.id, userId: user.id, userName: getUserName(user.profile), userEmail: user.email, action: actionLabels[row.action] || row.action, result: row.result, reason: row.reason, createdAt: row.createdAt }] : [];
  });
  return { rows, meta: pageMeta(total, query) };
}
