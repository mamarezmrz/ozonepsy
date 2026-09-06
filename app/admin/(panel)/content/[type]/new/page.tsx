import type { Metadata } from "next";
import { AdminButton, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminContentForm } from "@/components/admin/admin-content-form";
import { requireAdminPagePermission } from "@/lib/admin/page";

export const metadata: Metadata = { title: "محتوای جدید" };
export default async function NewContentPage({ params }: { params: Promise<{ type: string }> }) { await requireAdminPagePermission("content.write"); const { type: rawType } = await params; const type = rawType === "faq" ? "faq" : rawType === "testimonials" ? "testimonial" : null; if (!type) return <div className="admin-page-stack"><AdminPageHeader title="نوع محتوا پیدا نشد" /></div>; const title = type === "faq" ? "سوال متداول جدید" : "نظر مشتری جدید"; return <div className="admin-page-stack"><AdminPageHeader eyebrow="محتوای ساختاریافته" title={title} action={<AdminButton href={`/content/${rawType}`} variant="secondary">بازگشت</AdminButton>} /><section className="admin-panel-card"><AdminContentForm type={type} action={`/api/admin/content/${rawType}`} successRedirect={`/content/${rawType}`} /></section></div>; }
