import { SupportContributionStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function getPublicSupportFundTotal(): Promise<number> {
  const total = await prisma.supportContribution.aggregate({
    where: {
      status: SupportContributionStatus.PAID,
      currency: "USD",
    },
    _sum: { amountMinor: true },
  });

  return total._sum.amountMinor ?? 0;
}
