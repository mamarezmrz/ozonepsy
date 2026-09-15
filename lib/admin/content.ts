import { ContentStatus, MediaStatus, MediaVisibility } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";
import type { AdminSessionView } from "@/lib/admin/session";
import { getDefaultFaqsForPage } from "@/lib/public/content-defaults";
import { isFaqPageKey, type FaqPageKey } from "@/lib/public/faq-pages";

export type ContentType = "faq" | "testimonial";

export async function getAdminContent(type: ContentType, id: string) {
  if (type === "faq") {
    const row = await prisma.faq.findUnique({ where: { id }, select: { question: true, answer: true, pageKey: true, sortOrder: true } });
    if (!row) throw new AdminServiceError("NOT_FOUND", "سوال متداول پیدا نشد.");
    return row;
  }
  const row = await prisma.testimonial.findUnique({ where: { id }, select: { name: true, body: true, sortOrder: true, avatarMediaId: true } });
  if (!row) throw new AdminServiceError("NOT_FOUND", "نظر مشتری پیدا نشد.");
  return row;
}

async function assertPublicMedia(tx: Prisma.TransactionClient, id: string | null) {
  if (!id) return;
  const media = await tx.mediaAsset.findUnique({ where: { id, status: MediaStatus.ACTIVE, visibility: MediaVisibility.PUBLIC }, select: { id: true } });
  if (!media) throw new AdminServiceError("VALIDATION_ERROR", "تصویر عمومی معتبر نیست.");
}

