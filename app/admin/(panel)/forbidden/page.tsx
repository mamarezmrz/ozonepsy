import type { Metadata } from "next";

export const metadata: Metadata = { title: "دسترسی غیرمجاز" };

export default function AdminForbiddenPage() {
  return (
    <section className="admin-placeholder-card admin-forbidden-card">
      <span className="admin-error-code">۴۰۳</span>
      <h2>دسترسی غیرمجاز</h2>
      <p>مجوز لازم برای مشاهده یا انجام این عملیات را ندارید.</p>
    </section>
  );
}
