-- CreateTable
CREATE TABLE "IndividualConsultationCaseSection" (
    "id" UUID NOT NULL,
    "pageKey" VARCHAR(40) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndividualConsultationCaseSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndividualConsultationCase" (
    "id" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndividualConsultationCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndividualConsultationTopic" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "introList" JSONB,
    "signsTitle" VARCHAR(240),
    "signs" JSONB NOT NULL,
    "signsNote" TEXT,
    "why" TEXT NOT NULL,
    "whenToGetHelpTitle" VARCHAR(240),
    "whenToGetHelp" JSONB NOT NULL,
    "whatHelps" JSONB NOT NULL,
    "approachTitle" VARCHAR(240),
    "approachParagraphs" JSONB,
    "approach" JSONB NOT NULL,
    "hideShortQuestions" BOOLEAN NOT NULL DEFAULT true,
    "shortQuestions" JSONB NOT NULL,
    "imageMode" VARCHAR(20) NOT NULL DEFAULT 'multiply',
    "heroMediaId" UUID,
    "heroImageRemoved" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndividualConsultationTopic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IndividualConsultationCaseSection_pageKey_key" ON "IndividualConsultationCaseSection"("pageKey");

-- CreateIndex
CREATE INDEX "IndividualConsultationCase_sectionId_status_sortOrder_idx" ON "IndividualConsultationCase"("sectionId", "status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "IndividualConsultationCase_sectionId_slug_key" ON "IndividualConsultationCase"("sectionId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "IndividualConsultationTopic_slug_key" ON "IndividualConsultationTopic"("slug");

-- CreateIndex
CREATE INDEX "IndividualConsultationTopic_status_updatedAt_idx" ON "IndividualConsultationTopic"("status", "updatedAt");

-- AddForeignKey
ALTER TABLE "IndividualConsultationCase" ADD CONSTRAINT "IndividualConsultationCase_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "IndividualConsultationCaseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndividualConsultationTopic" ADD CONSTRAINT "IndividualConsultationTopic_heroMediaId_fkey" FOREIGN KEY ("heroMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the existing public card inventory without replacing any existing data.
INSERT INTO "IndividualConsultationCaseSection" ("id", "pageKey", "title", "description", "enabled", "updatedAt")
VALUES
  ('00000000-0000-0000-0000-000000000601', 'individual', 'مشاوره فردی شامل چه مشکلاتی می‌شود', 'مشاوره فردی به هر آن چیزی که برای توسعه فردی، درمان اختلالات روانی و ارتقاء سلامت روان نیاز است، می‌پردازد. این مشاوره به صورت محرمانه بین شما و تراپیست مورد نظر انجام می‌شود.', true, CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000602', 'couples', 'زوج‌درمانی برای چه موضوعاتی مناسب است؟', 'موضوعات قابل مدیریت در جلسات زوج‌درمانی را از این بخش تنظیم کنید.', true, CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000603', 'teenagers', 'مشاوره کودک و نوجوان برای چه موضوعاتی است؟', 'موضوعات قابل مدیریت در جلسات کودک و نوجوان را از این بخش تنظیم کنید.', true, CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000604', 'group-therapy', 'گروه درمانی برای چه موضوعاتی مناسب است؟', 'موضوعات مناسب گروه‌درمانی را از این بخش مدیریت کنید.', true, CURRENT_TIMESTAMP)
ON CONFLICT ("pageKey") DO NOTHING;

INSERT INTO "IndividualConsultationCase" ("id", "sectionId", "title", "slug", "sortOrder", "status", "updatedAt")
VALUES
  ('00000000-0000-0000-0000-000000000611', '00000000-0000-0000-0000-000000000601', 'اختلال اضطراب', 'anxiety-disorders', 0, 'PUBLISHED', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000612', '00000000-0000-0000-0000-000000000601', 'اختلال افسردگی', 'depressive-disorders', 1, 'PUBLISHED', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000613', '00000000-0000-0000-0000-000000000601', 'اختلال وسواس فکری-عملی', 'ocd', 2, 'PUBLISHED', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000614', '00000000-0000-0000-0000-000000000601', 'اختلال استرس پس از سانحه', 'ptsd', 3, 'PUBLISHED', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000615', '00000000-0000-0000-0000-000000000601', 'اختلالات شخصیت', 'personality-disorders', 4, 'PUBLISHED', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000616', '00000000-0000-0000-0000-000000000601', 'اختلالات مرتبط با اعتمادبه‌نفس و هویت', 'self-esteem-identity-issues', 5, 'PUBLISHED', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
