import { ContentStatus } from "@/lib/generated/prisma/enums";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getConsultationTopic, type ConsultationTopic } from "@/lib/consultation-topics";

export type ConsultationCasesPageKey = "individual" | "couples" | "teenagers" | "group-therapy";

export type PublicConsultationCases = {
  pageKey: ConsultationCasesPageKey;
  enabled: boolean;
  title: string;
  description: string;
  items: Array<{ id: string; title: string; slug: string; href: string; sortOrder: number }>;
};

export type PublicIndividualConsultationCases = PublicConsultationCases & { pageKey: "individual" };

type PublicTopicResult = {
  ready: boolean;
  blocked: boolean;
  topic: ConsultationTopic | null;
};

function isMissingTableError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2021";
}

function getIndividualContentDelegates() {
  const candidate = prisma as PrismaClient & {
    individualConsultationCaseSection?: PrismaClient["individualConsultationCaseSection"];
    individualConsultationTopic?: PrismaClient["individualConsultationTopic"];
  };
  return { caseSection: candidate.individualConsultationCaseSection, topic: candidate.individualConsultationTopic };
}

function jsonStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function jsonText(value: unknown): string | string[] {
  const values = jsonStrings(value);
  return values.length ? values : "";
}

function toPublicTopic(row: {
  slug: string;
  title: string;
  description: string;
  introList: unknown;
  signsTitle: string | null;
  signs: unknown;
  signsNote: string | null;
  why: string;
  whenToGetHelpTitle: string | null;
  whenToGetHelp: unknown;
  whatHelps: unknown;
  approachTitle: string | null;
  approachParagraphs: unknown;
  approach: unknown;
  hideShortQuestions: boolean;
  shortQuestions: unknown;
  imageMode: string;
  heroMediaId: string | null;
  heroImageRemoved: boolean;
}): ConsultationTopic {
  const fallback = getConsultationTopic(row.slug);
  return {
    slug: row.slug,
    title: row.title,
    image: row.heroImageRemoved ? "" : row.heroMediaId ? `/api/media/${row.heroMediaId}` : fallback?.image ?? "category-4.png",
    imageMode: row.imageMode.startsWith("normal") ? "normal" : "multiply",
    showHeroBranding: !row.imageMode.endsWith("-no-branding"),
    description: row.description,
    introList: jsonStrings(row.introList),
    signsTitle: row.signsTitle ?? undefined,
    signs: jsonStrings(row.signs),
    signsNote: row.signsNote ?? undefined,
    why: row.why,
    whenToGetHelpTitle: row.whenToGetHelpTitle ?? undefined,
    whenToGetHelp: jsonStrings(row.whenToGetHelp),
    whatHelps: jsonText(row.whatHelps),
    approachTitle: row.approachTitle ?? undefined,
    approachParagraphs: jsonText(row.approachParagraphs),
    approach: jsonStrings(row.approach),
    hideShortQuestions: row.hideShortQuestions,
    shortQuestions: jsonText(row.shortQuestions),
  };
}

function consultationCaseHref(pageKey: ConsultationCasesPageKey, slug: string) {
  return `/consultations/${pageKey}/${slug}`;
}

export async function getPublicConsultationCases(pageKey: ConsultationCasesPageKey): Promise<PublicConsultationCases | null> {
  try {
    const { caseSection, topic } = getIndividualContentDelegates();
    if (!caseSection || !topic) return null;
    const section = await caseSection.findUnique({
      where: { pageKey },
      select: {
        enabled: true,
        title: true,
        description: true,
        cases: {
          where: { status: ContentStatus.PUBLISHED },
          orderBy: { sortOrder: "asc" },
          select: { id: true, title: true, slug: true, sortOrder: true },
        },
      },
    });
    if (!section) return null;
    const slugs = section.cases.map((item) => item.slug);
    const publishedTopics = slugs.length ? await topic.findMany({ where: { slug: { in: slugs }, status: ContentStatus.PUBLISHED }, select: { slug: true, title: true, description: true, why: true } }) : [];
    const readyTopicSlugs = new Set(publishedTopics.filter((item) => item.title.trim() && item.description.trim() && item.why.trim()).map((item) => item.slug));
    const items = section.cases.filter((item) => item.title.trim() && item.slug.trim() && (readyTopicSlugs.has(item.slug) || (pageKey === "individual" && Boolean(getConsultationTopic(item.slug))))).map((item) => ({ ...item, href: consultationCaseHref(pageKey, item.slug) }));
    return {
      pageKey,
      enabled: section.enabled && items.length > 0,
      title: section.title,
      description: section.description,
      items,
    };
  } catch (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
}

export async function getPublicIndividualConsultationCases(): Promise<PublicIndividualConsultationCases | null> {
  return getPublicConsultationCases("individual") as Promise<PublicIndividualConsultationCases | null>;
}

export async function getPublicConsultationTopic(slug: string, pageKey: ConsultationCasesPageKey): Promise<PublicTopicResult> {
  try {
    const { caseSection, topic } = getIndividualContentDelegates();
    if (!caseSection || !topic) return { ready: false, blocked: false, topic: null };
    const section = await caseSection.findUnique({
      where: { pageKey },
      select: { cases: { where: { slug, status: ContentStatus.PUBLISHED }, select: { id: true } } },
    });
    if (!section?.cases.length) return { ready: true, blocked: false, topic: null };
    const row = await topic.findUnique({
      where: { slug },
      select: {
        slug: true,
        title: true,
        description: true,
        introList: true,
        signsTitle: true,
        signs: true,
        signsNote: true,
        why: true,
        whenToGetHelpTitle: true,
        whenToGetHelp: true,
        whatHelps: true,
        approachTitle: true,
        approachParagraphs: true,
        approach: true,
        hideShortQuestions: true,
        shortQuestions: true,
        imageMode: true,
        heroMediaId: true,
        heroImageRemoved: true,
        status: true,
      },
    });
    if (!row) return { ready: true, blocked: false, topic: null };
    if (row.status !== ContentStatus.PUBLISHED) return { ready: true, blocked: true, topic: null };
    return { ready: true, blocked: false, topic: toPublicTopic(row) };
  } catch (error) {
    if (isMissingTableError(error)) return { ready: false, blocked: false, topic: null };
    throw error;
  }
}

export async function getPublicIndividualConsultationTopic(slug: string): Promise<PublicTopicResult> {
  return getPublicConsultationTopic(slug, "individual");
}
