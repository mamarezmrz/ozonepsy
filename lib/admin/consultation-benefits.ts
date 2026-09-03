import { prisma } from "@/lib/prisma";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { AdminServiceError } from "@/lib/admin/errors";
import { CONSULTATION_BENEFIT_PAGE_CONFIG, type ConsultationBenefitPageKey } from "@/lib/consultation-benefits";
import type { AdminSessionView } from "@/lib/admin/session";

type BenefitInput = {
  id?: string;
  title: string;
  description: string;
};

export type AdminConsultationBenefitSection = {
  pageKey: ConsultationBenefitPageKey;
  label: string;
  enabled: boolean;
  benefits: Array<BenefitInput & { id: string; sortOrder: number }>;
};

export type AdminConsultationBenefitsResult = {
  ready: boolean;
  message?: string;
  sections: AdminConsultationBenefitSection[];
};

const sectionDefaults = () => CONSULTATION_BENEFIT_PAGE_CONFIG.map(({ pageKey, label }) => ({ pageKey, label, enabled: true, benefits: [] }));

function isMissingBenefitsTableError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2021";
}

export async function getAdminConsultationBenefits(): Promise<AdminConsultationBenefitsResult> {
  try {
    const rows = await prisma.consultationBenefitsSection.findMany({
      orderBy: { pageKey: "asc" },
      select: {
        pageKey: true,
        enabled: true,
        benefits: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, title: true, description: true, sortOrder: true },
        },
      },
    });
    const byKey = new Map(rows.map((row) => [row.pageKey, row]));
    return {
      ready: true,
      sections: CONSULTATION_BENEFIT_PAGE_CONFIG.map(({ pageKey, label }) => {
        const row = byKey.get(pageKey);
        return {
          pageKey,
          label,
          enabled: row?.enabled ?? true,
          benefits: row?.benefits ?? [],
        };
      }),
    };
  } catch (error) {
    if (!isMissingBenefitsTableError(error)) throw error;
    return {
      ready: false,
      message: "ساختار دیتابیس مزایا هنوز فعال نشده است. پس از اعمال migration، این صفحه عملیاتی می‌شود.",
      sections: sectionDefaults(),
    };
  }
}

function normalizeBenefits(pageKey: ConsultationBenefitPageKey, benefits: BenefitInput[]) {
  const normalized: Array<{ title: string; description: string; sortOrder: number }> = [];
  benefits.forEach((benefit, index) => {
    const title = benefit.title.trim();
    const description = benefit.description.trim();
    if (!title && !description) return;
    if (!title || !description) {
      throw new AdminServiceError("VALIDATION_ERROR", `ردیف ${index + 1} در بخش «${pageKey}» باید عنوان و توضیحات کامل داشته باشد.`);
    }
    normalized.push({ title, description, sortOrder: normalized.length });
  });
  return normalized;
}

function publicState(enabled: boolean, benefits: Array<{ title: string; description: string; sortOrder: number }>) {
  return { enabled, benefits };
}

export async function saveAdminConsultationBenefits(
  session: AdminSessionView,
  input: { sections: Array<{ pageKey: ConsultationBenefitPageKey; enabled: boolean; benefits: BenefitInput[] }> },
) {
  const knownKeys = new Set(CONSULTATION_BENEFIT_PAGE_CONFIG.map(({ pageKey }) => pageKey));
  if (input.sections.length !== CONSULTATION_BENEFIT_PAGE_CONFIG.length || new Set(input.sections.map((section) => section.pageKey)).size !== input.sections.length) {
    throw new AdminServiceError("VALIDATION_ERROR", "اطلاعات هر چهار حوزه باید یک بار ارسال شود.");
  }

  const normalizedSections = input.sections.map((section) => {
    if (!knownKeys.has(section.pageKey)) throw new AdminServiceError("VALIDATION_ERROR", "حوزه مشاوره معتبر نیست.");
    return { ...section, benefits: normalizeBenefits(section.pageKey, section.benefits) };
  });

  return prisma.$transaction(async (tx) => {
    for (const section of normalizedSections) {
      const before = await tx.consultationBenefitsSection.findUnique({
        where: { pageKey: section.pageKey },
        select: { id: true, enabled: true, benefits: { orderBy: { sortOrder: "asc" }, select: { title: true, description: true, sortOrder: true } } },
      });
      const saved = await tx.consultationBenefitsSection.upsert({
        where: { pageKey: section.pageKey },
        update: { enabled: section.enabled },
        create: { pageKey: section.pageKey, enabled: section.enabled },
        select: { id: true },
      });
      await tx.consultationBenefit.deleteMany({ where: { sectionId: saved.id } });
      if (section.benefits.length) {
        await tx.consultationBenefit.createMany({
          data: section.benefits.map((benefit) => ({ ...benefit, sectionId: saved.id })),
        });
      }
      await recordAdminAuditWithClient(tx, {
        actorId: session.userId,
        action: "CONSULTATION_BENEFITS_UPDATED",
        targetType: "CONSULTATION_BENEFITS_SECTION",
        targetId: saved.id,
        beforeState: before ? publicState(before.enabled, before.benefits) : null,
        afterState: publicState(section.enabled, section.benefits),
      });
    }
    return { ok: true };
  });
}
