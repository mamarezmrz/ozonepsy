ALTER TABLE "Faq" ADD COLUMN "pageKey" VARCHAR(80) NOT NULL DEFAULT 'home';

CREATE INDEX "Faq_pageKey_status_sortOrder_idx" ON "Faq"("pageKey", "status", "sortOrder");
