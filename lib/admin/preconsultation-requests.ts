import { prisma } from "@/lib/prisma";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";

export async function listAdminPreconsultationRequests(query: AdminListQuery) {
  const search = query.search.trim();
  const where = search
    ? {
        OR: [
          { country: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
          { message: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.preconsultationRequest.count({ where }),
    prisma.preconsultationRequest.findMany({
      where,
      orderBy: { createdAt: query.direction },
      skip: paginationOffset(query),
      take: query.pageSize,
      select: { id: true, country: true, phone: true, message: true, createdAt: true },
    }),
  ]);

  return { rows, meta: pageMeta(total, query) };
}
