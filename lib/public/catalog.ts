import { ProductKind, ProductStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { PublicCourseModule, PublicCoursePage, PublicGroupTherapyPage, PublicProductKind, PublicPurchaseProduct } from "@/lib/public/catalog-types";

const presentationDefaults: Record<PublicProductKind, { accent: string; label: string; category: string }> = {
  consultation: { accent: "from-[#355859] to-[#73bebf]", label: "پیشنهاد اُزون", category: "مشاوره فردی" },
  package: { accent: "from-[#cc6f39] to-[#eba983]", label: "به‌صرفه‌تر", category: "مشاوره فردی" },
  group: { accent: "from-[#0f8b8d] to-[#d8e5e5]", label: "گروه جدید", category: "گروه درمانی" },
  course: { accent: "from-[#b3683e] to-[#f5dccf]", label: "دوره ضبط‌شده", category: "دوره‌های روانشناسی" },
};

const legacyProductAliases: Record<string, string> = {
  "individual-1": "individual-consultation",
  "package-3": "three-session-package",
  "package-6": "three-session-package",
  "life-skills": "life-skills-course",
  "group-therapy": "group-therapy",
};

const legacyCourseTestVideoUrl = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const courseCategoryLabels: Record<string, string> = {
  "individual-consultation": "مشاوره فردی",
  "couples-and-relationships": "زوج و رابطه",
  "children-and-adolescents": "کودک و نوجوان",
  "group-therapy": "گروه درمانی",
};

const legacyCourseTestModules: PublicCourseModule[] = [{
  id: "legacy-life-skills-module",
  title: "سرفصل دوره مهارت‌های زندگی",
  description: "سرفصل آزمایشی دوره تا زمان ثبت محتوای واقعی از پنل حفظ می‌شود.",
  lessons: ([
    ["مقدمه", 106, true],
    ["جلسه ۱: مقدمه‌ای بر روانشناسی و سلامت روان", 886, false],
    ["جلسه ۲: شناخت و مدیریت استرس", 886, false],
    ["جلسه ۳: ارتباطات مؤثر و مهارت‌های اجتماعی", 886, false],
    ["جلسه ۴: خودآگاهی و رشد فردی", 886, false],
    ["جلسه ۵: تکنیک‌های حل مسئله", 886, false],
    ["جلسه ۶: کار با احساسات و هیجانات", 886, false],
    ["جلسه ۷: تقویت اعتماد به نفس", 886, false],
    ["جلسه ۸: مدیریت زمان و برنامه‌ریزی", 886, false],
    ["جلسه ۹: کار گروهی و همکاری", 886, false],
    ["جلسه ۱۰: جمع‌بندی و ارزیابی نهایی", 886, false],
  ] as const).map(([title, duration, isPreview], index) => ({
    id: `legacy-life-skills-lesson-${index + 1}`,
    title,
    duration,
    isPreview,
    mediaUrl: legacyCourseTestVideoUrl,
  })),
}];

function publicKind(kind: ProductKind): PublicProductKind {
  return kind.toLowerCase() as PublicProductKind;
}

function mediaUrl(id: string | null, visibility: string | undefined) {
  return id && visibility === "PUBLIC" ? `/api/media/${id}` : null;
}

function getCourseTags(course: { curriculum: unknown } | null | undefined) {
  if (!course?.curriculum || typeof course.curriculum !== "object" || Array.isArray(course.curriculum)) return [];
  const categorySlugs = (course.curriculum as { categorySlugs?: unknown }).categorySlugs;
  if (!Array.isArray(categorySlugs)) return [];
  return [...new Set(categorySlugs.filter((slug): slug is string => typeof slug === "string").map((slug) => courseCategoryLabels[slug]).filter(Boolean))];
}

type ProductDiscountRow = { id: string; discountPercent: number | null };
type GroupSessionCountRow = { productId: string; durationSessions: number | null };

async function getProductDiscounts(productIds: readonly string[]) {
  const discounts = new Map<string, number>();
  if (!productIds.length) return discounts;
  const rows = await prisma.$queryRaw<ProductDiscountRow[]>`
    SELECT "id", "discountPercent"
    FROM "Product"
    WHERE "id" = ANY(${productIds}::uuid[])
  `;
  for (const row of rows) {
    discounts.set(row.id, Math.min(100, Math.max(0, row.discountPercent ?? 0)));
  }
  return discounts;
}

async function getGroupSessionCounts(productIds: readonly string[]) {
  const sessionCounts = new Map<string, number>();
  if (!productIds.length) return sessionCounts;
  const rows = await prisma.$queryRaw<GroupSessionCountRow[]>`
    SELECT "productId", "durationSessions"
    FROM "GroupTherapyProduct"
    WHERE "productId" = ANY(${productIds}::uuid[])
  `;
  for (const row of rows) {
    if (row.durationSessions && row.durationSessions > 0) {
      sessionCounts.set(row.productId, row.durationSessions);
    }
  }
  return sessionCounts;
}

function mapProduct(product: {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: ProductKind;
  priceMinor: number;
  currency: string;
  accent: string | null;
  label: string | null;
  category: { title: string } | null;
  consultation: { durationMinutes: number } | null;
  sessionPackage: { includedSessions: number } | null;
  groupTherapy: { productId: string } | null;
  course?: { curriculum: unknown } | null;
}, discountPercent = 0, groupSessionCount?: number) : PublicPurchaseProduct {
  const kind = publicKind(product.kind);
  const defaults = presentationDefaults[kind];
  const normalizedDiscount = Math.min(100, Math.max(0, discountPercent));
  const discountedPriceMinor = Math.round(product.priceMinor * (100 - normalizedDiscount) / 100);
  const sessionCount = product.sessionPackage?.includedSessions ?? groupSessionCount;
  const duration = product.consultation
    ? `${product.consultation.durationMinutes} دقیقه`
    : sessionCount
      ? `${sessionCount} جلسه`
      : product.groupTherapy
        ? "جلسات گروهی"
        : "دسترسی مادام‌العمر";

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    kind,
    category: product.category?.title ?? defaults.category,
    tags: kind === "course" ? getCourseTags(product.course) : [],
    priceMinor: discountedPriceMinor,
    ...(normalizedDiscount > 0 ? { originalPriceMinor: product.priceMinor, discountPercent: normalizedDiscount } : {}),
    currency: product.currency,
    accent: product.accent ?? defaults.accent,
    label: product.label ?? defaults.label,
    duration,
    sessions: sessionCount,
  };
}

const purchaseSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  kind: true,
  priceMinor: true,
  currency: true,
  accent: true,
  label: true,
  category: { select: { title: true } },
  consultation: { select: { durationMinutes: true } },
  sessionPackage: { select: { includedSessions: true } },
  groupTherapy: { select: { productId: true } },
  course: { select: { curriculum: true } },
} as const;

export async function getPublishedProductByIdOrSlug(value: string): Promise<PublicPurchaseProduct | null> {
  const resolvedValue = legacyProductAliases[value] ?? value;
  const product = await prisma.product.findFirst({
    where: {
      status: ProductStatus.PUBLISHED,
      OR: [{ slug: resolvedValue }, ...(isUuid(resolvedValue) ? [{ id: resolvedValue }] : [])],
    },
    select: purchaseSelect,
  });
  if (!product) return null;
  const discounts = await getProductDiscounts([product.id]);
  const groupSessionCounts = product.groupTherapy ? await getGroupSessionCounts([product.id]) : new Map<string, number>();
  return mapProduct(product, discounts.get(product.id) ?? 0, groupSessionCounts.get(product.id));
}

export async function getPublishedProducts(kind?: PublicProductKind, options?: { limit?: number; sort?: "featured" | "newest" }): Promise<PublicPurchaseProduct[]> {
  const products = await prisma.product.findMany({
    where: { status: ProductStatus.PUBLISHED, ...(kind ? { kind: kind.toUpperCase() as ProductKind } : {}) },
    orderBy: options?.sort === "newest" ? { createdAt: "desc" } : [{ featured: "desc" }, { createdAt: "desc" }],
    ...(options?.limit ? { take: options.limit } : {}),
    select: purchaseSelect,
  });
  const discounts = await getProductDiscounts(products.map((product) => product.id));
  const groupSessionCounts = await getGroupSessionCounts(products.filter((product) => product.groupTherapy).map((product) => product.id));
  return products.map((product) => mapProduct(product, discounts.get(product.id) ?? 0, groupSessionCounts.get(product.id)));
}

