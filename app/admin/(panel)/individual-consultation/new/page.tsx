import type { Metadata } from "next";
import { AdminButton, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminIndividualConsultationForm } from "@/components/admin/admin-therapy-product-forms";
import { requireAdminPagePermission } from "@/lib/admin/page";

export const metadata: Metadata = { title: "مشاوره فردی جدید" };
export default async function NewIndividualConsultationPage() { await requireAdminPagePermission("products.write"); return <div className="admin-page-stack admin-course-create-page"><AdminPageHeader eyebrow="Consultation" title="ایجاد مشاوره فردی" action={<AdminButton href="/individual-consultation" variant="secondary">بازگشت</AdminButton>} /><section className="admin-panel-card admin-course-create-card"><AdminIndividualConsultationForm /></section></div>; }
