# اُزون

پروژه‌ی وب اُزون با Next.js، Prisma و PostgreSQL. احراز هویت کاربر و پنل Admin دو session و cookie مستقل دارند.

## اجرای توسعه

ابتدا `DATABASE_URL` را در `.env` تنظیم کنید و سپس:

```powershell
npm install
npm run dev
```

سایت عمومی روی `http://localhost:3000` و پنل Admin روی `http://admin.localhost:3000` در دسترس است. اگر پورت یا host توسعه تغییر کرد، مقدار `ADMIN_DEV_HOST` باید دقیقاً با host درخواست برابر باشد.

## Bootstrap اولین Super Admin

در PowerShell مقادیر را فقط برای همان session ترمینال تنظیم کنید و از commit کردن آن‌ها خودداری کنید:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL = "admin@example.com"
$env:BOOTSTRAP_ADMIN_PASSWORD = "یک-رمز-حداقل-۱۲-کاراکتری"
$env:BOOTSTRAP_ADMIN_FIRST_NAME = "نام"
$env:BOOTSTRAP_ADMIN_LAST_NAME = "نام‌خانوادگی"
npm run admin:bootstrap
```

Bootstrap idempotent است: اگر یک `SUPER_ADMIN` فعال/موجود باشد، حساب دیگری ایجاد نمی‌کند. پس از ورود، cookie مستقل `ozone_admin_session` را در DevTools بررسی کنید؛ cookie کاربر `ozone_session` جداست.

## Migration و Prisma

برای بررسی schema و migrationهای موجود:

```powershell
npx prisma validate
npx prisma generate
npx prisma migrate status
```

قبل از اجرای `prisma migrate deploy` روی دیتابیس واقعی، schema diff، SQL، برنامه‌ی backfill، ریسک و rollback باید بررسی و تأیید شود. `prisma migrate reset` ممنوع است.

## تست و بررسی کیفیت

```powershell
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

تست‌های فعلی روی authorization، host isolation، same-origin، query validation، demo-payment gate و media validation تمرکز دارند. برای integration/E2E باید database تست جداگانه و محیط اجرای مستقل فراهم شود.

## تنظیمات مهم محیطی

نام و توضیح envها در `.env.example` قرار دارد. مهم‌ترین موارد:

- `DATABASE_URL`: اتصال PostgreSQL.
- `ADMIN_HOST`: host پنل در Production؛ در Production نبودن آن پنل را fail-safe مسدود می‌کند.
- `ADMIN_DEV_HOST`: host پنل در توسعه، به‌صورت پیش‌فرض `admin.localhost:3000`.
- `ADMIN_SESSION_TTL_SECONDS` و `ADMIN_IDLE_TTL_SECONDS`: طول عمر session Admin.
- `ADMIN_LOGIN_RATE_LIMIT_*` و `AUTH_RATE_LIMIT_*`: محدودکننده‌ی ورود و فرم‌های auth.
- `DEMO_PAYMENT_ENABLED` و `DEMO_PAYMENT_ALLOWED_ENVIRONMENTS`: پرداخت آزمایشی؛ Production همیشه مسدود است.
- `PASSWORD_RESET_TOKEN_TTL_SECONDS`, `EMAIL_PROVIDER`, `EMAIL_FROM`: بازیابی رمز و ارسال ایمیل.
- `PUBLIC_CONTENT_SOURCE`: حالت `auto`، `database` یا `static` برای مهاجرت کنترل‌شده‌ی FAQ و Testimonial.
- `MEDIA_STORAGE_PROVIDER`: `local` برای توسعه یا `s3` برای object storage تولید.
- `MEDIA_LOCAL_DIR`: مسیر local خارج از repository.
- `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`: فقط هنگام انتخاب S3.

هیچ password، token یا secret واقعی را در source code، `.env.example` یا Git قرار ندهید.

## معماری Admin

درخواست Admin ابتدا host را بررسی می‌کند و سپس در layout، route handler، permission helper و domain service احراز می‌شود. mutationهای حساس در transaction انجام می‌شوند و AuditLog همان transaction را همراهی می‌کند. `ADMIN` نمی‌تواند مدیریت Adminها یا permissionهای privileged را انجام دهد و محدودیت‌های `SUPER_ADMIN` در backend اعمال می‌شوند.

مسیر public `/admin` برای expose کردن پنل استفاده نمی‌شود؛ پنل فقط از Admin host قابل دسترسی است.
