CREATE TABLE "CourseTag" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseTag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseTag_name_key" ON "CourseTag"("name");
