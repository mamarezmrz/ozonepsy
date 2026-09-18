import { prisma } from "@/lib/prisma";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";
import { PreconsultationRequestStatus } from "@/lib/generated/prisma/enums";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";

export async function listAdminPreconsultationRequests(query: AdminListQuery, status?: PreconsultationRequestStatus) {
  const search = query.search.trim();
  const where = search
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { country: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
          { message: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};
  const filteredWhere = { ...where, ...(status ? { status } : {}) };

  const [total, rows] = await Promise.all([
    prisma.preconsultationRequest.count({ where: filteredWhere }),
    prisma.preconsultationRequest.findMany({
      where: filteredWhere,
      orderBy: { createdAt: query.direction },
      skip: paginationOffset(query),
      take: query.pageSize,
      select: { id: true, fullName: true, email: true, country: true, phone: true, message: true, status: true, createdAt: true },
    }),
  ]);

  return { rows, meta: pageMeta(total, query) };
}

export async function updateAdminPreconsultationRequestStatus(id: string, actorId: string, status: PreconsultationRequestStatus) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.preconsultationRequest.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!before) throw new AdminServiceError("NOT_FOUND", "درخواست پیش‌مشاوره پیدا نشد.");
    if (before.status === status) throw new AdminServiceError("CONFLICT", "درخواست از قبل همین وضعیت را دارد.");
    const updated = await tx.preconsultationRequest.update({ where: { id }, data: { status }, select: { id: true, status: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: "PRECONSULTATION_REQUEST_STATUS_CHANGED", targetType: "PRECONSULTATION_REQUEST", targetId: id, beforeState: before, afterState: updated });
    return updated;
  });
}
