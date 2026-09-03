import { MediaStatus, MediaVisibility } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";
import type { AdminSessionView } from "@/lib/admin/session";

export async function listAdminMedia(query: AdminListQuery, visibility?: MediaVisibility, status?: MediaStatus) {
  const where = {
    ...(visibility ? { visibility } : {}),
    ...(status ? { status } : {}),
    ...(query.search ? { OR: [{ originalName: { contains: query.search, mode: "insensitive" as const } }, { mimeType: { contains: query.search, mode: "insensitive" as const } }] } : {}),
  };
  const orderBy = query.sort === "originalName" ? { originalName: query.direction } : query.sort === "size" ? { size: query.direction } : { createdAt: query.direction };
  const [total, rows] = await Promise.all([
    prisma.mediaAsset.count({ where }),
    prisma.mediaAsset.findMany({
      where,
      orderBy,
      skip: paginationOffset(query),
      take: query.pageSize,
      select: { id: true, originalName: true, mimeType: true, extension: true, size: true, width: true, height: true, visibility: true, status: true, createdAt: true, _count: { select: { products: true, specialists: true, lessons: true, testimonials: true, consultationTopics: true } } },
    }),
  ]);
  return { rows, meta: pageMeta(total, query) };
}

export async function archiveAdminMedia(session: AdminSessionView, id: string, reason: string) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "دلیل بایگانی رسانه الزامی است.");
  return prisma.$transaction(async (tx) => {
    const before = await tx.mediaAsset.findUnique({ where: { id }, select: { id: true, status: true, visibility: true, originalName: true, _count: { select: { products: true, specialists: true, lessons: true, testimonials: true, consultationTopics: true } } } });
    if (!before) throw new AdminServiceError("NOT_FOUND", "رسانه پیدا نشد.");
    if (before.status === MediaStatus.ARCHIVED) throw new AdminServiceError("CONFLICT", "رسانه از قبل بایگانی شده است.");
    const references = before._count.products + before._count.specialists + before._count.lessons + before._count.testimonials + before._count.consultationTopics;
    if (references > 0) throw new AdminServiceError("CONFLICT", "این رسانه هنوز در بخش دیگری استفاده می‌شود و قابل بایگانی نیست.");
    const updated = await tx.mediaAsset.update({ where: { id }, data: { status: MediaStatus.ARCHIVED }, select: { id: true, status: true } });
    await recordAdminAuditWithClient(tx, { actorId: session.userId, action: "MEDIA_ARCHIVED", targetType: "MEDIA", targetId: id, beforeState: before, afterState: updated, reason: trimmedReason });
    return updated;
  });
}

export async function createAdminMedia(session: AdminSessionView, input: {
  id: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  extension: string;
  size: number;
  visibility: MediaVisibility;
}) {
  return prisma.$transaction(async (tx) => {
    const media = await tx.mediaAsset.create({
      data: {
        id: input.id,
        storageKey: input.storageKey,
        originalName: input.originalName,
        mimeType: input.mimeType,
        extension: input.extension,
        size: input.size,
        visibility: input.visibility,
        status: MediaStatus.ACTIVE,
        uploaderId: session.userId,
      },
      select: { id: true, originalName: true, mimeType: true, size: true, visibility: true, status: true },
    });
    await recordAdminAuditWithClient(tx, { actorId: session.userId, action: "MEDIA_UPLOADED", targetType: "MEDIA", targetId: media.id, afterState: media });
    return media;
  });
}

export async function getAdminMedia(id: string, session: AdminSessionView) {
  if (!session.permissions.includes("media.read")) throw new AdminServiceError("FORBIDDEN", "مجوز مشاهده رسانه را ندارید.");
  const media = await prisma.mediaAsset.findUnique({ where: { id }, select: { id: true, storageKey: true, originalName: true, mimeType: true, extension: true, size: true, width: true, height: true, altText: true, visibility: true, status: true, createdAt: true, _count: { select: { products: true, specialists: true, lessons: true, testimonials: true, consultationTopics: true } } } });
  if (!media) throw new AdminServiceError("NOT_FOUND", "رسانه پیدا نشد.");
  return media;
}
