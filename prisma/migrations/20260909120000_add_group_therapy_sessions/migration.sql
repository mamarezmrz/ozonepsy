-- Add the group-therapy instructor and scheduled session rows without changing existing products.
ALTER TABLE "GroupTherapyProduct"
  ADD COLUMN "instructorName" VARCHAR(200),
  ADD COLUMN "durationSessions" INTEGER;

CREATE TABLE "GroupTherapySession" (
    "id" UUID NOT NULL,
    "groupTherapyProductId" UUID NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupTherapySession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroupTherapySession_groupTherapyProductId_order_key" ON "GroupTherapySession"("groupTherapyProductId", "order");
CREATE INDEX "GroupTherapySession_groupTherapyProductId_startsAt_idx" ON "GroupTherapySession"("groupTherapyProductId", "startsAt");

ALTER TABLE "GroupTherapySession" ADD CONSTRAINT "GroupTherapySession_groupTherapyProductId_fkey"
  FOREIGN KEY ("groupTherapyProductId") REFERENCES "GroupTherapyProduct"("productId") ON DELETE CASCADE ON UPDATE CASCADE;
