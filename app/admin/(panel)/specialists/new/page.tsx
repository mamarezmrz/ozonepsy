import type { Metadata } from "next";
import { AdminButton, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminSpecialistForm } from "@/components/admin/admin-specialist-form";
import { requireAdminPagePermission } from "@/lib/admin/page";

export const metadata: Metadata = { title: "متخصص جدید" };
export default async function NewSpecialistPage() {
  await requireAdminPagePermission("instructors.write");
  return <div className="admin-page-stack"><AdminPageHeader title="متخصص جدید" description="اطلاعات متخصص را ثبت کنید." action={<AdminButton href="/specialists" variant="secondary">بازگشت</AdminButton>} /><section className="admin-panel-card"><AdminSpecialistForm action="/api/admin/specialists" successRedirect="/specialists" /></section></div>;
}
