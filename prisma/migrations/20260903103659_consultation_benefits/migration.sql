-- CreateTable
CREATE TABLE "ConsultationBenefitsSection" (
    "id" UUID NOT NULL,
    "pageKey" VARCHAR(40) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationBenefitsSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationBenefit" (
    "id" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationBenefitsSection_pageKey_key" ON "ConsultationBenefitsSection"("pageKey");

-- CreateIndex
CREATE INDEX "ConsultationBenefitsSection_enabled_idx" ON "ConsultationBenefitsSection"("enabled");

-- CreateIndex
CREATE INDEX "ConsultationBenefit_sectionId_sortOrder_idx" ON "ConsultationBenefit"("sectionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationBenefit_sectionId_sortOrder_key" ON "ConsultationBenefit"("sectionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ConsultationBenefit" ADD CONSTRAINT "ConsultationBenefit_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ConsultationBenefitsSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the current public benefit cards so the new database-backed sections
-- preserve the existing public content on first deployment.
INSERT INTO "ConsultationBenefitsSection" ("id", "pageKey", "enabled", "createdAt", "updatedAt") VALUES
  ('11111111-1111-4111-8111-111111111111', 'individual', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('22222222-2222-4222-8222-222222222222', 'couples', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('33333333-3333-4333-8333-333333333333', 'teenagers', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('44444444-4444-4444-8444-444444444444', 'group-therapy', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ConsultationBenefit" ("id", "sectionId", "title", "description", "sortOrder", "createdAt", "updatedAt") VALUES
  ('11111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111111', 'آرامش ذهنی روزمره', 'کمک می‌کند افکار مزاحم را بشناسید و ذهنتان را آرام کنید.', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-4111-8111-111111111102', '11111111-1111-4111-8111-111111111111', 'عبور از گذشته', 'به کمک مشاوره، از رنج‌های قدیمی عبور می‌کنید و دوباره راهتان را پیدا می‌کنید.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-4111-8111-111111111103', '11111111-1111-4111-8111-111111111111', 'افزایش اعتماد به نفس', 'یاد می‌گیرید ارزش خود را نه از موفقیت‌ها، بلکه از درون خودتان بشناسید.', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-4111-8111-111111111104', '11111111-1111-4111-8111-111111111111', 'بازسازی انگیزه و امید', 'وقتی از درون روشن می‌شوید، دوباره میل به زندگی برمی‌گردد.', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-4111-8111-111111111105', '11111111-1111-4111-8111-111111111111', 'پذیرش دردها', 'فقط تسکین موقت نه؛ درمان از ریشه و بازسازی درون.', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('11111111-1111-4111-8111-111111111106', '11111111-1111-4111-8111-111111111111', 'تصمیم‌های روشن', 'زندگی به تو اجازه می‌دهد انتخاب کنی؛ «می‌خواهم» و «نمی‌خواهم» را بشناسی.', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('22222222-2222-4222-8222-222222222201', '22222222-2222-4222-8222-222222222222', 'درک زبان عشق یکدیگر', 'می‌فهمید چرا محبت یکی دیده نمی‌شود و چطور باید ترجمه‌اش کرد.', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('22222222-2222-4222-8222-222222222202', '22222222-2222-4222-8222-222222222222', 'خروج از چرخه مقصرسازی', 'یاد می‌گیرید از چرخه مقصرسازی و قهرهای طولانی خارج شوید.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('22222222-2222-4222-8222-222222222203', '22222222-2222-4222-8222-222222222222', 'مدیریت اختلاف با احترام', 'تفاوت‌ها به دشمنی تبدیل نمی‌شوند، بلکه به فرصت شناخت بدل می‌گردند.', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('22222222-2222-4222-8222-222222222204', '22222222-2222-4222-8222-222222222222', 'ساخت آینده مشترک سالم', 'درمان زوجی فقط نجات امروز نیست، بلکه طراحی فردای رابطه است.', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('22222222-2222-4222-8222-222222222205', '22222222-2222-4222-8222-222222222222', 'رشد دو نفره', 'هر دو نفر در مسیر درمان، رشد فردی و رابطه‌ای را با هم طی می‌کنید.', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('22222222-2222-4222-8222-222222222206', '22222222-2222-4222-8222-222222222222', 'بازسازی صمیمیت', 'عاطفه، گرما و لمس دوباره به رابطه برمی‌گردد.', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('33333333-3333-4333-8333-333333333301', '33333333-3333-4333-8333-333333333333', 'بیان احساسات با بازی', 'کودک بدون ترس یاد می‌گیرد احساساتش را از طریق بازی ابراز کند.', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('33333333-3333-4333-8333-333333333302', '33333333-3333-4333-8333-333333333333', 'افزایش تمرکز و اعتمادبه‌نفس', 'با روش‌های عملی، توانایی تمرکز و باور به خودش رشد می‌کند.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('33333333-3333-4333-8333-333333333303', '33333333-3333-4333-8333-333333333333', 'پیشگیری از مشکلات آینده', 'مشکلات عاطفی در کودکی، قبل از اینکه عمیق شوند، شناسایی می‌شوند.', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('33333333-3333-4333-8333-333333333304', '33333333-3333-4333-8333-333333333333', 'بهبود رابطه با والدین', 'کودک یاد می‌گیرد خواسته‌ها و احساساتش را بدون پرخاش یا سکوت بیان کند.', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('33333333-3333-4333-8333-333333333305', '33333333-3333-4333-8333-333333333333', 'بهبود عملکرد تحصیلی', 'وقتی اضطراب و فشار کودک کمتر شود، یادگیری راحت‌تر می‌شود.', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('33333333-3333-4333-8333-333333333306', '33333333-3333-4333-8333-333333333333', 'آموزش مهارت‌های اجتماعی', 'یاد می‌گیرد دوستی کند، همکاری کند و اختلاف‌ها را حل کند.', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('44444444-4444-4444-8444-444444444401', '44444444-4444-4444-8444-444444444444', 'تنها نیستی', 'می‌فهمی دیگران هم احساساتی مثل تو درگیرن، حتی اونایی که فکر می‌کنی فقط مال تو هستن.', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('44444444-4444-4444-8444-444444444402', '44444444-4444-4444-8444-444444444444', 'آینه‌ی انسانی', 'با شنیدن تجربه‌ی دیگران، خودت را واضح‌تر می‌بینی.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('44444444-4444-4444-8444-444444444403', '44444444-4444-4444-8444-444444444444', 'تمرین ارتباط سالم', 'یاد می‌گیری احساساتت را بدون اینکه دفاعی یا خجالت‌زده شوی، بیان کنی.', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('44444444-4444-4444-8444-444444444404', '44444444-4444-4444-8444-444444444444', 'افزایش امید برای تغییر', 'حس همراهی گروه، انگیزه‌ات را بیشتر می‌کند که در مسیر بمانی.', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('44444444-4444-4444-8444-444444444405', '44444444-4444-4444-8444-444444444444', 'تنظیم احساسات', 'یاد می‌گیری چطور خشم، غم، یا ترس را بشناسی و مدیریت کنی.', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('44444444-4444-4444-8444-444444444406', '44444444-4444-4444-8444-444444444444', 'رشد اجتماعی', 'اعتماد به‌نفست در جمع بالا می‌رود و مهارت ارتباطت قوی‌تر می‌شود.', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
