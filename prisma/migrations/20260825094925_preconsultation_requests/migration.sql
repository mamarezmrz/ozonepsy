-- CreateEnum
CREATE TYPE "PreconsultationRequestStatus" AS ENUM ('PENDING', 'CONTACTED', 'COMPLETED', 'CANCELED');

-- CreateTable
CREATE TABLE "PreconsultationRequest" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "country" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(40) NOT NULL,
    "message" TEXT,
    "status" "PreconsultationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreconsultationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PreconsultationRequest_status_createdAt_idx" ON "PreconsultationRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PreconsultationRequest_userId_createdAt_idx" ON "PreconsultationRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PreconsultationRequest_country_createdAt_idx" ON "PreconsultationRequest"("country", "createdAt");

-- AddForeignKey
ALTER TABLE "PreconsultationRequest" ADD CONSTRAINT "PreconsultationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
