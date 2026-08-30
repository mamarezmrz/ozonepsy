import type { Metadata } from "next";
import { notFound } from "next/navigation";

const pages = {
  users: "کاربران",
  products: "محصولات",
  orders: "سفارش‌ها",
  payments: "پرداخت‌ها",
  entitlements: "دسترسی‌ها",
  sessions: "جلسات",
  "audit-logs": "گزارش فعالیت",
} as const;

type PageKey = keyof typeof pages;

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  const title = pages[page as PageKey];
  return title ? { title } : {};
}

export default async function AdminPlaceholderPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const title = pages[page as PageKey];
  if (!title) notFound();

  return (
    <section className="admin-placeholder-card">
      <p className="admin-eyebrow">ماژول پنل مدیریت</p>
      <h2>{title}</h2>
      <p>ساختار این بخش آماده است و قابلیت‌های عملیاتی آن در فاز بعدی تکمیل می‌شود.</p>
    </section>
  );
}
