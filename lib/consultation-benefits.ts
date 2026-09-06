import { prisma } from "@/lib/prisma";

export const CONSULTATION_BENEFIT_PAGE_CONFIG = [
  { pageKey: "individual", label: "مشاوره فردی" },
  { pageKey: "couples", label: "زوج و رابطه" },
  { pageKey: "teenagers", label: "کودک و نوجوان" },
  { pageKey: "group-therapy", label: "گروه درمانی" },
] as const;

export type ConsultationBenefitPageKey = (typeof CONSULTATION_BENEFIT_PAGE_CONFIG)[number]["pageKey"];

export type ConsultationBenefitItem = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
};

export type PublicConsultationBenefits = {
  enabled: boolean;
  items: ConsultationBenefitItem[];
};

function isMissingBenefitsTableError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2021";
}

export async function getPublicConsultationBenefits(pageKey: ConsultationBenefitPageKey): Promise<PublicConsultationBenefits | null> {
  try {
    const section = await prisma.consultationBenefitsSection.findUnique({
      where: { pageKey },
      select: {
        enabled: true,
        benefits: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, title: true, description: true, sortOrder: true },
        },
      },
    });

    if (!section) return { enabled: false, items: [] };

    return {
      enabled: section.enabled,
      items: section.benefits.filter((benefit) => benefit.title.trim() && benefit.description.trim()),
    };
  } catch (error) {
    if (isMissingBenefitsTableError(error)) return null;
    throw error;
  }
}
