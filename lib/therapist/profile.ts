import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { createAdminNotification } from "@/lib/admin/notifications";
import { AdminNotificationType } from "@/lib/generated/prisma/enums";

export const therapistProfileSchema = z.object({
  displayName: z.string().trim().min(1, "نام و نام خانوادگی را وارد کنید.").max(200),
  email: z.string().trim().email("ایمیل معتبر نیست.").max(320).transform((value) => value.toLowerCase()),
  specialty: z.string().trim().max(200, "تخصص بیش از حد طولانی است."),
  phone: z.string().trim().max(40, "شماره تماس بیش از حد طولانی است."),
  country: z.string().trim().max(120, "نام کشور بیش از حد طولانی است."),
});

export type TherapistProfileInput = z.infer<typeof therapistProfileSchema>;

export type TherapistPendingProfileChange = {
  displayName: string;
  email: string;
  specialty: string;
  phone: string;
  country: string;
  submittedAt: string;
};

export function parseTherapistPendingProfileChange(value: unknown): TherapistPendingProfileChange | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.displayName !== "string" || typeof candidate.email !== "string" || typeof candidate.submittedAt !== "string") return null;
  return {
    displayName: candidate.displayName,
    email: candidate.email,
    specialty: typeof candidate.specialty === "string" ? candidate.specialty : "",
    phone: typeof candidate.phone === "string" ? candidate.phone : "",
    country: typeof candidate.country === "string" ? candidate.country : "",
    submittedAt: candidate.submittedAt,
  };
}

function normalizedProfileValue(value: string | null | undefined) {
  return value?.trim() || "";
}

function splitDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts.shift() || null, lastName: parts.join(" ") || null };
}

export async function updateTherapistProfile(userId: string, specialistId: string, input: TherapistProfileInput) {
  const before = await prisma.specialist.findFirst({
    where: { id: specialistId, userId },
    select: {
      id: true,
      slug: true,
      displayName: true,
      specialty: true,
      phone: true,
      country: true,
      email: true,
      pendingProfileChanges: true,
      pendingProfileChangeAt: true,
    },
  });
  if (!before) throw new AdminServiceError("NOT_FOUND", "پروفایل متخصص پیدا نشد.");

  const pendingProfileChanges: TherapistPendingProfileChange = {
    displayName: input.displayName,
    email: input.email,
    specialty: input.specialty,
    phone: input.phone,
    country: input.country,
    submittedAt: new Date().toISOString(),
  };
  const profileChanges = [
    { label: "نام و نام خانوادگی", before: before.displayName, after: pendingProfileChanges.displayName },
    { label: "ایمیل", before: before.email, after: pendingProfileChanges.email },
    { label: "تخصص", before: before.specialty, after: pendingProfileChanges.specialty },
    { label: "شماره تماس", before: before.phone, after: pendingProfileChanges.phone },
    { label: "کشور", before: before.country, after: pendingProfileChanges.country },
  ].filter((change) => normalizedProfileValue(change.before) !== normalizedProfileValue(change.after));
  if (!profileChanges.length) throw new AdminServiceError("CONFLICT", "تغییری نسبت به اطلاعات فعلی ثبت نشده است.");
  const duplicateEmail = await prisma.user.findFirst({ where: { email: input.email, id: { not: userId } }, select: { id: true } });
  if (duplicateEmail) throw new AdminServiceError("CONFLICT", "این ایمیل قبلاً برای حساب دیگری استفاده شده است.");
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.specialist.update({
        where: { id: specialistId },
        data: {
          pendingProfileChanges,
          pendingProfileChangeAt: new Date(pendingProfileChanges.submittedAt),
        },
        select: { id: true, displayName: true, email: true, specialty: true, phone: true, country: true, pendingProfileChanges: true, pendingProfileChangeAt: true },
      });

      await recordAdminAuditWithClient(tx, {
        actorId: userId,
        action: "THERAPIST_PROFILE_CHANGE_SUBMITTED",
        targetType: "SPECIALIST",
        targetId: specialistId,
        beforeState: before,
        afterState: { pendingProfileChanges, pendingProfileChangeAt: updated.pendingProfileChangeAt },
      });
      await tx.adminNotification.updateMany({ where: { type: AdminNotificationType.THERAPIST_PROFILE_CHANGE, targetId: specialistId, resolvedAt: null }, data: { resolvedAt: new Date() } });
      return updated;
    });
    const changeDescription = profileChanges.map((change) => `${change.label}\nقبل: «${normalizedProfileValue(change.before) || "خالی"}»\nبعد: «${normalizedProfileValue(change.after) || "خالی"}»`).join("\n\n");
    await createAdminNotification({
      type: AdminNotificationType.THERAPIST_PROFILE_CHANGE,
      title: `تغییرات اطلاعات متخصص: ${before.displayName}`,
      description: changeDescription,
      href: `/admin/specialists/${specialistId}`,
      targetId: specialistId,
    });
    return updated;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") throw new AdminServiceError("CONFLICT", "این ایمیل قبلاً برای حساب دیگری استفاده شده است.");
    throw error;
  }
}
