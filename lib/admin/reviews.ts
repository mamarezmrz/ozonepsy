import { ReviewStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";

export async function listAdminReviews(query: AdminListQuery, status?: ReviewStatus) {
  const where = { ...(status ? { status } : {}), ...(query.search ? { OR: [
    { body: { contains: query.search, mode: "insensitive" as const } },
    { user: { email: { contains: query.search, mode: "insensitive" as const } } },
    { user: { profile: { is: { displayName: { contains: query.search, mode: "insensitive" as const } } } } },
    { product: { title: { contains: query.search, mode: "insensitive" as const } } },
  ] } : {}) };
  const orderBy = query.sort === "status" ? { status: query.direction } : query.sort === "rating" ? { rating: query.direction } : { createdAt: query.direction };
  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({ where, orderBy, skip: paginationOffset(query), take: query.pageSize, select: { id: true, body: true, rating: true, status: true, createdAt: true, updatedAt: true, user: { select: { email: true, profile: { select: { displayName: true } } } }, product: { select: { title: true, slug: true } } } }),
  ]);
  return { rows, meta: pageMeta(total, query) };
}

export async function setAdminReviewStatus(actorId: string, id: string, status: ReviewStatus, reason: string) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر وضعیت نظر را وارد کنید.");
  return prisma.$transaction(async (tx) => {
    const before = await tx.review.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!before) throw new AdminServiceError("NOT_FOUND", "نظر پیدا نشد.");
    if (before.status === status) throw new AdminServiceError("CONFLICT", "نظر از قبل همین وضعیت را دارد.");
    const updated = await tx.review.update({ where: { id }, data: { status }, select: { id: true, status: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: status === ReviewStatus.PUBLISHED ? "REVIEW_PUBLISHED" : status === ReviewStatus.HIDDEN ? "REVIEW_HIDDEN" : "REVIEW_RESTORED_TO_PENDING", targetType: "REVIEW", targetId: id, beforeState: before, afterState: updated, reason: trimmedReason });
    return updated;
  });
}
