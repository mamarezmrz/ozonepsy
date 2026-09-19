import { z } from "zod";
import { SpecialistPayoutStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { getAdminSpecialist } from "@/lib/admin/specialists";
import type { AdminSessionView } from "@/lib/admin/session";

export const adminSpecialistPayoutSchema = z.object({
  amountMajor: z.string().trim().min(1, "مبلغ پرداخت را وارد کنید."),
  currency: z.enum(["USD", "CAD", "EUR"]),
  status: z.nativeEnum(SpecialistPayoutStatus),
  paidAt: z.string().trim().max(20),
  reference: z.string().trim().max(200),
  note: z.string().trim().max(10000),
});

export type AdminSpecialistPayoutInput = z.infer<typeof adminSpecialistPayoutSchema>;

function normalizeDigits(value: string) {
  return value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/,/g, "");
}

function parseAmount(value: string) {
  const amount = Number(normalizeDigits(value));
  if (!Number.isFinite(amount) || amount <= 0) throw new AdminServiceError("VALIDATION_ERROR", "مبلغ پرداخت باید بیشتر از صفر باشد.");
  return Math.round(amount * 100);
}

function parsePaidAt(value: string, status: SpecialistPayoutStatus) {
  if (!value) return status === SpecialistPayoutStatus.PAID ? new Date() : null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new AdminServiceError("VALIDATION_ERROR", "تاریخ پرداخت معتبر نیست.");
  return date;
}

export async function listAdminSpecialistPayouts(specialistId: string, session: AdminSessionView) {
  await getAdminSpecialist(specialistId, session);
  return prisma.specialistPayout.findMany({
    where: { specialistId },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    select: { id: true, amountMinor: true, currency: true, status: true, paidAt: true, reference: true, note: true, createdAt: true },
  });
}

export async function createAdminSpecialistPayout(actorId: string, specialistId: string, input: AdminSpecialistPayoutInput, session: AdminSessionView) {
  await getAdminSpecialist(specialistId, session);
  const amountMinor = parseAmount(input.amountMajor);
  const paidAt = parsePaidAt(input.paidAt, input.status);
  const created = await prisma.specialistPayout.create({
    data: { specialistId, amountMinor, currency: input.currency, status: input.status, paidAt, reference: input.reference || null, note: input.note || null },
    select: { id: true, amountMinor: true, currency: true, status: true, paidAt: true, reference: true, note: true },
  });
  return { ...created, actorId };
}
