import { EntitlementStatus, ProductKind } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function userHasCourseAccess(userId: string, productSlug: string) {
  const now = new Date();
  const entitlement = await prisma.entitlement.findFirst({
    where: {
      userId,
      status: EntitlementStatus.ACTIVE,
      startsAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      product: {
        slug: productSlug,
        kind: ProductKind.COURSE,
      },
    },
    select: { id: true },
  });

  return Boolean(entitlement);
}
