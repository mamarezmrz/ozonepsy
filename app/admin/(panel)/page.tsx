import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin/session";

export const metadata: Metadata = { title: "نمای کلی" };

const foundationItems = [
  ["احراز هویت مستقل", "AdminSession و کوکی جداگانه فعال است."],
  ["کنترل دسترسی", "مجوزها در سمت سرور بررسی می‌شوند."],
  ["ثبت رویداد امنیتی", "ورود و خروج ادمین قابل پیگیری است."],
] as const;

export default async function AdminOverviewPage() {
  const session = await requireAdminSession();

  return (
    <div className="admin-page-stack">
      <section className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">فضای عملیاتی اُزون</p>
          <h2>نمای کلی</h2>
          <p>سلام {session.displayName?.trim() || session.email}؛ پنل مدیریت آماده است.</p>
        </div>
        <span className="admin-secure-badge">دسترسی تأیید شد</span>
      </section>

      <section className="admin-foundation-card" aria-labelledby="foundation-title">
        <div className="admin-section-heading">
          <h3 id="foundation-title">پایه‌های پنل مدیریت</h3>
          <span>فاز ۱ و ۲</span>
        </div>
        <div className="admin-foundation-grid">
          {foundationItems.map(([title, description]) => (
            <article key={title} className="admin-foundation-item">
              <span className="admin-status-dot" aria-hidden="true" />
              <div><h4>{title}</h4><p>{description}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-empty-card">
        <h3>ماژول‌های عملیاتی</h3>
        <p>ماژول‌های مدیریت کاربران، دوره‌ها، جلسات و محتوا در فازهای بعدی به همین زیرساخت متصل می‌شوند.</p>
      </section>
    </div>
  );
}
