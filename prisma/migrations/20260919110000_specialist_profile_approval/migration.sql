ALTER TABLE "Specialist"
ADD COLUMN "pendingProfileChanges" JSONB,
ADD COLUMN "pendingProfileChangeAt" TIMESTAMP(3);
