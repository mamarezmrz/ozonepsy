import { AppointmentStatus, SessionUsageStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";
import type { AdminSessionView } from "@/lib/admin/session";

function scopeWhere(session?: AdminSessionView) {
  return session?.roles.length === 1 && session.roles[0] === "INSTRUCTOR" ? { specialist: { userId: session.userId } } : {};
}

export async function listAdminAppointments(query: AdminListQuery, filters: { status?: AppointmentStatus; specialistId?: string; from?: Date; to?: Date }, session?: AdminSessionView) {
  const where = {
    ...scopeWhere(session),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.specialistId ? { specialistId: filters.specialistId } : {}),
    ...(filters.from || filters.to ? { startsAt: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } } : {}),
    ...(query.search ? { OR: [
      { user: { email: { contains: query.search, mode: "insensitive" as const } } },
      { user: { profile: { is: { displayName: { contains: query.search, mode: "insensitive" as const } } } } },
      { product: { title: { contains: query.search, mode: "insensitive" as const } } },
      { specialist: { displayName: { contains: query.search, mode: "insensitive" as const } } },
    ] } : {}),
  };
  const orderBy = query.sort === "status" ? { status: query.direction } : query.sort === "createdAt" ? { createdAt: query.direction } : { startsAt: query.direction };
  const [total, rows] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({ where, orderBy, skip: paginationOffset(query), take: query.pageSize, select: { id: true, status: true, startsAt: true, endsAt: true, createdAt: true, user: { select: { id: true, email: true, profile: { select: { displayName: true, firstName: true, lastName: true } } } }, product: { select: { id: true, title: true, kind: true } }, specialist: { select: { id: true, displayName: true } }, usage: { select: { status: true } } } }),
  ]);
  return { rows, meta: pageMeta(total, query) };
}

export async function getAdminAppointment(id: string, session?: AdminSessionView) {
  const row = await prisma.appointment.findFirst({ where: { id, ...scopeWhere(session) }, select: { id: true, status: true, startsAt: true, endsAt: true, createdAt: true, updatedAt: true, entitlementId: true, user: { select: { id: true, email: true, profile: { select: { displayName: true, firstName: true, lastName: true, phone: true } } } }, product: { select: { id: true, title: true, slug: true, kind: true } }, specialist: { select: { id: true, displayName: true } }, entitlement: { select: { id: true, status: true, totalSessions: true, usages: { select: { id: true, status: true, recordedAt: true, reason: true } } } }, usage: { select: { id: true, status: true, recordedAt: true, reason: true, recordedById: true } } } });
  if (!row) throw new AdminServiceError("NOT_FOUND", "جلسه پیدا نشد.");
  return row;
}

export async function rescheduleAdminAppointment(actorId: string, id: string, startsAt: Date, endsAt: Date | null, reason: string, session?: AdminSessionView) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر زمان جلسه را وارد کنید.");
  if (startsAt.getTime() <= Date.now()) throw new AdminServiceError("VALIDATION_ERROR", "زمان شروع جلسه باید در آینده باشد.");
  if (endsAt && endsAt <= startsAt) throw new AdminServiceError("VALIDATION_ERROR", "زمان پایان باید بعد از زمان شروع باشد.");
  return prisma.$transaction(async (tx) => {
    const before = await tx.appointment.findFirst({ where: { id, ...scopeWhere(session) }, select: { id: true, status: true, startsAt: true, endsAt: true } });
    if (!before) throw new AdminServiceError("NOT_FOUND", "جلسه پیدا نشد.");
    if (([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELED] as AppointmentStatus[]).includes(before.status)) throw new AdminServiceError("CONFLICT", "جلسه انجام‌شده یا لغوشده قابل تغییر زمان نیست.");
    const updated = await tx.appointment.update({ where: { id }, data: { startsAt, endsAt, status: AppointmentStatus.RESCHEDULED }, select: { id: true, status: true, startsAt: true, endsAt: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: "APPOINTMENT_RESCHEDULED", targetType: "APPOINTMENT", targetId: id, beforeState: before, afterState: updated, reason: trimmedReason });
    return updated;
  });
}

export async function transitionAdminAppointment(actorId: string, id: string, status: AppointmentStatus, reason: string, session?: AdminSessionView) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر وضعیت جلسه را وارد کنید.");
  return prisma.$transaction(async (tx) => {
    const before = await tx.appointment.findFirst({ where: { id, ...scopeWhere(session) }, select: { id: true, status: true, entitlementId: true, usage: { select: { id: true, status: true } } } });
    if (!before) throw new AdminServiceError("NOT_FOUND", "جلسه پیدا نشد.");
    if (before.status === status) return before;
    if (before.status === AppointmentStatus.CANCELED || before.status === AppointmentStatus.COMPLETED) throw new AdminServiceError("CONFLICT", "وضعیت نهایی جلسه قابل تغییر نیست.");
    if (status === AppointmentStatus.COMPLETED && before.usage?.status === SessionUsageStatus.REVERSED) throw new AdminServiceError("CONFLICT", "مصرف جلسه قبلاً معکوس شده است.");
    const updated = await tx.appointment.update({ where: { id }, data: { status }, select: { id: true, status: true } });
    if (status === AppointmentStatus.COMPLETED && before.entitlementId && !before.usage) {
      await tx.sessionUsage.create({ data: { entitlementId: before.entitlementId, appointmentId: id, status: SessionUsageStatus.COMPLETED, recordedById: actorId, reason: trimmedReason } });
    }
    await recordAdminAuditWithClient(tx, { actorId, action: status === AppointmentStatus.COMPLETED ? "APPOINTMENT_COMPLETED" : status === AppointmentStatus.CANCELED ? "APPOINTMENT_CANCELED" : `APPOINTMENT_${status}`, targetType: "APPOINTMENT", targetId: id, beforeState: before, afterState: updated, reason: trimmedReason });
    return updated;
  });
}
