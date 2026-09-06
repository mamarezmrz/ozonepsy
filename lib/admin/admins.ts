import { randomUUID } from "node:crypto";
import { RoleName, UserStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { ADMIN_ROLES, type AdminRole } from "@/lib/admin/constants";
import { canManageAdmins, canManageAdminTarget, requireAdminRoleFromSession } from "@/lib/admin/authorization";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";
import type { AdminSessionView } from "@/lib/admin/session";
import { hashSessionToken } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

const adminRoleValues = ADMIN_ROLES as unknown as RoleName[];
const inviteTtlSeconds = 48 * 60 * 60;

function assertAdminManagement(session: AdminSessionView) {
  requireAdminRoleFromSession(session, "SUPER_ADMIN");
  if (!canManageAdmins(session)) throw new AdminServiceError("FORBIDDEN", "مجوز مدیریت ادمین‌ها را ندارید.");
}

function displayName(profile: { displayName: string | null; firstName: string | null; lastName: string | null } | null) {
  return profile?.displayName || [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "بدون نام";
}

export async function listAdminUsers(query: AdminListQuery, session: AdminSessionView) {
  assertAdminManagement(session);
  const search = query.search;
  const where = {
    roles: { some: { role: { name: { in: adminRoleValues } } } },
    ...(search ? { OR: [{ email: { contains: search, mode: "insensitive" as const } }, { profile: { is: { displayName: { contains: search, mode: "insensitive" as const } } } }, { profile: { is: { firstName: { contains: search, mode: "insensitive" as const } } } }, { profile: { is: { lastName: { contains: search, mode: "insensitive" as const } } } }] } : {}),
  };
  const orderBy = query.sort === "email" ? { email: query.direction } : query.sort === "status" ? { status: query.direction } : { createdAt: query.direction };
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy, skip: paginationOffset(query), take: query.pageSize, select: { id: true, email: true, status: true, createdAt: true, profile: { select: { displayName: true, firstName: true, lastName: true } }, roles: { where: { role: { name: { in: adminRoleValues } } }, select: { role: { select: { name: true } } } } } }),
  ]);
  return { rows: rows.map((row) => ({ id: row.id, email: row.email, status: row.status, createdAt: row.createdAt, name: displayName(row.profile), roles: row.roles.map(({ role }) => role.name as AdminRole) })), meta: pageMeta(total, query) };
}

