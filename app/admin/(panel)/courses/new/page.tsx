import type { Metadata } from "next";
import { AdminButton, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminCourseForm } from "@/components/admin/admin-course-form";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { listActiveAdminCategories } from "@/lib/admin/categories";

export const metadata: Metadata = { title: "دوره جدید" };
export default async function NewCoursePage() { await requireAdminPagePermission("courses.write"); const categories = await listActiveAdminCategories(); return <div className="admin-page-stack"><AdminPageHeader eyebrow="Course" title="ایجاد دوره" action={<AdminButton href="/courses" variant="secondary">بازگشت</AdminButton>} /><section className="admin-panel-card"><AdminCourseForm action="/api/admin/courses" categories={categories} successRedirect="/courses" /></section></div>; }
