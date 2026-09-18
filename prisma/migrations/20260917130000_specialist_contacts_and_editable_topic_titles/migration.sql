-- Keep existing specialists and consultation topics intact while adding the
-- fields needed by the admin directory and editable topic section headings.
ALTER TABLE "Specialist" ADD COLUMN "phone" VARCHAR(40);
ALTER TABLE "Specialist" ADD COLUMN "country" VARCHAR(120);
ALTER TABLE "Specialist" ADD COLUMN "email" VARCHAR(320);

ALTER TABLE "IndividualConsultationTopic" ADD COLUMN "whyTitle" VARCHAR(240) NOT NULL DEFAULT 'چرا پیش می‌آید؟';
ALTER TABLE "IndividualConsultationTopic" ADD COLUMN "whatHelpsTitle" VARCHAR(240) NOT NULL DEFAULT 'چه کارهایی معمولاً کمک می‌کند؟';
ALTER TABLE "IndividualConsultationTopic" ADD COLUMN "customSections" JSONB;
