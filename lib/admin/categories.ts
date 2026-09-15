import { CategoryStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

/**
 * Read-only category lookup used by course forms to preserve the product's
 * existing category relation. Category management itself is not exposed in
 * the admin panel.
 */
export async function listActiveAdminCategories() {
  return prisma.category.findMany({
    where: { status: CategoryStatus.ACTIVE },
    orderBy: { title: "asc" },
    select: { id: true, title: true, slug: true },
  });
}
