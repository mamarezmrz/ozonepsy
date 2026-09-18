import { AppointmentStatus, SessionUsageStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";

const therapistMutableStatuses = [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED] as const;
const therapistTargetStatuses = [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW] as const;

export async function transitionTherapistAppointment(actorId: string, specialistId: string, appointmentId: string, nextStatus: AppointmentStatus) {
  if (!therapistTargetStatuses.includes(nextStatus as (typeof therapistTargetStatuses)[number])) {
    throw new AdminServiceError("VALIDATION_ERROR", "این وضعیت برای تغییر توسط متخصص مجاز نیست.");
  }

  return prisma.$transaction(async (tx) => {
    const before = await tx.appointment.findFirst({
      where: { id: appointmentId, specialistId },
      select: { id: true, status: true, entitlementId: true, usage: { select: { id: true, status: true } } },
    });
    if (!before) throw new AdminServiceError("NOT_FOUND", "جلسه پیدا نشد.");
    if (!therapistMutableStatuses.includes(before.status as (typeof therapistMutableStatuses)[number])) {
      throw new AdminServiceError("CONFLICT", "جلسه‌ای که نهایی شده است قابل تغییر نیست.");
    }
    if (before.status === nextStatus) return before;

    const changed = await tx.appointment.updateMany({
      where: { id: appointmentId, specialistId, status: before.status },
      data: { status: nextStatus },
    });
    if (changed.count !== 1) throw new AdminServiceError("CONFLICT", "جلسه هم‌زمان توسط کاربر دیگری تغییر کرده است.");

    if (nextStatus === AppointmentStatus.COMPLETED && before.entitlementId) {
      if (before.usage?.status === SessionUsageStatus.REVERSED) {
        await tx.sessionUsage.update({ where: { id: before.usage.id }, data: { status: SessionUsageStatus.COMPLETED, recordedById: actorId, recordedAt: new Date(), reversedById: null, reversedAt: null, reason: "ثبت انجام جلسه توسط متخصص" } });
      } else if (!before.usage) {
        await tx.sessionUsage.create({ data: { entitlementId: before.entitlementId, appointmentId, status: SessionUsageStatus.COMPLETED, recordedById: actorId, reason: "ثبت انجام جلسه توسط متخصص" } });
      }
    } else if (before.usage?.status === SessionUsageStatus.COMPLETED) {
      await tx.sessionUsage.update({ where: { id: before.usage.id }, data: { status: SessionUsageStatus.REVERSED, reversedById: actorId, reversedAt: new Date(), reason: "لغو یا عدم حضور جلسه توسط متخصص" } });
    }

    const updated = await tx.appointment.findUniqueOrThrow({ where: { id: appointmentId }, select: { id: true, status: true } });
    await recordAdminAuditWithClient(tx, {
      actorId,
      action: `THERAPIST_APPOINTMENT_${nextStatus}`,
      targetType: "APPOINTMENT",
      targetId: appointmentId,
      beforeState: before,
      afterState: updated,
      reason: "تغییر وضعیت توسط متخصص",
    });
    return updated;
  });
}
