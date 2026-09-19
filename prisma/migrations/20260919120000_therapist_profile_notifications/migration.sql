ALTER TYPE "AdminNotificationType" ADD VALUE 'THERAPIST_PROFILE_CHANGE';

ALTER TABLE "AdminNotification"
ADD COLUMN "targetId" UUID,
ADD COLUMN "resolvedAt" TIMESTAMP(3);

CREATE INDEX "AdminNotification_type_targetId_resolvedAt_idx" ON "AdminNotification"("type", "targetId", "resolvedAt");
