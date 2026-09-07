import type { Metadata } from "next";
import { AdminButton, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminCourseCreateForm } from "@/components/admin/admin-course-create-form";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { listActiveAdminCategories } from "@/lib/admin/categories";

export const metadata: Metadata = { title: "دوره جدید" };
export default async function NewCoursePage() { await requireAdminPagePermission("courses.write"); const categories = await listActiveAdminCategories(); return <div className="admin-page-stack admin-course-create-page"><AdminPageHeader eyebrow="Course" title="ایجاد دوره" action={<AdminButton href="/courses" variant="secondary">بازگشت</AdminButton>} /><section className="admin-panel-card admin-course-create-card"><AdminCourseCreateForm categories={categories} /></section></div>; }