export async function getPublishedCourseBySlug(slug: string): Promise<PublicCoursePage | null> {
  const product = await prisma.product.findFirst({
    where: { slug, kind: ProductKind.COURSE, status: ProductStatus.PUBLISHED },
    select: {
      ...purchaseSelect,
      coverMedia: { select: { id: true, visibility: true } },
      course: {
        select: {
          deliveryMode: true,
          accessDays: true,
          curriculum: true,
          instructors: { select: { specialist: { select: { displayName: true } } } },
          modules: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              lessons: {
                orderBy: { order: "asc" },
                select: { id: true, title: true, duration: true, isPreview: true, mediaId: true, media: { select: { visibility: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!product?.course) return null;

  const discounts = await getProductDiscounts([product.id]);
  const mapped = mapProduct(product, discounts.get(product.id) ?? 0);
  const curriculum = product.course.curriculum && typeof product.course.curriculum === "object" && !Array.isArray(product.course.curriculum)
    ? product.course.curriculum as Record<string, unknown>
    : null;
  const demoMediaId = typeof curriculum?.demoMediaId === "string" ? curriculum.demoMediaId : null;
  const curriculumInstructorName = typeof curriculum?.instructorName === "string" && curriculum.instructorName.trim() ? curriculum.instructorName.trim() : null;
  const durationSessions = typeof curriculum?.durationSessions === "number" && curriculum.durationSessions > 0 ? curriculum.durationSessions : null;
  const modules = product.course.modules.length
    ? product.course.modules.map((module) => ({
        id: module.id,
        title: module.title,
        description: module.description,
        lessons: module.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          duration: lesson.duration,
          isPreview: lesson.isPreview,
          mediaUrl: lesson.mediaId ? `/api/courses/lessons/${lesson.id}/media` : null,
        })),
      }))
    : product.slug === "life-skills-course"
      ? legacyCourseTestModules
      : [];

  return {
    ...mapped,
    kind: "course",
    accessDays: product.course.accessDays,
    deliveryMode: product.course.deliveryMode,
    instructorName: curriculumInstructorName ?? product.course.instructors[0]?.specialist.displayName ?? null,
    duration: durationSessions === null ? mapped.duration : `${durationSessions.toLocaleString("fa-IR")} جلسه`,
    coverUrl: mediaUrl(product.coverMedia?.id ?? null, product.coverMedia?.visibility),
    demoVideoUrl: demoMediaId ? `/api/media/${demoMediaId}` : null,
    modules,
  };
}

export async function getPublishedGroupTherapyBySlug(slug: string): Promise<PublicGroupTherapyPage | null> {
  const product = await prisma.product.findFirst({
    where: { slug, kind: ProductKind.GROUP, status: ProductStatus.PUBLISHED },
    select: {
      ...purchaseSelect,
      coverMedia: { select: { id: true, visibility: true } },
      groupTherapy: { select: { productId: true } },
    },
  });
  if (!product?.groupTherapy) return null;

  type GroupTherapyDetailRow = {
    instructorName: string | null;
    durationSessions: number | null;
    sessionId: string | null;
    sessionTitle: string | null;
    sessionStartsAt: Date | string | null;
  };
  const groupRows = await prisma.$queryRaw<GroupTherapyDetailRow[]>`
    SELECT
      g."instructorName" AS "instructorName",
      g."durationSessions" AS "durationSessions",
      s."id" AS "sessionId",
      s."title" AS "sessionTitle",
      s."startsAt" AS "sessionStartsAt"
    FROM "GroupTherapyProduct" g
    LEFT JOIN "GroupTherapySession" s ON s."groupTherapyProductId" = g."productId"
    WHERE g."productId" = ${product.id}
    ORDER BY s."order" ASC
  `;
  const groupDetails = groupRows[0];
  if (!groupDetails) return null;
  const discounts = await getProductDiscounts([product.id]);
  const mapped = mapProduct(product, discounts.get(product.id) ?? 0, groupDetails.durationSessions ?? undefined);

  return {
    ...mapped,
    kind: "group",
    coverUrl: mediaUrl(product.coverMedia?.id ?? null, product.coverMedia?.visibility),
    instructorName: groupDetails.instructorName,
    duration: groupDetails.durationSessions ? `${groupDetails.durationSessions.toLocaleString("fa-IR")} جلسه` : mapped.duration,
    groupSessions: groupRows.filter((session) => session.sessionId && session.sessionTitle && session.sessionStartsAt).map((session) => ({ id: session.sessionId as string, title: session.sessionTitle as string, startsAt: new Date(session.sessionStartsAt as Date | string).toISOString() })),
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
