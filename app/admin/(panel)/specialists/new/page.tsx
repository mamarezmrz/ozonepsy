import type { Metadata } from "next";
import { AdminButton, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminSpecialistForm } from "@/components/admin/admin-specialist-form";
import { requireAdminPagePermission } from "@/lib/admin/page";

export const metadata: Metadata = { title: "افزودن متخصص" };

export default async function NewSpecialistPage() {
  await requireAdminPagePermission("instructors.write");
  return <div className="admin-page-stack">
    <AdminPageHeader eyebrow="مدیریت متخصص ها" title="افزودن متخصص" description="اطلاعات متخصص را وارد کنید تا در زمان اختصاص جلسه در دسترس باشد." action={<AdminButton href="/admin/specialists" variant="secondary">بازگشت</AdminButton>} />
    <section className="admin-panel-card"><AdminSpecialistForm action="/api/admin/specialists" successRedirect="/admin/specialists" /></section>
  </div>;
}
