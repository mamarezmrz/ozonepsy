import { ProductKind, ProductStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { PublicCoursePage, PublicGroupTherapyPage, PublicProductKind, PublicPurchaseProduct } from "@/lib/public/catalog-types";

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

function publicKind(kind: ProductKind): PublicProductKind {
  return kind.toLowerCase() as PublicProductKind;
}

function mediaUrl(id: string | null, visibility: string | undefined) {
  return id && visibility === "PUBLIC" ? `/api/media/${id}` : null;
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
  groupTherapy: { cohortLabel: string | null } | null;
}) : PublicPurchaseProduct {
  const kind = publicKind(product.kind);
  const defaults = presentationDefaults[kind];
  const duration = product.consultation
    ? `${product.consultation.durationMinutes} دقیقه`
    : product.sessionPackage
      ? `${product.sessionPackage.includedSessions} جلسه`
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
    priceMinor: product.priceMinor,
    currency: product.currency,
    accent: product.accent ?? defaults.accent,
    label: product.label ?? defaults.label,
    duration,
    sessions: product.sessionPackage?.includedSessions,
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
  groupTherapy: { select: { cohortLabel: true } },
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
  return product ? mapProduct(product) : null;
}

export async function getPublishedProducts(kind?: PublicProductKind): Promise<PublicPurchaseProduct[]> {
  const products = await prisma.product.findMany({
    where: { status: ProductStatus.PUBLISHED, ...(kind ? { kind: kind.toUpperCase() as ProductKind } : {}) },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    select: purchaseSelect,
  });
  return products.map(mapProduct);
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
          instructors: { select: { specialist: { select: { displayName: true } } } },
          modules: {
            where: { status: ProductStatus.PUBLISHED },
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              lessons: {
                where: { status: ProductStatus.PUBLISHED },
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

  const mapped = mapProduct(product);
  return {
    ...mapped,
    kind: "course",
    accessDays: product.course.accessDays,
    deliveryMode: product.course.deliveryMode,
    instructorName: product.course.instructors[0]?.specialist.displayName ?? null,
    coverUrl: mediaUrl(product.coverMedia?.id ?? null, product.coverMedia?.visibility),
    modules: product.course.modules.map((module) => ({
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
    })),
  };
}

export async function getPublishedGroupTherapyBySlug(slug: string): Promise<PublicGroupTherapyPage | null> {
  const product = await prisma.product.findFirst({
    where: { slug, kind: ProductKind.GROUP, status: ProductStatus.PUBLISHED },
    select: {
      ...purchaseSelect,
      coverMedia: { select: { id: true, visibility: true } },
      groupTherapy: { select: { cohortLabel: true, capacity: true, schedulePolicy: true } },
    },
  });
  if (!product?.groupTherapy) return null;

  return {
    ...mapProduct(product),
    kind: "group",
    coverUrl: mediaUrl(product.coverMedia?.id ?? null, product.coverMedia?.visibility),
    cohortLabel: product.groupTherapy.cohortLabel,
    capacity: product.groupTherapy.capacity,
    schedulePolicy: product.groupTherapy.schedulePolicy,
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
