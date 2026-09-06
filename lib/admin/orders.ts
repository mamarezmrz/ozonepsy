import { OrderStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";

export async function listAdminOrders(query: AdminListQuery, status?: OrderStatus) {
  const where = { ...(status ? { status } : {}), ...(query.search ? { OR: [{ orderNumber: { contains: query.search, mode: "insensitive" as const } }, { productTitleSnapshot: { contains: query.search, mode: "insensitive" as const } }, { user: { email: { contains: query.search, mode: "insensitive" as const } } }] } : {}) };
  const orderBy = query.sort === "status" ? { status: query.direction } : query.sort === "totalMinor" ? { totalMinor: query.direction } : { createdAt: query.direction };
  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, orderBy, skip: paginationOffset(query), take: query.pageSize, select: { id: true, orderNumber: true, productTitleSnapshot: true, status: true, totalMinor: true, currency: true, createdAt: true, user: { select: { email: true } }, payments: { orderBy: { createdAt: "desc" }, take: 1, select: { provider: true, status: true } } } }),
  ]);
  return { rows, meta: pageMeta(total, query) };
}
