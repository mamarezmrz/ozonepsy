-- Additive completion migration for categories, audit outcomes, admin invites,
-- and specialist identity links. No existing row is deleted or rewritten.

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('SUCCESS', 'FAILURE');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "AdminAuditLog" ADD COLUMN "result" "AuditResult" NOT NULL DEFAULT 'SUCCESS';

-- AlterTable
ALTER TABLE "Specialist" ADD COLUMN "userId" UUID;

-- CreateTable
CREATE TABLE "AdminInvite" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "role" "RoleName" NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID NOT NULL,
    "acceptedUserId" UUID,

    CONSTRAINT "AdminInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminInvite_tokenHash_key" ON "AdminInvite"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "AdminInvite_acceptedUserId_key" ON "AdminInvite"("acceptedUserId");

-- CreateIndex
CREATE INDEX "AdminInvite_email_expiresAt_idx" ON "AdminInvite"("email", "expiresAt");

-- CreateIndex
CREATE INDEX "AdminInvite_createdById_createdAt_idx" ON "AdminInvite"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "AdminInvite_revokedAt_usedAt_expiresAt_idx" ON "AdminInvite"("revokedAt", "usedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "Category_status_updatedAt_idx" ON "Category"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Specialist_userId_key" ON "Specialist"("userId");

-- AddForeignKey
ALTER TABLE "AdminInvite" ADD CONSTRAINT "AdminInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminInvite" ADD CONSTRAINT "AdminInvite_acceptedUserId_fkey" FOREIGN KEY ("acceptedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specialist" ADD CONSTRAINT "Specialist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