export async function getAdminUser(id: string, session: AdminSessionView) {
  assertAdminManagement(session);
  const user = await prisma.user.findFirst({ where: { id, roles: { some: { role: { name: { in: adminRoleValues } } } } }, select: { id: true, email: true, status: true, createdAt: true, updatedAt: true, profile: { select: { firstName: true, lastName: true, displayName: true, phone: true, country: true, avatarUrl: true } }, roles: { where: { role: { name: { in: adminRoleValues } } }, select: { role: { select: { name: true } } } }, adminSessions: { where: { revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { lastSeenAt: "desc" }, take: 10, select: { id: true, createdAt: true, lastSeenAt: true, expiresAt: true, ipAddress: true, userAgent: true } } } });
  if (!user) throw new AdminServiceError("NOT_FOUND", "ادمین پیدا نشد.");
  return { ...user, name: displayName(user.profile), roles: user.roles.map(({ role }) => role.name as AdminRole) };
}

export async function createAdminInvite(session: AdminSessionView, input: { email: string; role: AdminRole; reason?: string }) {
  assertAdminManagement(session);
  const email = input.email.trim().toLowerCase();
  const role = input.role as RoleName;
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, status: true, roles: { select: { role: { select: { name: true } } } } } });
  if (existing?.status === UserStatus.ARCHIVED) throw new AdminServiceError("CONFLICT", "این کاربر بایگانی شده است.");
  if (existing?.roles.some(({ role: item }) => adminRoleValues.includes(item.name))) throw new AdminServiceError("CONFLICT", "این کاربر از قبل ادمین است.");

  const rawToken = randomUUID().replaceAll("-", "") + randomUUID().replaceAll("-", "");
  const expiresAt = new Date(Date.now() + inviteTtlSeconds * 1000);
  const invite = await prisma.$transaction(async (tx) => {
    await tx.adminInvite.updateMany({ where: { email, usedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
    const created = await tx.adminInvite.create({ data: { email, role, tokenHash: hashSessionToken(rawToken), expiresAt, createdById: session.userId }, select: { id: true, email: true, role: true, expiresAt: true } });
    await recordAdminAuditWithClient(tx, { actorId: session.userId, action: "ADMIN_INVITE_CREATED", targetType: "ADMIN_INVITE", targetId: created.id, afterState: { email: created.email, role: created.role, expiresAt: created.expiresAt.toISOString() }, reason: input.reason?.trim() || undefined });
    return created;
  });
  // This is the browser path on the admin host. proxy.ts maps it to the
  // internal /admin/invite route.
  return { ...invite, invitePath: `/invite/${rawToken}` };
}

export async function acceptAdminInvite(token: string, password: string, firstName: string, lastName: string) {
  const tokenHash = hashSessionToken(token.trim());
  const passwordHash = await hashPassword(password);
  return prisma.$transaction(async (tx) => {
    const invite = await tx.adminInvite.findFirst({ where: { tokenHash, usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } }, select: { id: true, email: true, role: true } });
    if (!invite) throw new AdminServiceError("NOT_FOUND", "دعوت‌نامه معتبر نیست یا منقضی شده است.");
    const existing = await tx.user.findUnique({ where: { email: invite.email }, select: { id: true, status: true } });
    let userId: string;
    if (existing) {
      if (existing.status === UserStatus.ARCHIVED) throw new AdminServiceError("CONFLICT", "این حساب بایگانی شده است.");
      userId = existing.id;
      await tx.user.update({ where: { id: userId }, data: { passwordHash, status: UserStatus.ACTIVE, profile: { upsert: { create: { firstName: firstName || null, lastName: lastName || null }, update: { firstName: firstName || undefined, lastName: lastName || undefined } } } } });
    } else {
      const user = await tx.user.create({ data: { email: invite.email, passwordHash, status: UserStatus.ACTIVE, profile: { create: { firstName: firstName || null, lastName: lastName || null } } }, select: { id: true } });
      userId = user.id;
    }
    const role = await tx.role.findUniqueOrThrow({ where: { name: invite.role }, select: { id: true } });
    await tx.userRole.upsert({ where: { userId_roleId: { userId, roleId: role.id } }, update: {}, create: { userId, roleId: role.id } });
    const used = await tx.adminInvite.updateMany({ where: { id: invite.id, usedAt: null, revokedAt: null }, data: { usedAt: new Date(), acceptedUserId: userId } });
    if (used.count !== 1) throw new AdminServiceError("CONFLICT", "دعوت‌نامه قبلاً استفاده شده است.");
    await recordAdminAuditWithClient(tx, { actorId: userId, action: "ADMIN_INVITE_ACCEPTED", targetType: "ADMIN_INVITE", targetId: invite.id, afterState: { userId, role: invite.role } });
    return { userId, email: invite.email, role: invite.role };
  });
}

export async function changeAdminRole(session: AdminSessionView, targetId: string, nextRole: AdminRole, reason: string) {
  assertAdminManagement(session);
  if (targetId === session.userId) throw new AdminServiceError("FORBIDDEN", "نمی‌توانید نقش خودتان را تغییر دهید.");
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر نقش الزامی است.");
  return prisma.$transaction(async (tx) => {
    const target = await tx.user.findFirst({ where: { id: targetId, roles: { some: { role: { name: { in: adminRoleValues } } } } }, select: { id: true, roles: { select: { role: { select: { name: true } } } } } });
    if (!target) throw new AdminServiceError("NOT_FOUND", "ادمین پیدا نشد.");
    const roles = target.roles.map(({ role }) => role.name);
    const isLastSuperAdmin = roles.includes(RoleName.SUPER_ADMIN) && await tx.user.count({ where: { status: UserStatus.ACTIVE, roles: { some: { role: { name: RoleName.SUPER_ADMIN } } } } }) === 1;
    if (!canManageAdminTarget(session, { roles, isLastSuperAdmin })) throw new AdminServiceError("FORBIDDEN", "این تغییر نقش مجاز نیست.");
    const role = await tx.role.findUniqueOrThrow({ where: { name: nextRole as RoleName }, select: { id: true } });
    await tx.userRole.deleteMany({ where: { userId: targetId, role: { name: { in: adminRoleValues } } } });
    await tx.userRole.create({ data: { userId: targetId, roleId: role.id } });
    await tx.adminSession.updateMany({ where: { userId: targetId, revokedAt: null }, data: { revokedAt: new Date() } });
    await recordAdminAuditWithClient(tx, { actorId: session.userId, action: "ADMIN_ROLE_CHANGED", targetType: "ADMIN", targetId, beforeState: { roles }, afterState: { roles: [nextRole] }, reason: trimmedReason });
    return { id: targetId, role: nextRole };
  });
}

export async function setAdminStatus(session: AdminSessionView, targetId: string, status: "ACTIVE" | "SUSPENDED", reason: string) {
  assertAdminManagement(session);
  if (targetId === session.userId) throw new AdminServiceError("FORBIDDEN", "نمی‌توانید وضعیت خودتان را تغییر دهید.");
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر وضعیت الزامی است.");
  return prisma.$transaction(async (tx) => {
    const target = await tx.user.findFirst({ where: { id: targetId, roles: { some: { role: { name: { in: adminRoleValues } } } } }, select: { id: true, status: true, roles: { select: { role: { select: { name: true } } } } } });
    if (!target) throw new AdminServiceError("NOT_FOUND", "ادمین پیدا نشد.");
    const roles = target.roles.map(({ role }) => role.name);
    const isLastSuperAdmin = roles.includes(RoleName.SUPER_ADMIN) && await tx.user.count({ where: { status: UserStatus.ACTIVE, roles: { some: { role: { name: RoleName.SUPER_ADMIN } } } } }) === 1;
    if (!canManageAdminTarget(session, { roles, isLastSuperAdmin })) throw new AdminServiceError("FORBIDDEN", "این تغییر وضعیت مجاز نیست.");
    if (target.status === status) throw new AdminServiceError("CONFLICT", "ادمین از قبل همین وضعیت را دارد.");
    const nextStatus = status === "ACTIVE" ? UserStatus.ACTIVE : UserStatus.SUSPENDED;
    const changed = await tx.user.updateMany({ where: { id: targetId, status: target.status }, data: { status: nextStatus } });
    if (changed.count !== 1) throw new AdminServiceError("CONFLICT", "وضعیت ادمین هم‌زمان توسط کاربر دیگری تغییر کرده است.");
    const updated = await tx.user.findUniqueOrThrow({ where: { id: targetId }, select: { id: true, status: true } });
    if (status === "SUSPENDED") {
      await tx.adminSession.updateMany({ where: { userId: targetId, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.authSession.updateMany({ where: { userId: targetId, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    await recordAdminAuditWithClient(tx, { actorId: session.userId, action: status === "ACTIVE" ? "ADMIN_REENABLED" : "ADMIN_DISABLED", targetType: "ADMIN", targetId, beforeState: { status: target.status, roles }, afterState: updated, reason: trimmedReason });
    return updated;
  });
}
