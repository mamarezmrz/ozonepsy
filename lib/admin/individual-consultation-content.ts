import { ContentStatus } from "@/lib/generated/prisma/enums";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { consultationCategoryContent } from "@/lib/consultation-categories";
import { getConsultationTopic, type ConsultationTopic } from "@/lib/consultation-topics";
import type { AdminSessionView } from "@/lib/admin/session";

export type AdminIndividualConsultationCase = {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  contentReady: boolean;
};

export type ConsultationCasesPageKey = "individual" | "couples" | "teenagers" | "group-therapy";

export function isConsultationCasesPageKey(value: string | null | undefined): value is ConsultationCasesPageKey {
  return value === "individual" || value === "couples" || value === "teenagers" || value === "group-therapy";
}

export function parseConsultationCasesPageKey(value: string | null | undefined): ConsultationCasesPageKey {
  return isConsultationCasesPageKey(value) ? value : "individual";
}

export type AdminIndividualConsultationSection = {
  pageKey: ConsultationCasesPageKey;
  label: string;
  ready: boolean;
  message?: string;
  title: string;
  description: string;
  enabled: boolean;
  cases: AdminIndividualConsultationCase[];
};

const sectionDefaults: Array<{ pageKey: ConsultationCasesPageKey; label: string; title: string; description: string; cases: AdminIndividualConsultationCase[] }> = [
  { pageKey: "individual", label: "مشاوره فردی", title: consultationCategoryContent.individual.casesTitle, description: consultationCategoryContent.individual.casesDescription, cases: consultationCategoryContent.individual.cases.map((item, index) => ({ id: `legacy-individual-${index}`, title: item.title, slug: item.href.split("/").pop() ?? "", sortOrder: index, contentReady: true })) },
  { pageKey: "couples", label: "زوج و رابطه", title: consultationCategoryContent.couples.casesTitle, description: consultationCategoryContent.couples.casesDescription, cases: [] },
  { pageKey: "teenagers", label: "کودک و نوجوان", title: consultationCategoryContent.teenagers.casesTitle, description: consultationCategoryContent.teenagers.casesDescription, cases: [] },
  { pageKey: "group-therapy", label: "گروه درمانی", title: "گروه درمانی برای چه موضوعاتی مناسب است؟", description: "موضوعات مناسب گروه‌درمانی را از این بخش مدیریت کنید.", cases: [] },
];

type TopicJsonInput = string[];
export type AdminTopicImageMode = "multiply" | "normal" | "multiply-no-branding" | "normal-no-branding";

export type AdminIndividualConsultationTopic = {
  ready: boolean;
  message?: string;
  exists: boolean;
  pageKey: ConsultationCasesPageKey;
  status: ContentStatus;
  slug: string;
  title: string;
  description: string;
  introList: string[];
  signsTitle: string;
  signs: string[];
  signsNote: string;
  why: string;
  whenToGetHelpTitle: string;
  whenToGetHelp: string[];
  whatHelps: string[];
  approachTitle: string;
  approachParagraphs: string[];
  approach: string[];
  hideShortQuestions: boolean;
  shortQuestions: string[];
  imageMode: AdminTopicImageMode;
  heroMediaId: string | null;
  heroImageRemoved: boolean;
  heroImageUrl: string;
};

function isMissingTableError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2021";
}

