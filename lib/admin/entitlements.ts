import { AppointmentStatus, EntitlementStatus, ProductKind, ProductStatus, RoleName, SessionUsageStatus, SpecialistStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { sendAppointmentConfirmationEmail } from "@/lib/auth/email";

const sessionProductKinds = [ProductKind.CONSULTATION, ProductKind.PACKAGE];
const reservableAppointmentStatuses = [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED];

function assertFutureDate(value: Date, field: string) {
  if (Number.isNaN(value.getTime()) || value.getTime() <= Date.now()) {
    throw new AdminServiceError("VALIDATION_ERROR", `${field} باید یک زمان معتبر در آینده باشد.`);
  }
}

export async function updateAdminEntitlementSessions(
  actorId: string,
  entitlementId: string,
  totalSessions: number,
  reason: string,
) {
  const trimmedReason = reason.trim();
  if (!Number.isInteger(totalSessions) || totalSessions < 0) {
    throw new AdminServiceError("VALIDATION_ERROR", "تعداد جلسات باید یک عدد صحیح صفر یا بیشتر باشد.");
  }
  if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر تعداد جلسات را وارد کنید.");

  return prisma.$transaction(async (tx) => {
    const before = await tx.entitlement.findFirst({
      where: { id: entitlementId, product: { kind: { in: sessionProductKinds } } },
      select: {
        id: true,
        status: true,
        totalSessions: true,
        updatedAt: true,
        product: { select: { title: true, kind: true } },
        usages: { where: { status: SessionUsageStatus.COMPLETED }, select: { id: true } },
        appointments: { where: { status: { in: reservableAppointmentStatuses } }, select: { id: true } },
      },
    });
    if (!before) throw new AdminServiceError("NOT_FOUND", "اعتبار جلسات پیدا نشد.");

    const completedCount = before.usages.length;
    const reservedCount = before.appointments.length;

    const nextStatus =
      before.status === EntitlementStatus.ACTIVE || before.status === EntitlementStatus.EXHAUSTED
        ? totalSessions <= completedCount + reservedCount
          ? EntitlementStatus.EXHAUSTED
          : EntitlementStatus.ACTIVE
        : before.status;
    const changed = await tx.entitlement.updateMany({
      where: { id: entitlementId, updatedAt: before.updatedAt, totalSessions: before.totalSessions },
      data: { totalSessions, status: nextStatus },
    });
    if (changed.count !== 1) throw new AdminServiceError("CONFLICT", "اعتبار جلسات هم‌زمان تغییر کرده است. دوباره تلاش کنید.");

    const updated = await tx.entitlement.findUniqueOrThrow({
      where: { id: entitlementId },
      select: { id: true, totalSessions: true, status: true },
    });
    await recordAdminAuditWithClient(tx, {
      actorId,
      action: "ENTITLEMENT_SESSIONS_UPDATED",
      targetType: "ENTITLEMENT",
      targetId: entitlementId,
      beforeState: { totalSessions: before.totalSessions, status: before.status, completedCount, reservedCount },
      afterState: { totalSessions: updated.totalSessions, status: updated.status },
      reason: trimmedReason,
    });
    return updated;
  });
}

export async function revokeAdminEntitlement(actorId: string, entitlementId: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.entitlement.findFirst({
      where: { id: entitlementId, product: { kind: { in: sessionProductKinds } } },
      select: {
        id: true,
        userId: true,
        status: true,
        updatedAt: true,
        totalSessions: true,
        product: { select: { title: true, kind: true } },
        appointments: {
          where: { status: { in: reservableAppointmentStatuses } },
          select: { id: true },
        },
      },
    });
    if (!before) throw new AdminServiceError("NOT_FOUND", "بستهٔ جلسات پیدا نشد.");
    if (before.status === EntitlementStatus.REVOKED) throw new AdminServiceError("CONFLICT", "دسترسی این بسته قبلاً برداشته شده است.");
    if (before.appointments.length) throw new AdminServiceError("CONFLICT", "ابتدا جلسه‌های زمان‌بندی‌شدهٔ این بسته را لغو یا تعیین‌تکلیف کنید.");

    const revokedAt = new Date();
    const changed = await tx.entitlement.updateMany({
      where: { id: entitlementId, status: before.status, updatedAt: before.updatedAt },
      data: { status: EntitlementStatus.REVOKED, revokedAt },
    });
    if (changed.count !== 1) throw new AdminServiceError("CONFLICT", "وضعیت بسته هم‌زمان تغییر کرده است. صفحه را تازه کنید و دوباره تلاش کنید.");

    const updated = await tx.entitlement.findUniqueOrThrow({
      where: { id: entitlementId },
      select: { id: true, status: true, revokedAt: true },
    });
    await recordAdminAuditWithClient(tx, {
      actorId,
      action: "ENTITLEMENT_REVOKED",
      targetType: "ENTITLEMENT",
      targetId: entitlementId,
      beforeState: { status: before.status, userId: before.userId, product: before.product, totalSessions: before.totalSessions },
      afterState: updated,
      reason: "دسترسی بسته از پروفایل کاربر برداشته شد.",
    });
    return updated;
  });
}

