-- CreateEnum
CREATE TYPE "SupportContributionStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELED');

-- CreateTable
CREATE TABLE "SupportContribution" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "donorName" VARCHAR(200),
    "amountMinor" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "SupportContributionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportContribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportContribution_status_createdAt_idx" ON "SupportContribution"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportContribution_userId_createdAt_idx" ON "SupportContribution"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "SupportContribution" ADD CONSTRAINT "SupportContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