function hasIndividualContentDelegates() {
  const candidate = prisma as PrismaClient & {
    individualConsultationCaseSection?: PrismaClient["individualConsultationCaseSection"];
    individualConsultationTopic?: PrismaClient["individualConsultationTopic"];
  };
  return Boolean(candidate.individualConsultationCaseSection && candidate.individualConsultationTopic);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeImageMode(value: string | undefined, fallback: "multiply" | "normal" = "multiply"): AdminTopicImageMode {
  if (value === "normal" || value === "normal-no-branding" || value === "multiply-no-branding") return value;
  if (value === "multiply") return value;
  return fallback;
}

function topicFromLegacy(slug: string): ConsultationTopic | undefined {
  return getConsultationTopic(slug);
}

function topicView(slug: string, row?: {
  exists: boolean;
  status: ContentStatus;
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
}, pageKey: ConsultationCasesPageKey = "individual"): AdminIndividualConsultationTopic {
  const legacy = topicFromLegacy(slug);
  return {
    ready: true,
    exists: row?.exists ?? false,
    pageKey,
    status: row?.status ?? ContentStatus.PUBLISHED,
    slug,
    title: row?.title ?? legacy?.title ?? "",
    description: row?.description ?? legacy?.description ?? "",
    introList: strings(row?.introList ?? legacy?.introList),
    signsTitle: row?.signsTitle ?? legacy?.signsTitle ?? "نشانه‌های رایج",
    signs: strings(row?.signs ?? legacy?.signs),
    signsNote: row?.signsNote ?? legacy?.signsNote ?? "",
    why: row?.why ?? legacy?.why ?? "",
    whenToGetHelpTitle: row?.whenToGetHelpTitle ?? legacy?.whenToGetHelpTitle ?? "چه زمانی لازم است کمک بگیرم؟",
    whenToGetHelp: strings(row?.whenToGetHelp ?? legacy?.whenToGetHelp),
    whatHelps: strings(row?.whatHelps ?? (Array.isArray(legacy?.whatHelps) ? legacy.whatHelps : legacy?.whatHelps ? [legacy.whatHelps] : [])),
    approachTitle: row?.approachTitle ?? legacy?.approachTitle ?? "اُزون چگونه به تو کمک می‌کند؟",
    approachParagraphs: strings(row?.approachParagraphs ?? (Array.isArray(legacy?.approachParagraphs) ? legacy.approachParagraphs : legacy?.approachParagraphs ? [legacy.approachParagraphs] : [])),
    approach: strings(row?.approach ?? legacy?.approach),
    hideShortQuestions: row?.hideShortQuestions ?? legacy?.hideShortQuestions ?? true,
    shortQuestions: strings(row?.shortQuestions ?? (Array.isArray(legacy?.shortQuestions) ? legacy.shortQuestions : legacy?.shortQuestions ? [legacy.shortQuestions] : [])),
    imageMode: normalizeImageMode(row?.imageMode, legacy?.imageMode === "normal" ? "normal" : "multiply"),
    heroMediaId: row?.heroMediaId ?? null,
    heroImageRemoved: row?.heroImageRemoved ?? false,
    heroImageUrl: row?.heroMediaId ? `/api/admin/media/${row.heroMediaId}/preview` : row?.heroImageRemoved ? "" : legacy ? `/figma-home/${legacy.image}` : "",
  };
}

export async function getAdminIndividualConsultationCases(): Promise<AdminIndividualConsultationSection[]> {
  try {
    const candidate = prisma as PrismaClient & { individualConsultationCaseSection?: PrismaClient["individualConsultationCaseSection"] };
    if (!candidate.individualConsultationCaseSection) throw Object.assign(new Error("Prisma client is stale."), { code: "P2021" });
    const sections = await candidate.individualConsultationCaseSection.findMany({
      orderBy: { pageKey: "asc" },
      select: {
        pageKey: true,
        title: true,
        description: true,
        enabled: true,
        cases: { where: { status: { in: [ContentStatus.PUBLISHED, ContentStatus.DRAFT] } }, orderBy: { sortOrder: "asc" }, select: { id: true, title: true, slug: true, sortOrder: true, status: true } },
      },
    });
    const slugs = sections.flatMap((section) => section.cases.map((item) => item.slug));
    const topics = slugs.length && hasIndividualContentDelegates()
      ? await prisma.individualConsultationTopic.findMany({ where: { slug: { in: slugs }, status: { in: [ContentStatus.PUBLISHED, ContentStatus.DRAFT] } }, select: { slug: true, title: true, description: true, why: true } })
      : [];
    const readySlugs = new Set(topics.filter((topic) => topic.title.trim() && topic.description.trim() && topic.why.trim()).map((topic) => topic.slug));
    const storedByKey = new Map(sections.map((section) => [section.pageKey, section]));
    return sectionDefaults.map((fallback) => {
      const section = storedByKey.get(fallback.pageKey);
      const cases = (section?.cases ?? fallback.cases).map((item) => ({ ...item, contentReady: Boolean(("contentReady" in item ? item.contentReady : false) || getConsultationTopic(item.slug) || readySlugs.has(item.slug)) }));
      return { pageKey: fallback.pageKey, label: fallback.label, ready: true, title: section?.title ?? fallback.title, description: section?.description ?? fallback.description, enabled: Boolean(section?.enabled ?? true) && cases.length > 0, cases };
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return sectionDefaults.map((fallback) => ({ pageKey: fallback.pageKey, label: fallback.label, ready: false, message: "ساختار محتوای مشکلات مشاوره هنوز فعال نشده است. پس از اعمال migration، این صفحه عملیاتی می‌شود.", title: fallback.title, description: fallback.description, enabled: true, cases: [] }));
  }
}

export async function getAdminIndividualConsultationTopic(slug: string, pageKey: ConsultationCasesPageKey = "individual"): Promise<AdminIndividualConsultationTopic> {
  try {
    const candidate = prisma as PrismaClient & { individualConsultationTopic?: PrismaClient["individualConsultationTopic"] };
    if (!candidate.individualConsultationTopic) throw Object.assign(new Error("Prisma client is stale."), { code: "P2021" });
    const row = await candidate.individualConsultationTopic.findUnique({
      where: { slug },
      select: { title: true, description: true, introList: true, signsTitle: true, signs: true, signsNote: true, why: true, whenToGetHelpTitle: true, whenToGetHelp: true, whatHelps: true, approachTitle: true, approachParagraphs: true, approach: true, hideShortQuestions: true, shortQuestions: true, imageMode: true, heroMediaId: true, heroImageRemoved: true, status: true },
    });
    return topicView(slug, row ? { ...row, exists: true } : undefined, pageKey);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return { ...topicView(slug, undefined, pageKey), ready: false, message: "ساختار محتوای صفحات هنوز فعال نشده است. پس از اعمال migration، این صفحه عملیاتی می‌شود." };
  }
}

function normalizeCases(title: string, description: string, cases: Array<{ id?: string; title: string; slug: string }>) {
  const sectionTitle = title.trim();
  const sectionDescription = description.trim();
  if (!sectionTitle || !sectionDescription) throw new AdminServiceError("VALIDATION_ERROR", "عنوان و توضیحات سکشن را کامل کنید.");
  const normalized: Array<{ id?: string; title: string; slug: string; sortOrder: number }> = [];
  for (const [index, item] of cases.entries()) {
    const itemTitle = item.title.trim();
    const itemSlug = item.slug.trim();
    if (!itemTitle && !itemSlug) continue;
    if (!itemTitle || !itemSlug) throw new AdminServiceError("VALIDATION_ERROR", `ردیف ${index + 1} باید عنوان و اسلاگ کامل داشته باشد.`);
    normalized.push({ id: item.id, title: itemTitle, slug: itemSlug, sortOrder: normalized.length });
  }
  if (new Set(normalized.map((item) => item.slug)).size !== normalized.length) throw new AdminServiceError("CONFLICT", "اسلاگ کارت‌ها باید یکتا باشد.");
  return { sectionTitle, sectionDescription, normalized };
}

export async function saveAdminIndividualConsultationCases(session: AdminSessionView, input: { sections: Array<{ pageKey: ConsultationCasesPageKey; title: string; description: string; enabled: boolean; cases: Array<{ id?: string; title: string; slug: string }> }> }) {
  if (!hasIndividualContentDelegates()) throw new AdminServiceError("CONFLICT", "کلاینت Prisma قدیمی است؛ سرور توسعه را یک‌بار restart کنید.");
  if (input.sections.length !== sectionDefaults.length || new Set(input.sections.map((section) => section.pageKey)).size !== input.sections.length) throw new AdminServiceError("VALIDATION_ERROR", "اطلاعات هر چهار حوزه باید یک بار ارسال شود.");
  const knownKeys = new Set(sectionDefaults.map((section) => section.pageKey));
  const normalizedSections = input.sections.map((section) => {
    if (!knownKeys.has(section.pageKey)) throw new AdminServiceError("VALIDATION_ERROR", "حوزه مشاوره معتبر نیست.");
    const normalized = normalizeCases(section.title, section.description, section.cases);
    if (section.enabled && normalized.normalized.length === 0) throw new AdminServiceError("VALIDATION_ERROR", `برای نمایش سکشن «${section.pageKey}» حداقل یک کارت کامل وارد کنید.`);
    return { ...section, ...normalized };
  });
  const allSlugs = normalizedSections.flatMap((section) => section.normalized.map((item) => item.slug));
  if (new Set(allSlugs).size !== allSlugs.length) throw new AdminServiceError("CONFLICT", "اسلاگ کارت‌ها در هر چهار حوزه باید یکتا باشد.");
  return prisma.$transaction(async (tx) => {
    const savedTopics = allSlugs.length ? await tx.individualConsultationTopic.findMany({ where: { slug: { in: allSlugs }, status: { in: [ContentStatus.PUBLISHED, ContentStatus.DRAFT] } }, select: { slug: true, title: true, description: true, why: true } }) : [];
    const readyTopicSlugs = new Set(savedTopics.filter((topic) => topic.title.trim() && topic.description.trim() && topic.why.trim()).map((topic) => topic.slug));
    for (const item of normalizedSections) {
      if (item.enabled && !item.normalized.some((row) => readyTopicSlugs.has(row.slug) || (item.pageKey === "individual" && Boolean(getConsultationTopic(row.slug))))) throw new AdminServiceError("VALIDATION_ERROR", `برای نمایش سکشن «${item.pageKey}» حداقل یک کارت با محتوای کامل ذخیره کنید.`);
      const before = await tx.individualConsultationCaseSection.findUnique({ where: { pageKey: item.pageKey }, select: { id: true, pageKey: true, title: true, description: true, enabled: true, cases: { where: { status: { in: [ContentStatus.PUBLISHED, ContentStatus.DRAFT] } }, orderBy: { sortOrder: "asc" }, select: { id: true, title: true, slug: true, sortOrder: true, status: true } } } });
      const section = before
        ? await tx.individualConsultationCaseSection.update({ where: { id: before.id }, data: { title: item.sectionTitle, description: item.sectionDescription, enabled: item.enabled }, select: { id: true } })
        : await tx.individualConsultationCaseSection.create({ data: { pageKey: item.pageKey, title: item.sectionTitle, description: item.sectionDescription, enabled: item.enabled }, select: { id: true } });
      const existing = await tx.individualConsultationCase.findMany({ where: { sectionId: section.id }, select: { id: true, slug: true } });
      const savedIds: string[] = [];
      for (const row of item.normalized) {
        const byId = row.id ? existing.find((candidate) => candidate.id === row.id) : undefined;
        const bySlug = existing.find((candidate) => candidate.slug === row.slug);
        if (byId && bySlug && byId.id !== bySlug.id) throw new AdminServiceError("CONFLICT", `اسلاگ «${row.slug}» قبلاً استفاده شده است.`);
        const target = byId ?? bySlug;
        const saved = target
          ? await tx.individualConsultationCase.update({ where: { id: target.id }, data: { title: row.title, slug: row.slug, sortOrder: row.sortOrder, status: ContentStatus.PUBLISHED }, select: { id: true } })
          : await tx.individualConsultationCase.create({ data: { sectionId: section.id, title: row.title, slug: row.slug, sortOrder: row.sortOrder, status: ContentStatus.PUBLISHED }, select: { id: true } });
        savedIds.push(saved.id);
        if (item.enabled && readyTopicSlugs.has(row.slug)) {
          await tx.individualConsultationTopic.update({ where: { slug: row.slug }, data: { status: ContentStatus.PUBLISHED }, select: { id: true } });
        }
      }
      await tx.individualConsultationCase.updateMany({ where: { sectionId: section.id, ...(savedIds.length ? { id: { notIn: savedIds } } : {}) }, data: { status: ContentStatus.ARCHIVED } });
      const after = { pageKey: item.pageKey, title: item.sectionTitle, description: item.sectionDescription, enabled: item.enabled, cases: item.normalized.map(({ title, slug, sortOrder }) => ({ title, slug, sortOrder })) };
      await recordAdminAuditWithClient(tx, { actorId: session.userId, action: "CONSULTATION_CASES_UPDATED", targetType: "CONSULTATION_CASE_SECTION", targetId: section.id, beforeState: before ? { pageKey: before.pageKey, title: before.title, description: before.description, enabled: before.enabled, cases: before.cases } : null, afterState: after });
    }
    return { ok: true };
  });
}

type TopicInput = {
  title: string;
  description: string;
  introList: TopicJsonInput;
  signsTitle: string;
  signs: TopicJsonInput;
  signsNote: string;
  why: string;
  whenToGetHelpTitle: string;
  whenToGetHelp: TopicJsonInput;
  whatHelps: TopicJsonInput;
  approachTitle: string;
  approachParagraphs: TopicJsonInput;
  approach: TopicJsonInput;
  hideShortQuestions: boolean;
  shortQuestions: TopicJsonInput;
  imageMode: AdminTopicImageMode;
  heroMediaId: string | null;
  heroImageRemoved: boolean;
};

function cleanTopicInput(input: TopicInput) {
  const text = (value: string) => value.trim();
  return {
    title: text(input.title), description: text(input.description), introList: input.introList.map(text).filter(Boolean), signsTitle: text(input.signsTitle), signs: input.signs.map(text).filter(Boolean), signsNote: text(input.signsNote), why: text(input.why), whenToGetHelpTitle: text(input.whenToGetHelpTitle), whenToGetHelp: input.whenToGetHelp.map(text).filter(Boolean), whatHelps: input.whatHelps.map(text).filter(Boolean), approachTitle: text(input.approachTitle), approachParagraphs: input.approachParagraphs.map(text).filter(Boolean), approach: input.approach.map(text).filter(Boolean), hideShortQuestions: input.hideShortQuestions, shortQuestions: input.shortQuestions.map(text).filter(Boolean), imageMode: input.imageMode, heroMediaId: input.heroMediaId, heroImageRemoved: input.heroImageRemoved,
  };
}

export async function saveAdminIndividualConsultationTopic(session: AdminSessionView, slug: string, pageKey: ConsultationCasesPageKey, input: TopicInput) {
  if (!hasIndividualContentDelegates()) throw new AdminServiceError("CONFLICT", "کلاینت Prisma قدیمی است؛ سرور توسعه را یک‌بار restart کنید.");
  const data = cleanTopicInput(input);
  if (!data.title || !data.description || !data.why) throw new AdminServiceError("VALIDATION_ERROR", "عنوان، توضیحات و بخش «چرا پیش می‌آید؟» الزامی هستند.");
  return prisma.$transaction(async (tx) => {
    if (data.heroMediaId) {
      const media = await tx.mediaAsset.findUnique({ where: { id: data.heroMediaId }, select: { id: true, status: true, visibility: true } });
      if (!media || media.status !== "ACTIVE" || media.visibility !== "PUBLIC") throw new AdminServiceError("VALIDATION_ERROR", "تصویر انتخاب‌شده معتبر یا عمومی نیست.");
    }
    const before = await tx.individualConsultationTopic.findUnique({ where: { slug }, select: { title: true, description: true, status: true, heroMediaId: true, heroImageRemoved: true } });
    const saved = await tx.individualConsultationTopic.upsert({
      where: { slug },
      update: { ...data, status: ContentStatus.DRAFT },
      create: { slug, ...data, status: ContentStatus.DRAFT },
      select: { id: true, slug: true, title: true, status: true, heroMediaId: true, heroImageRemoved: true },
    });
    await recordAdminAuditWithClient(tx, { actorId: session.userId, action: before ? "INDIVIDUAL_CONSULTATION_TOPIC_UPDATED" : "INDIVIDUAL_CONSULTATION_TOPIC_CREATED", targetType: "INDIVIDUAL_CONSULTATION_TOPIC", targetId: saved.id, beforeState: before ? { pageKey, ...before } : null, afterState: { pageKey, ...saved } });
    return saved;
  });
}

export async function archiveAdminIndividualConsultationTopic(session: AdminSessionView, slug: string, pageKey: ConsultationCasesPageKey) {
  if (!hasIndividualContentDelegates()) throw new AdminServiceError("CONFLICT", "کلاینت Prisma قدیمی است؛ سرور توسعه را یک‌بار restart کنید.");
  return prisma.$transaction(async (tx) => {
    const before = await tx.individualConsultationTopic.findUnique({ where: { slug }, select: { id: true, slug: true, status: true, title: true } });
    if (!before) throw new AdminServiceError("NOT_FOUND", "صفحه‌ی موردنظر پیدا نشد.");
    if (before.status === ContentStatus.ARCHIVED) throw new AdminServiceError("CONFLICT", "این صفحه قبلاً حذف شده است.");
    const updated = await tx.individualConsultationTopic.update({ where: { slug }, data: { status: ContentStatus.ARCHIVED }, select: { id: true, slug: true, status: true } });
    await recordAdminAuditWithClient(tx, { actorId: session.userId, action: "INDIVIDUAL_CONSULTATION_TOPIC_ARCHIVED", targetType: "INDIVIDUAL_CONSULTATION_TOPIC", targetId: before.id, beforeState: { pageKey, ...before }, afterState: { pageKey, ...updated }, reason: "حذف محتوای صفحه از پنل مدیریت" });
    return updated;
  });
}
