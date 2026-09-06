import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminButton, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminContentForm } from "@/components/admin/admin-content-form";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { getAdminContent } from "@/lib/admin/content";
import { AdminServiceError } from "@/lib/admin/errors";

export const metadata: Metadata = { title: "ویرایش محتوا" };
export default async function EditContentPage({ params }: { params: Promise<{ type: string; id: string }> }) { await requireAdminPagePermission("content.write"); const { type: rawType, id } = await params; const type = rawType === "faq" ? "faq" : rawType === "testimonials" ? "testimonial" : null; if (!type) notFound(); let values; try { values = await getAdminContent(type, id); } catch (error) { if (error instanceof AdminServiceError && error.code === "NOT_FOUND") notFound(); throw error; } const title = type === "faq" ? "ویرایش سوال متداول" : "ویرایش نظر مشتری"; return <div className="admin-page-stack"><AdminPageHeader eyebrow="محتوای ساختاریافته" title={title} action={<AdminButton href={`/content/${rawType}`} variant="secondary">بازگشت</AdminButton>} /><section className="admin-panel-card"><AdminContentForm type={type} action={`/api/admin/content/${rawType}/${id}`} values={values} successRedirect={`/content/${rawType}`} /></section></div>; }