async function lockFaqPage(tx: Prisma.TransactionClient, pageKey: FaqPageKey) {
  // Return a Prisma-supported scalar instead of PostgreSQL's `void` result.
  await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${`ozone-faq:${pageKey}`}))) AS faq_lock`;
}

export async function listAdminContent(type: ContentType, query: AdminListQuery, status?: ContentStatus, pageKey: FaqPageKey = "home") {
  if (type === "faq") {
    const where = { pageKey, ...(status ? { status } : {}), ...(query.search ? { OR: [{ question: { contains: query.search, mode: "insensitive" as const } }, { answer: { contains: query.search, mode: "insensitive" as const } }] } : {}) };
    const [total, rows] = await Promise.all([prisma.faq.count({ where }), prisma.faq.findMany({ where, orderBy: query.sort === "status" ? [{ status: query.direction }, { sortOrder: "asc" }, { id: "asc" }] : [{ sortOrder: query.direction }, { id: "asc" }], skip: paginationOffset(query), take: query.pageSize, select: { id: true, question: true, answer: true, pageKey: true, status: true, sortOrder: true, updatedAt: true } })]);
    return { rows, meta: pageMeta(total, query) };
  }
  const where = { ...(status ? { status } : {}), ...(query.search ? { OR: [{ name: { contains: query.search, mode: "insensitive" as const } }, { body: { contains: query.search, mode: "insensitive" as const } }] } : {}) };
  const [total, rows] = await Promise.all([prisma.testimonial.count({ where }), prisma.testimonial.findMany({ where, orderBy: query.sort === "status" ? { status: query.direction } : { sortOrder: query.direction }, skip: paginationOffset(query), take: query.pageSize, select: { id: true, name: true, body: true, avatarMediaId: true, status: true, sortOrder: true, updatedAt: true } })]);
  return { rows, meta: pageMeta(total, query) };
}

export async function createAdminContent(session: AdminSessionView, type: ContentType, input: Record<string, unknown>) {
  if (type === "faq") {
    const question = String(input.question ?? "").trim(); const answer = String(input.answer ?? "").trim(); const sortOrder = Number(input.sortOrder ?? 0);
    const candidatePageKey = input.pageKey ?? "home";
    if (typeof candidatePageKey !== "string" || !isFaqPageKey(candidatePageKey)) throw new AdminServiceError("VALIDATION_ERROR", "صفحهٔ سوالات معتبر نیست.");
    const pageKey = candidatePageKey;
    if (!question || !answer || !Number.isInteger(sortOrder) || sortOrder < 0) throw new AdminServiceError("VALIDATION_ERROR", "اطلاعات سوال متداول معتبر نیست.");
    return prisma.$transaction(async (tx) => {
      await lockFaqPage(tx, pageKey);
      const existingCount = await tx.faq.count({ where: { pageKey } });
      let createdSortOrder = sortOrder;
      if (!existingCount) {
        const defaults = getDefaultFaqsForPage(pageKey);
        await tx.faq.createMany({ data: defaults.map((item, index) => ({ pageKey, question: item.question, answer: item.answer, sortOrder: index, status: ContentStatus.PUBLISHED })) });
        await recordAdminAuditWithClient(tx, { actorId: session.userId, action: "FAQ_PAGE_INITIALIZED", targetType: "FAQ_PAGE", targetId: pageKey, afterState: { count: defaults.length } });
        createdSortOrder += defaults.length;
      }
      const created = await tx.faq.create({ data: { question, answer, pageKey, sortOrder: createdSortOrder, status: ContentStatus.PUBLISHED }, select: { id: true, question: true, pageKey: true, status: true } });
      await recordAdminAuditWithClient(tx, { actorId: session.userId, action: "FAQ_CREATED", targetType: "FAQ", targetId: created.id, afterState: created });
      return created;
    });
  }
  const name = String(input.name ?? "").trim(); const body = String(input.body ?? "").trim(); const sortOrder = Number(input.sortOrder ?? 0); const avatarMediaId = input.avatarMediaId ? String(input.avatarMediaId) : null;
  if (!name || !body || !Number.isInteger(sortOrder) || sortOrder < 0) throw new AdminServiceError("VALIDATION_ERROR", "اطلاعات نظر مشتری معتبر نیست.");
  return prisma.$transaction(async (tx) => { await assertPublicMedia(tx, avatarMediaId); const created = await tx.testimonial.create({ data: { name, body, sortOrder, avatarMediaId }, select: { id: true, name: true, status: true } }); await recordAdminAuditWithClient(tx, { actorId: session.userId, action: "TESTIMONIAL_CREATED", targetType: "TESTIMONIAL", targetId: created.id, afterState: created }); return created; });
}

export async function updateAdminContent(session: AdminSessionView, type: ContentType, id: string, input: Record<string, unknown>) {
  if (type === "faq") {
    const question = String(input.question ?? "").trim(); const answer = String(input.answer ?? "").trim(); const sortOrder = Number(input.sortOrder ?? 0);
    if (!question || !answer || !Number.isInteger(sortOrder) || sortOrder < 0) throw new AdminServiceError("VALIDATION_ERROR", "اطلاعات سوال متداول معتبر نیست.");
    const pageKey = String(input.pageKey ?? "");
    return prisma.$transaction(async (tx) => { const before = await tx.faq.findUnique({ where: { id }, select: { question: true, answer: true, status: true, sortOrder: true, pageKey: true } }); if (!before) throw new AdminServiceError("NOT_FOUND", "سوال متداول پیدا نشد."); if (pageKey && pageKey !== before.pageKey) throw new AdminServiceError("VALIDATION_ERROR", "صفحهٔ این سوال از فرم ویرایش قابل تغییر نیست."); const updated = await tx.faq.update({ where: { id }, data: { question, answer, sortOrder }, select: { id: true, question: true, pageKey: true, status: true } }); await recordAdminAuditWithClient(tx, { actorId: session.userId, action: "FAQ_UPDATED", targetType: "FAQ", targetId: id, beforeState: before, afterState: updated }); return updated; });
  }
  const name = String(input.name ?? "").trim(); const body = String(input.body ?? "").trim(); const sortOrder = Number(input.sortOrder ?? 0); const avatarMediaId = input.avatarMediaId ? String(input.avatarMediaId) : null;
  if (!name || !body || !Number.isInteger(sortOrder) || sortOrder < 0) throw new AdminServiceError("VALIDATION_ERROR", "اطلاعات نظر مشتری معتبر نیست.");
  return prisma.$transaction(async (tx) => { await assertPublicMedia(tx, avatarMediaId); const before = await tx.testimonial.findUnique({ where: { id }, select: { name: true, body: true, status: true, sortOrder: true, avatarMediaId: true } }); if (!before) throw new AdminServiceError("NOT_FOUND", "نظر مشتری پیدا نشد."); const updated = await tx.testimonial.update({ where: { id }, data: { name, body, sortOrder, avatarMediaId }, select: { id: true, name: true, status: true } }); await recordAdminAuditWithClient(tx, { actorId: session.userId, action: "TESTIMONIAL_UPDATED", targetType: "TESTIMONIAL", targetId: id, beforeState: before, afterState: updated }); return updated; });
}

export async function initializeAdminFaqPage(session: AdminSessionView, pageKey: FaqPageKey) {
  const defaults = getDefaultFaqsForPage(pageKey);
  return prisma.$transaction(async (tx) => {
    await lockFaqPage(tx, pageKey);
    const existingCount = await tx.faq.count({ where: { pageKey } });
    if (existingCount) throw new AdminServiceError("CONFLICT", "برای این صفحه از قبل سوال ثبت شده است.");
    await tx.faq.createMany({ data: defaults.map((item, sortOrder) => ({ pageKey, question: item.question, answer: item.answer, sortOrder, status: ContentStatus.PUBLISHED })) });
    await recordAdminAuditWithClient(tx, { actorId: session.userId, action: "FAQ_PAGE_INITIALIZED", targetType: "FAQ_PAGE", targetId: pageKey, afterState: { count: defaults.length } });
    return { pageKey, count: defaults.length };
  });
}

export async function reorderAdminFaqs(session: AdminSessionView, pageKey: FaqPageKey, ids: string[]) {
  return prisma.$transaction(async (tx) => {
    await lockFaqPage(tx, pageKey);
    const before = await tx.faq.findMany({ where: { pageKey, status: { not: ContentStatus.ARCHIVED } }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true, sortOrder: true } });
    const currentIds = new Set(before.map((row) => row.id));
    if (before.length !== ids.length || ids.some((id) => !currentIds.has(id))) {
      throw new AdminServiceError("CONFLICT", "فهرست سوال‌ها تغییر کرده است؛ صفحه را تازه‌سازی کنید و دوباره تلاش کنید.");
    }

    for (const [sortOrder, id] of ids.entries()) {
      await tx.faq.update({ where: { id }, data: { sortOrder } });
    }

    await recordAdminAuditWithClient(tx, {
      actorId: session.userId,
      action: "FAQ_REORDERED",
      targetType: "FAQ_PAGE",
      targetId: pageKey,
      beforeState: before.map((row) => ({ id: row.id, sortOrder: row.sortOrder })),
      afterState: ids.map((id, sortOrder) => ({ id, sortOrder })),
    });

    return { pageKey, count: ids.length };
  });
}

export async function deleteAdminFaq(session: AdminSessionView, id: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.faq.findUnique({ where: { id }, select: { id: true, question: true, answer: true, pageKey: true, status: true, sortOrder: true } });
    if (!before || before.status === ContentStatus.ARCHIVED || !isFaqPageKey(before.pageKey)) {
      throw new AdminServiceError("NOT_FOUND", "سوال متداول پیدا نشد.");
    }

    await lockFaqPage(tx, before.pageKey);
    const current = await tx.faq.findUnique({ where: { id }, select: { id: true, status: true, sortOrder: true } });
    if (!current || current.status === ContentStatus.ARCHIVED) throw new AdminServiceError("NOT_FOUND", "سوال متداول پیدا نشد.");
    const activeCount = await tx.faq.count({ where: { pageKey: before.pageKey, status: { not: ContentStatus.ARCHIVED } } });
    const preserveEmptyPage = activeCount <= 1;

    if (preserveEmptyPage) {
      // Keep a hidden marker so the public page stays intentionally empty instead of restoring static defaults.
      await tx.faq.update({ where: { id }, data: { status: ContentStatus.ARCHIVED } });
    } else {
      await tx.faq.delete({ where: { id } });
      await tx.faq.updateMany({
        where: { pageKey: before.pageKey, status: { not: ContentStatus.ARCHIVED }, sortOrder: { gt: current.sortOrder } },
        data: { sortOrder: { decrement: 1 } },
      });
    }

    await recordAdminAuditWithClient(tx, {
      actorId: session.userId,
      action: "FAQ_DELETED",
      targetType: "FAQ",
      targetId: id,
      beforeState: before,
      afterState: { deleted: true, preservedEmptyPage: preserveEmptyPage },
    });

    return { id, pageKey: before.pageKey, preservedEmptyPage: preserveEmptyPage };
  });
}

export async function setAdminContentStatus(session: AdminSessionView, type: ContentType, id: string, status: ContentStatus, reason: string) {
  const trimmedReason = reason.trim(); if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر وضعیت محتوا الزامی است.");
  return prisma.$transaction(async (tx) => {
    if (type === "faq") { const before = await tx.faq.findUnique({ where: { id }, select: { status: true } }); if (!before) throw new AdminServiceError("NOT_FOUND", "سوال متداول پیدا نشد."); if (before.status === status) throw new AdminServiceError("CONFLICT", "محتوا از قبل همین وضعیت را دارد."); const updated = await tx.faq.update({ where: { id }, data: { status }, select: { id: true, status: true } }); await recordAdminAuditWithClient(tx, { actorId: session.userId, action: `FAQ_${status}`, targetType: "FAQ", targetId: id, beforeState: before, afterState: updated, reason: trimmedReason }); return updated; }
    const before = await tx.testimonial.findUnique({ where: { id }, select: { status: true } }); if (!before) throw new AdminServiceError("NOT_FOUND", "نظر مشتری پیدا نشد."); if (before.status === status) throw new AdminServiceError("CONFLICT", "محتوا از قبل همین وضعیت را دارد."); const updated = await tx.testimonial.update({ where: { id }, data: { status }, select: { id: true, status: true } }); await recordAdminAuditWithClient(tx, { actorId: session.userId, action: `TESTIMONIAL_${status}`, targetType: "TESTIMONIAL", targetId: id, beforeState: before, afterState: updated, reason: trimmedReason }); return updated;
  });
}
