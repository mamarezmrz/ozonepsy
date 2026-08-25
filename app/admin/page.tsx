import { DashboardShell } from "@/components/dashboard-shell";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
export const metadata: Metadata = createPageMetadata("مدیریت اُزون");
export default function AdminPage(){return <DashboardShell admin><h1 className="text-3xl font-black">نمای کلی مدیریت</h1><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["کاربران فعال","۲۴۸"],["سفارش‌های امروز","۱۸"],["پرداخت‌های در انتظار","۳"],["جلسات این هفته","۴۲"]].map(([label,value])=><div key={label} className="rounded-[24px] bg-white p-6 shadow-sm"><p className="text-sm text-[#676b6b]">{label}</p><strong className="mt-3 block text-3xl text-[#355859]">{value}</strong></div>)}</div><div className="mt-8 rounded-[28px] bg-[#355859] p-8 text-white"><h2 className="text-2xl font-black">عملیات مورد توجه</h2><p className="mt-3 text-white/70">۳ پرداخت نیاز به بررسی و ۵ جلسه برای ثبت وضعیت دارند.</p></div></DashboardShell>}
