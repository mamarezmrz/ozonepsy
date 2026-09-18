-- Add OAuth identities for external sign-in providers.
CREATE TABLE "AuthIdentity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "provider" VARCHAR(40) NOT NULL,
    "providerAccountId" VARCHAR(255) NOT NULL,
    "email" VARCHAR(320),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthIdentity_provider_providerAccountId_key" ON "AuthIdentity"("provider", "providerAccountId");
CREATE INDEX "AuthIdentity_userId_idx" ON "AuthIdentity"("userId");

ALTER TABLE "AuthIdentity" ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing requests stay readable; new requests are validated as required by the API.
ALTER TABLE "PreconsultationRequest" ADD COLUMN "fullName" VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE "PreconsultationRequest" ADD COLUMN "email" VARCHAR(320) NOT NULL DEFAULT '';
ALTER TABLE "Appointment" ADD COLUMN "notes" TEXT;

CREATE TYPE "AdminNotificationType" AS ENUM ('PRECONSULTATION_REQUEST', 'REVIEW_SUBMITTED');

CREATE TABLE "AdminNotification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "AdminNotificationType" NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "href" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");
CREATE INDEX "AdminNotification_type_createdAt_idx" ON "AdminNotification"("type", "createdAt");
