import { ContentStatus, MediaStatus, MediaVisibility } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";
import type { AdminSessionView } from "@/lib/admin/session";

export type ContentType = "faq" | "testimonial";

export async function getAdminContent(type: ContentType, id: string) {
  if (type === "faq") {
    const row = await prisma.faq.findUnique({ where: { id }, select: { question: true, answer: true, sortOrder: true } });
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

export async function listAdminContent(type: ContentType, query: AdminListQuery, status?: ContentStatus) {
  if (type === "faq") {
    const where = { ...(status ? { status } : {}), ...(query.search ? { OR: [{ question: { contains: query.search, mode: "insensitive" as const } }, { answer: { contains: query.search, mode: "insensitive" as const } }] } : {}) };
    const [total, rows] = await Promise.all([prisma.faq.count({ where }), prisma.faq.findMany({ where, orderBy: query.sort === "status" ? { status: query.direction } : { sortOrder: query.direction }, skip: paginationOffset(query), take: query.pageSize, select: { id: true, question: true, answer: true, status: true, sortOrder: true, updatedAt: true } })]);
    return { rows, meta: pageMeta(total, query) };
  }
  const where = { ...(status ? { status } : {}), ...(query.search ? { OR: [{ name: { contains: query.search, mode: "insensitive" as const } }, { body: { contains: query.search, mode: "insensitive" as const } }] } : {}) };
  const [total, rows] = await Promise.all([prisma.testimonial.count({ where }), prisma.testimonial.findMany({ where, orderBy: query.sort === "status" ? { status: query.direction } : { sortOrder: query.direction }, skip: paginationOffset(query), take: query.pageSize, select: { id: true, name: true, body: true, avatarMediaId: true, status: true, sortOrder: true, updatedAt: true } })]);
  return { rows, meta: pageMeta(total, query) };
}

export async function createAdminContent(session: AdminSessionView, type: ContentType, input: Record<string, unknown>) {
  if (type === "faq") {
    const question = String(input.question ?? "").trim(); const answer = String(input.answer ?? "").trim(); const sortOrder = Number(input.sortOrder ?? 0);
    if (!question || !answer || !Number.isInteger(sortOrder) || sortOrder < 0) throw new AdminServiceError("VALIDATION_ERROR", "اطلاعات سوال متداول معتبر نیست.");
    return prisma.$transaction(async (tx) => { const created = await tx.faq.create({ data: { question, answer, sortOrder }, select: { id: true, question: true, status: true } }); await recordAdminAuditWithClient(tx, { actorId: session.userId, action: "FAQ_CREATED", targetType: "FAQ", targetId: created.id, afterState: created }); return created; });
  }
  const name = String(input.name ?? "").trim(); const body = String(input.body ?? "").trim(); const sortOrder = Number(input.sortOrder ?? 0); const avatarMediaId = input.avatarMediaId ? String(input.avatarMediaId) : null;
  if (!name || !body || !Number.isInteger(sortOrder) || sortOrder < 0) throw new AdminServiceError("VALIDATION_ERROR", "اطلاعات نظر مشتری معتبر نیست.");
  return prisma.$transaction(async (tx) => { await assertPublicMedia(tx, avatarMediaId); const created = await tx.testimonial.create({ data: { name, body, sortOrder, avatarMediaId }, select: { id: true, name: true, status: true } }); await recordAdminAuditWithClient(tx, { actorId: session.userId, action: "TESTIMONIAL_CREATED", targetType: "TESTIMONIAL", targetId: created.id, afterState: created }); return created; });
}

export async function updateAdminContent(session: AdminSessionView, type: ContentType, id: string, input: Record<string, unknown>) {
  if (type === "faq") {
    const question = String(input.question ?? "").trim(); const answer = String(input.answer ?? "").trim(); const sortOrder = Number(input.sortOrder ?? 0);
    if (!question || !answer || !Number.isInteger(sortOrder) || sortOrder < 0) throw new AdminServiceError("VALIDATION_ERROR", "اطلاعات سوال متداول معتبر نیست.");
    return prisma.$transaction(async (tx) => { const before = await tx.faq.findUnique({ where: { id }, select: { question: true, answer: true, status: true, sortOrder: true } }); if (!before) throw new AdminServiceError("NOT_FOUND", "سوال متداول پیدا نشد."); const updated = await tx.faq.update({ where: { id }, data: { question, answer, sortOrder }, select: { id: true, question: true, status: true } }); await recordAdminAuditWithClient(tx, { actorId: session.userId, action: "FAQ_UPDATED", targetType: "FAQ", targetId: id, beforeState: before, afterState: updated }); return updated; });
  }
  const name = String(input.name ?? "").trim(); const body = String(input.body ?? "").trim(); const sortOrder = Number(input.sortOrder ?? 0); const avatarMediaId = input.avatarMediaId ? String(input.avatarMediaId) : null;
  if (!name || !body || !Number.isInteger(sortOrder) || sortOrder < 0) throw new AdminServiceError("VALIDATION_ERROR", "اطلاعات نظر مشتری معتبر نیست.");
  return prisma.$transaction(async (tx) => { await assertPublicMedia(tx, avatarMediaId); const before = await tx.testimonial.findUnique({ where: { id }, select: { name: true, body: true, status: true, sortOrder: true, avatarMediaId: true } }); if (!before) throw new AdminServiceError("NOT_FOUND", "نظر مشتری پیدا نشد."); const updated = await tx.testimonial.update({ where: { id }, data: { name, body, sortOrder, avatarMediaId }, select: { id: true, name: true, status: true } }); await recordAdminAuditWithClient(tx, { actorId: session.userId, action: "TESTIMONIAL_UPDATED", targetType: "TESTIMONIAL", targetId: id, beforeState: before, afterState: updated }); return updated; });
}

export async function setAdminContentStatus(session: AdminSessionView, type: ContentType, id: string, status: ContentStatus, reason: string) {
  const trimmedReason = reason.trim(); if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر وضعیت محتوا الزامی است.");
  return prisma.$transaction(async (tx) => {
    if (type === "faq") { const before = await tx.faq.findUnique({ where: { id }, select: { status: true } }); if (!before) throw new AdminServiceError("NOT_FOUND", "سوال متداول پیدا نشد."); if (before.status === status) throw new AdminServiceError("CONFLICT", "محتوا از قبل همین وضعیت را دارد."); const updated = await tx.faq.update({ where: { id }, data: { status }, select: { id: true, status: true } }); await recordAdminAuditWithClient(tx, { actorId: session.userId, action: `FAQ_${status}`, targetType: "FAQ", targetId: id, beforeState: before, afterState: updated, reason: trimmedReason }); return updated; }
    const before = await tx.testimonial.findUnique({ where: { id }, select: { status: true } }); if (!before) throw new AdminServiceError("NOT_FOUND", "نظر مشتری پیدا نشد."); if (before.status === status) throw new AdminServiceError("CONFLICT", "محتوا از قبل همین وضعیت را دارد."); const updated = await tx.testimonial.update({ where: { id }, data: { status }, select: { id: true, status: true } }); await recordAdminAuditWithClient(tx, { actorId: session.userId, action: `TESTIMONIAL_${status}`, targetType: "TESTIMONIAL", targetId: id, beforeState: before, afterState: updated, reason: trimmedReason }); return updated;
  });
}
