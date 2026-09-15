import type { Metadata } from "next";
import { AdminButton, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminCourseCreateForm } from "@/components/admin/admin-course-create-form";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { listAdminCourseTags } from "@/lib/admin/courses";

export const metadata: Metadata = { title: "دوره جدید" };
export default async function NewCoursePage() { await requireAdminPagePermission("courses.write"); const existingTags = await listAdminCourseTags(); return <div className="admin-page-stack admin-course-create-page"><AdminPageHeader eyebrow="Course" title="ایجاد دوره" action={<AdminButton href="/admin/courses" variant="secondary">بازگشت</AdminButton>} /><section className="admin-panel-card admin-course-create-card"><AdminCourseCreateForm existingTags={existingTags} /></section></div>; }
