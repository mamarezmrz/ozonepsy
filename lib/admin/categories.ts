import { CategoryStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";

export async function listAdminCategories(query: AdminListQuery, status?: CategoryStatus) {
  const where = { ...(status ? { status } : {}), ...(query.search ? { OR: [{ title: { contains: query.search, mode: "insensitive" as const } }, { slug: { contains: query.search, mode: "insensitive" as const } }] } : {}) };
  const orderBy = query.sort === "title" ? { title: query.direction } : { updatedAt: query.direction };
  const [total, rows] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({ where, orderBy, skip: paginationOffset(query), take: query.pageSize, select: { id: true, slug: true, title: true, description: true, status: true, updatedAt: true, _count: { select: { products: true } } } }),
  ]);
  return { rows, meta: pageMeta(total, query) };
}

export async function getAdminCategory(categoryId: string) {
  const row = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true, slug: true, title: true, description: true, status: true, _count: { select: { products: true } } } });
  if (!row) throw new AdminServiceError("NOT_FOUND", "دسته‌بندی پیدا نشد.");
  return row;
}

export async function createAdminCategory(actorId: string, input: { slug: string; title: string; description?: string }) {
  if (!input.slug.trim() || !input.title.trim()) throw new AdminServiceError("VALIDATION_ERROR", "عنوان و slug دسته‌بندی الزامی است.");
  return prisma.$transaction(async (tx) => {
    const created = await tx.category.create({ data: { slug: input.slug.trim().toLowerCase(), title: input.title.trim(), description: input.description?.trim() || null }, select: { id: true, slug: true, title: true, status: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: "CATEGORY_CREATED", targetType: "CATEGORY", targetId: created.id, afterState: created });
    return created;
  });
}

export async function updateAdminCategory(actorId: string, categoryId: string, input: { slug: string; title: string; description?: string }) {
  if (!input.slug.trim() || !input.title.trim()) throw new AdminServiceError("VALIDATION_ERROR", "عنوان و slug دسته‌بندی الزامی است.");
  return prisma.$transaction(async (tx) => {
    const before = await tx.category.findUnique({ where: { id: categoryId }, select: { slug: true, title: true, description: true, status: true } });
    if (!before) throw new AdminServiceError("NOT_FOUND", "دسته‌بندی پیدا نشد.");
    const updated = await tx.category.update({ where: { id: categoryId }, data: { slug: input.slug.trim().toLowerCase(), title: input.title.trim(), description: input.description?.trim() || null }, select: { id: true, slug: true, title: true, status: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: "CATEGORY_UPDATED", targetType: "CATEGORY", targetId: categoryId, beforeState: before, afterState: updated });
    return updated;
  });
}

export async function setAdminCategoryStatus(actorId: string, categoryId: string, status: CategoryStatus, reason: string) {
  if (!reason.trim()) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر وضعیت دسته‌بندی را وارد کنید.");
  return prisma.$transaction(async (tx) => {
    const before = await tx.category.findUnique({ where: { id: categoryId }, select: { status: true } });
    if (!before) throw new AdminServiceError("NOT_FOUND", "دسته‌بندی پیدا نشد.");
    if (before.status === status) throw new AdminServiceError("CONFLICT", "دسته‌بندی از قبل همین وضعیت را دارد.");
    const updated = await tx.category.update({ where: { id: categoryId }, data: { status }, select: { id: true, status: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: status === CategoryStatus.ARCHIVED ? "CATEGORY_ARCHIVED" : "CATEGORY_RESTORED", targetType: "CATEGORY", targetId: categoryId, beforeState: before, afterState: updated, reason: reason.trim() });
    return updated;
  });
}

export async function listActiveAdminCategories() {
  return prisma.category.findMany({ where: { status: CategoryStatus.ACTIVE }, orderBy: { title: "asc" }, select: { id: true, title: true, slug: true } });
}
