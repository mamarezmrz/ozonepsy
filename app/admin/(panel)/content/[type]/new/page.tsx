import type { Metadata } from "next";
import { AdminButton, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminContentForm } from "@/components/admin/admin-content-form";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { isFaqPageKey } from "@/lib/public/faq-pages";

export const metadata: Metadata = { title: "محتوای جدید" };
export default async function NewContentPage({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) { await requireAdminPagePermission("content.write"); const { type: rawType } = await params; const values = await searchParams; const requestedPageKey = typeof values.pageKey === "string" ? values.pageKey : undefined; const pageKey = isFaqPageKey(requestedPageKey) ? requestedPageKey : "home"; const type = rawType === "faq" ? "faq" : rawType === "testimonials" ? "testimonial" : null; if (!type) return <div className="admin-page-stack"><AdminPageHeader title="نوع محتوا پیدا نشد" /></div>; const title = type === "faq" ? "سوال متداول جدید" : "نظر مشتری جدید"; const backHref = type === "faq" ? `/admin/content/faq?pageKey=${pageKey}` : `/admin/content/${rawType}`; return <div className="admin-page-stack"><AdminPageHeader eyebrow="محتوای ساختاریافته" title={title} action={<AdminButton href={backHref} variant="secondary">بازگشت</AdminButton>} /><section className="admin-panel-card"><AdminContentForm type={type} action={`/api/admin/content/${rawType}`} successRedirect={backHref} initialFaqPage={pageKey} /></section></div>; }
