CREATE TYPE "SpecialistPayoutStatus" AS ENUM ('PENDING', 'PAID', 'CANCELED');

CREATE TABLE "SpecialistClientNote" (
    "id" UUID NOT NULL,
    "specialistId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialistClientNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SpecialistPayout" (
    "id" UUID NOT NULL,
    "specialistId" UUID NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "SpecialistPayoutStatus" NOT NULL DEFAULT 'PAID',
    "paidAt" TIMESTAMP(3),
    "reference" VARCHAR(200),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialistPayout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SpecialistClientNote_specialistId_userId_key" ON "SpecialistClientNote"("specialistId", "userId");
CREATE INDEX "SpecialistClientNote_userId_updatedAt_idx" ON "SpecialistClientNote"("userId", "updatedAt");
CREATE INDEX "SpecialistPayout_specialistId_createdAt_idx" ON "SpecialistPayout"("specialistId", "createdAt");
CREATE INDEX "SpecialistPayout_specialistId_status_paidAt_idx" ON "SpecialistPayout"("specialistId", "status", "paidAt");

ALTER TABLE "SpecialistClientNote" ADD CONSTRAINT "SpecialistClientNote_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "Specialist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpecialistClientNote" ADD CONSTRAINT "SpecialistClientNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpecialistPayout" ADD CONSTRAINT "SpecialistPayout_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "Specialist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
