import type { Metadata } from "next";
import { AdminInviteAcceptForm } from "@/components/admin/admin-invite-accept-form";

export const metadata: Metadata = { title: "فعال‌سازی حساب مدیر", robots: { index: false, follow: false } };

export default async function AdminInvitePage({ params }: { params: Promise<{ token: string }> }) {
  return <main className="admin-auth-page"><section className="admin-auth-card"><p className="admin-eyebrow">اُزون</p><h1>فعال‌سازی حساب مدیر</h1><p>اطلاعات حساب خود را تکمیل کنید.</p><AdminInviteAcceptForm token={(await params).token} /></section></main>;
}
