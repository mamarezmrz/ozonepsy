import { ReviewStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";

export type AdminReviewStatus = ReviewStatus | "USER_DELETED";

const userDeletedAction = "REVIEW_HIDDEN_BY_USER";

async function findUserDeletedReviewIds() {
  const rows = await prisma.adminAuditLog.findMany({
    where: { targetType: "REVIEW", action: userDeletedAction },
    select: { targetId: true },
  });
  return [...new Set(rows.map((row) => row.targetId))];
}

export async function listAdminReviews(query: AdminListQuery, status?: AdminReviewStatus) {
  const searchWhere = query.search ? { OR: [
    { body: { contains: query.search, mode: "insensitive" as const } },
    { user: { email: { contains: query.search, mode: "insensitive" as const } } },
    { user: { profile: { is: { displayName: { contains: query.search, mode: "insensitive" as const } } } } },
    { product: { title: { contains: query.search, mode: "insensitive" as const } } },
  ] } : {};
  const userDeletedIds = status === "USER_DELETED" ? await findUserDeletedReviewIds() : [];
  const where = {
    ...(status === "USER_DELETED" ? { id: { in: userDeletedIds }, status: ReviewStatus.HIDDEN } : status ? { status } : {}),
    ...searchWhere,
  };
  const orderBy = query.sort === "status" ? { status: query.direction } : query.sort === "rating" ? { rating: query.direction } : { createdAt: query.direction };
  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({ where, orderBy, skip: paginationOffset(query), take: query.pageSize, select: { id: true, body: true, rating: true, status: true, createdAt: true, updatedAt: true, user: { select: { email: true, profile: { select: { displayName: true } } } }, product: { select: { title: true, slug: true } } } }),
  ]);
  const userDeletedRows = rows.length
    ? await prisma.adminAuditLog.findMany({
        where: { targetType: "REVIEW", action: userDeletedAction, targetId: { in: rows.map((row) => row.id) } },
        select: { targetId: true },
      })
    : [];
  const userDeletedRowIds = new Set(userDeletedRows.map((row) => row.targetId));
  return { rows: rows.map((row) => userDeletedRowIds.has(row.id) ? { ...row, status: "USER_DELETED" as const } : row), meta: pageMeta(total, query) };
}

export async function setAdminReviewStatus(actorId: string, id: string, status: ReviewStatus, reason?: string) {
  const trimmedReason = reason?.trim() ?? "";
  if (status === ReviewStatus.PENDING && !trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر وضعیت نظر را وارد کنید.");
  return prisma.$transaction(async (tx) => {
    const before = await tx.review.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!before) throw new AdminServiceError("NOT_FOUND", "نظر پیدا نشد.");
    const userDeleted = await tx.adminAuditLog.findFirst({ where: { targetType: "REVIEW", targetId: id, action: userDeletedAction }, select: { id: true } });
    if (userDeleted) throw new AdminServiceError("CONFLICT", "نظر حذف‌شده توسط کاربر قابل تغییر نیست.");
    if (before.status === status) throw new AdminServiceError("CONFLICT", "نظر از قبل همین وضعیت را دارد.");
    const changed = await tx.review.updateMany({ where: { id, status: before.status }, data: { status } });
    if (changed.count !== 1) throw new AdminServiceError("CONFLICT", "وضعیت نظر هم‌زمان توسط کاربر دیگری تغییر کرده است.");
    const updated = await tx.review.findUniqueOrThrow({ where: { id }, select: { id: true, status: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: status === ReviewStatus.PUBLISHED ? "REVIEW_PUBLISHED" : status === ReviewStatus.HIDDEN ? "REVIEW_HIDDEN" : "REVIEW_RESTORED_TO_PENDING", targetType: "REVIEW", targetId: id, beforeState: before, afterState: updated, reason: trimmedReason });
    return updated;
  });
}