export async function scheduleAdminAppointment(
  actorId: string,
  entitlementId: string,
  startsAt: Date,
  endsAt: Date | null,
  meetingUrl: string | null,
  specialistId: string | null,
  reason?: string,
) {
  assertFutureDate(startsAt, "زمان شروع جلسه");
  if (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt)) {
    throw new AdminServiceError("VALIDATION_ERROR", "زمان پایان باید بعد از زمان شروع باشد.");
  }

  const appointment = await prisma.$transaction(async (tx) => {
    const entitlement = await tx.entitlement.findFirst({
      where: {
        id: entitlementId,
        status: { in: [EntitlementStatus.ACTIVE, EntitlementStatus.EXHAUSTED] },
        product: { kind: { in: sessionProductKinds } },
      },
      select: {
        id: true,
        userId: true,
        productId: true,
        status: true,
        totalSessions: true,
        updatedAt: true,
        product: { select: { title: true } },
        usages: { where: { status: SessionUsageStatus.COMPLETED }, select: { id: true } },
        appointments: { where: { status: { in: reservableAppointmentStatuses } }, select: { id: true } },
      },
    });
    if (!entitlement) throw new AdminServiceError("NOT_FOUND", "اعتبار فعال جلسات پیدا نشد.");

    if (specialistId) {
      const specialist = await tx.specialist.findFirst({ where: { id: specialistId, status: SpecialistStatus.ACTIVE }, select: { id: true } });
      if (!specialist) throw new AdminServiceError("VALIDATION_ERROR", "متخصص انتخاب‌شده فعال نیست.");
    }

    const completedCount = entitlement.usages.length;
    const reservedCount = entitlement.appointments.length;
    if (entitlement.totalSessions === null || completedCount + reservedCount >= entitlement.totalSessions) {
      throw new AdminServiceError("CONFLICT", "برای این کاربر جلسه‌ی آزاد باقی نمانده است.");
    }

    // Touch the entitlement optimistically before creating the appointment. This makes two
    // simultaneous scheduling requests compete for the same version without changing the schema.
    const claimed = await tx.entitlement.updateMany({
      where: { id: entitlementId, updatedAt: entitlement.updatedAt, totalSessions: entitlement.totalSessions },
      data: { updatedAt: new Date(), status: EntitlementStatus.ACTIVE },
    });
    if (claimed.count !== 1) throw new AdminServiceError("CONFLICT", "اعتبار جلسات هم‌زمان تغییر کرده است. دوباره تلاش کنید.");

    const appointment = await tx.appointment.create({
      data: { userId: entitlement.userId, productId: entitlement.productId, entitlementId, specialistId, status: AppointmentStatus.SCHEDULED, startsAt, endsAt, meetingUrl, notes: reason?.trim() || null },
      select: { id: true, status: true, startsAt: true, endsAt: true, meetingUrl: true, user: { select: { email: true, profile: { select: { displayName: true } } } }, product: { select: { title: true } } },
    });
    await recordAdminAuditWithClient(tx, {
      actorId,
      action: "APPOINTMENT_SCHEDULED",
      targetType: "APPOINTMENT",
      targetId: appointment.id,
      afterState: { ...appointment, entitlementId },
      reason: reason?.trim() || undefined,
    });
    return appointment;
  });
  await sendAppointmentConfirmationEmail({ email: appointment.user.email, userName: appointment.user.profile?.displayName, title: appointment.product.title, startsAt: appointment.startsAt, endsAt: appointment.endsAt, meetingUrl: appointment.meetingUrl });
  return appointment;
}

export async function scheduleAdminUserAppointment(
  actorId: string,
  userId: string,
  productId: string,
  startsAt: Date,
  endsAt: Date | null,
  meetingUrl: string | null,
  specialistId: string | null,
  reason?: string,
) {
  assertFutureDate(startsAt, "زمان شروع جلسه");
  if (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt)) {
    throw new AdminServiceError("VALIDATION_ERROR", "زمان پایان باید بعد از زمان شروع باشد.");
  }

  const appointment = await prisma.$transaction(async (tx) => {
    const [user, product] = await Promise.all([
      tx.user.findFirst({ where: { id: userId, roles: { some: { role: { name: RoleName.USER } } } }, select: { id: true } }),
      tx.product.findFirst({ where: { id: productId, kind: { in: sessionProductKinds }, status: ProductStatus.PUBLISHED }, select: { id: true, title: true } }),
    ]);
    if (!user) throw new AdminServiceError("NOT_FOUND", "کاربر پیدا نشد.");
    if (!product) throw new AdminServiceError("NOT_FOUND", "نوع جلسهٔ منتشرشده پیدا نشد.");

    if (specialistId) {
      const specialist = await tx.specialist.findFirst({ where: { id: specialistId, status: SpecialistStatus.ACTIVE }, select: { id: true } });
      if (!specialist) throw new AdminServiceError("VALIDATION_ERROR", "متخصص انتخاب‌شده فعال نیست.");
    }

    const appointment = await tx.appointment.create({
      data: { userId: user.id, productId: product.id, entitlementId: null, specialistId, status: AppointmentStatus.SCHEDULED, startsAt, endsAt, meetingUrl, notes: reason?.trim() || null },
      select: { id: true, status: true, startsAt: true, endsAt: true, meetingUrl: true, user: { select: { email: true, profile: { select: { displayName: true } } } }, product: { select: { title: true } } },
    });
    await recordAdminAuditWithClient(tx, {
      actorId,
      action: "APPOINTMENT_SCHEDULED_WITHOUT_ENTITLEMENT",
      targetType: "APPOINTMENT",
      targetId: appointment.id,
      afterState: { ...appointment, userId: user.id, productId: product.id, productTitle: product.title, entitlementId: null },
      reason: reason?.trim() || undefined,
    });
    return appointment;
  });
  await sendAppointmentConfirmationEmail({ email: appointment.user.email, userName: appointment.user.profile?.displayName, title: appointment.product.title, startsAt: appointment.startsAt, endsAt: appointment.endsAt, meetingUrl: appointment.meetingUrl });
  return appointment;
}
