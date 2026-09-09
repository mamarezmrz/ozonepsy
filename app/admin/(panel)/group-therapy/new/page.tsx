import type { Metadata } from "next";
import { AdminButton, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminGroupTherapyForm } from "@/components/admin/admin-therapy-product-forms";
import { requireAdminPagePermission } from "@/lib/admin/page";

export const metadata: Metadata = { title: "گروه‌درمانی جدید" };

export default async function NewGroupTherapyPage() {
  await requireAdminPagePermission("products.write");
  return <div className="admin-page-stack admin-course-create-page"><AdminPageHeader eyebrow="Group Therapy" title="ایجاد گروه‌درمانی" action={<AdminButton href="/group-therapy" variant="secondary">بازگشت</AdminButton>} /><section className="admin-panel-card admin-course-create-card"><AdminGroupTherapyForm /></section></div>;
}
