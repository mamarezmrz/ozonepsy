import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";

const legacyCategoryLabels: Record<string, string> = {
  "individual-consultation": "مشاوره فردی",
  "couples-and-relationships": "زوج و رابطه",
  "children-and-adolescents": "کودک و نوجوان",
  "group-therapy": "گروه درمانی",
};

function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, " ").replace(/ي/g, "ی").replace(/ك/g, "ک");
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function listAdminCourseTags() {
  const [storedRows, products] = await Promise.all([
    prisma.courseTag.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    prisma.product.findMany({ where: { kind: "COURSE" }, select: { category: { select: { title: true } }, course: { select: { curriculum: true } } } }),
  ]);
  const names = new Map<string, string>();
  const add = (value: string) => {
    const name = normalizeTag(value);
    if (name) names.set(name.toLocaleLowerCase("fa"), name);
  };
  for (const row of storedRows) add(row.name);
  for (const row of products) {
    const curriculum = asObject(row.course?.curriculum);
    const tags = Array.isArray(curriculum.tags) ? curriculum.tags.filter((tag): tag is string => typeof tag === "string") : [];
    const oldSlugs = Array.isArray(curriculum.categorySlugs) ? curriculum.categorySlugs.filter((slug): slug is string => typeof slug === "string") : [];
    for (const tag of tags) add(tag);
    if (!tags.length) for (const slug of oldSlugs) if (legacyCategoryLabels[slug]) add(legacyCategoryLabels[slug]);
    if (!tags.length && !oldSlugs.length && row.category?.title) add(row.category.title);
  }
  return [...names.values()].sort((left, right) => left.localeCompare(right, "fa"));
}

export async function createAdminCourseTag(actorId: string, rawName: string) {
  const name = normalizeTag(rawName);
  if (!name || name.length > 80) throw new AdminServiceError("VALIDATION_ERROR", "نام تگ باید بین ۱ تا ۸۰ نویسه باشد.");
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.courseTag.findFirst({ where: { name: { equals: name, mode: "insensitive" } }, select: { id: true, name: true } });
      if (existing) return existing;
      const created = await tx.courseTag.create({ data: { name }, select: { id: true, name: true } });
      await recordAdminAuditWithClient(tx, { actorId, action: "COURSE_TAG_CREATED", targetType: "COURSE_TAG", targetId: created.id, afterState: created });
      return created;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new AdminServiceError("CONFLICT", "این تگ از قبل وجود دارد.");
    throw error;
  }
}

export async function deleteAdminCourseTag(actorId: string, rawName: string) {
  const name = normalizeTag(rawName);
  const matchingLegacySlug = Object.entries(legacyCategoryLabels).find(([, label]) => normalizeTag(label).toLocaleLowerCase("fa") === name.toLocaleLowerCase("fa"))?.[0];

  return prisma.$transaction(async (tx) => {
    const stored = await tx.courseTag.findFirst({ where: { name: { equals: name, mode: "insensitive" } }, select: { id: true, name: true } });
    const products = await tx.courseProduct.findMany({ select: { productId: true, curriculum: true, product: { select: { categoryId: true, category: { select: { title: true } } } } } });
    let changedReferences = 0;
    for (const course of products) {
      const curriculum = asObject(course.curriculum);
      const tags = Array.isArray(curriculum.tags) ? curriculum.tags.filter((tag): tag is string => typeof tag === "string") : [];
      const categorySlugs = Array.isArray(curriculum.categorySlugs) ? curriculum.categorySlugs.filter((slug): slug is string => typeof slug === "string") : [];
      const nextTags = tags.filter((tag) => normalizeTag(tag).toLocaleLowerCase("fa") !== name.toLocaleLowerCase("fa"));
      const nextCategorySlugs = matchingLegacySlug ? categorySlugs.filter((slug) => slug !== matchingLegacySlug) : categorySlugs;
      const shouldClearCategory = course.product.categoryId && normalizeTag(course.product.category?.title ?? "").toLocaleLowerCase("fa") === name.toLocaleLowerCase("fa");
      if (nextTags.length !== tags.length || nextCategorySlugs.length !== categorySlugs.length) {
        await tx.courseProduct.update({ where: { productId: course.productId }, data: { curriculum: { ...curriculum, tags: nextTags, categorySlugs: nextCategorySlugs } } });
        changedReferences += 1;
      }
      if (shouldClearCategory) {
        await tx.product.update({ where: { id: course.productId }, data: { categoryId: null } });
        changedReferences += 1;
      }
    }
    if (!stored && !changedReferences) throw new AdminServiceError("NOT_FOUND", "تگ پیدا نشد.");
    if (stored) await tx.courseTag.delete({ where: { id: stored.id } });
    await recordAdminAuditWithClient(tx, { actorId, action: "COURSE_TAG_DELETED", targetType: "COURSE_TAG", targetId: stored?.id ?? name, beforeState: { name: stored?.name ?? name, changedReferences }, afterState: { deleted: true } });
    return { name: stored?.name ?? name, changedReferences };
  });
}
