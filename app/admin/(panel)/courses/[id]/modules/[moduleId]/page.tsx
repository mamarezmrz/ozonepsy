import type { Metadata } from "next";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminButton, AdminField, AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminMutationForm } from "@/components/admin/admin-mutation-form";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { getAdminCourse } from "@/lib/admin/courses";

export const metadata: Metadata = { title: "جزئیات ماژول" };

export default async function ModuleDetailPage({ params }: { params: Promise<{ id: string; moduleId: string }> }) {
  const session = await requireAdminPagePermission("lessons.write");
  const { id, moduleId } = await params;
  const course = await getAdminCourse(id, session);
  const courseModule = course.course.modules.find((item) => item.id === moduleId);

  if (!courseModule) {
    return <div className="admin-page-stack"><AdminPageHeader title="ماژول پیدا نشد" action={<AdminButton href={`/courses/${id}/modules`} variant="secondary">بازگشت</AdminButton>} /></div>;
  }

  const statusAction = courseModule.status === "PUBLISHED"
    ? { status: "DRAFT", label: "لغو انتشار", variant: "secondary" as const }
    : courseModule.status === "ARCHIVED"
      ? { status: "DRAFT", label: "بازگردانی", variant: "secondary" as const }
      : { status: "PUBLISHED", label: "انتشار", variant: "primary" as const };

  return (
    <div className="admin-page-stack">
      <AdminPageHeader eyebrow="Module" title={courseModule.title} action={<AdminButton href={`/courses/${id}/modules`} variant="secondary">بازگشت به ساختار</AdminButton>} />
      <section className="admin-panel-card">
        <div className="admin-section-heading">
          <h3>ویرایش ماژول</h3>
          <AdminStatusBadge tone={courseModule.status === "PUBLISHED" ? "success" : courseModule.status === "ARCHIVED" ? "neutral" : "warning"}>{courseModule.status}</AdminStatusBadge>
        </div>
        <AdminMutationForm action={`/api/admin/courses/modules/${courseModule.id}`} method="PATCH">
          <AdminField label="عنوان" name="title" defaultValue={courseModule.title} required />
          <label className="admin-form-field"><span>توضیحات</span><textarea name="description" defaultValue={courseModule.description ?? ""} /></label>
        </AdminMutationForm>
        <div className="admin-form-actions">
          <AdminActionButton action={`/api/admin/courses/modules/${courseModule.id}`} method="PATCH" body={{ status: statusAction.status }} reasonRequired label={statusAction.label} variant={statusAction.variant} confirm="وضعیت ماژول تغییر کند؟" />
          {courseModule.status !== "ARCHIVED" ? <AdminActionButton action={`/api/admin/courses/modules/${courseModule.id}`} method="PATCH" body={{ status: "ARCHIVED" }} reasonRequired label="بایگانی" variant="danger" confirm="این ماژول بایگانی شود؟" /> : null}
        </div>
      </section>
      <section className="admin-panel-card">
        <h3>افزودن درس</h3>
        <AdminMutationForm action={`/api/admin/courses/modules/${courseModule.id}/lessons`}>
          <AdminField label="عنوان درس" name="title" required />
          <label className="admin-form-field"><span>توضیحات</span><textarea name="description" /></label>
          <AdminField label="مدت به دقیقه" name="duration" type="number" />
          <label className="admin-form-field"><span><input name="isPreview" type="checkbox" value="true" /> پیش‌نمایش رایگان</span></label>
        </AdminMutationForm>
      </section>
      <section className="admin-panel-card">
        <h3>درس‌ها</h3>
        {courseModule.lessons.length
          ? <ul className="admin-plain-list">{courseModule.lessons.map((lesson) => <li key={lesson.id}><span>{(lesson.order + 1).toLocaleString("fa-IR")} — {lesson.title}</span><AdminButton href={`/courses/${id}/modules/${courseModule.id}/lessons/${lesson.id}`} variant="secondary">ویرایش</AdminButton></li>)}</ul>
          : <p className="admin-table-empty">درسی ثبت نشده است.</p>}
      </section>
    </div>
  );
}
