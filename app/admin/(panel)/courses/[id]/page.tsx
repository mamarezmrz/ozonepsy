import type { Metadata } from "next";
import { AdminButton, AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminCourseCreateForm, type AdminCourseFormValues } from "@/components/admin/admin-course-create-form";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { getAdminCourse } from "@/lib/admin/courses";
import { listActiveAdminCategories } from "@/lib/admin/categories";
import { ProductStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "جزئیات دوره" };

function asCurriculum(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function statusLabel(status: ProductStatus) {
  return status === ProductStatus.PUBLISHED ? "منتشرشده" : status === ProductStatus.ARCHIVED ? "مخفی‌شده" : "پیش‌نویس";
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPagePermission("courses.read");
  const { id } = await params;
  const [course, categories] = await Promise.all([getAdminCourse(id, session), listActiveAdminCategories()]);
  const canWrite = session.permissions.includes("courses.write");
  const canPublish = session.permissions.includes("courses.publish");
  const curriculum = asCurriculum(course.course.curriculum);
  const curriculumCategorySlugs = stringArray(curriculum.categorySlugs);
  const formValues: AdminCourseFormValues = {
    title: course.title,
    slug: course.slug,
    description: course.description,
    priceMinor: course.priceMinor,
    currency: course.currency,
    categoryId: course.categoryId,
    categorySlugs: curriculumCategorySlugs.length ? curriculumCategorySlugs : course.category?.slug ? [course.category.slug] : [],
    coverMediaId: course.coverMediaId,
    instructorName: typeof curriculum.instructorName === "string" ? curriculum.instructorName : "",
    durationSessions: typeof curriculum.durationSessions === "number" ? curriculum.durationSessions : null,
    demoMediaId: typeof curriculum.demoMediaId === "string" ? curriculum.demoMediaId : null,
    demoVideoDuration: typeof curriculum.demoVideoDuration === "number" ? curriculum.demoVideoDuration : null,
    sessions: course.course.modules.flatMap((courseModule) => courseModule.lessons)
      .sort((left, right) => left.order - right.order)
      .map((lesson) => ({ title: lesson.title, videoMediaId: lesson.mediaId, videoDuration: lesson.duration, videoName: lesson.media?.originalName })),
  };
  const currentStatusLabel = statusLabel(course.status);
  const statusAction = course.status === ProductStatus.PUBLISHED
    ? { status: ProductStatus.ARCHIVED, label: "مخفی کردن", variant: "danger" as const, confirm: "این دوره از سایت مخفی شود؟" }
    : course.status === ProductStatus.ARCHIVED
      ? { status: ProductStatus.DRAFT, label: "نمایش دوباره", variant: "secondary" as const, confirm: "این دوره دوباره به حالت پیش‌نویس برگردد؟" }
      : { status: ProductStatus.PUBLISHED, label: "انتشار دوره", variant: "primary" as const, confirm: "این دوره در سایت منتشر شود؟" };

  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        eyebrow="Course / CourseProduct"
        title={course.title}
        description={`وضعیت فعلی: ${currentStatusLabel}`}
        action={<AdminButton href="/admin/courses" variant="secondary">بازگشت به دوره‌ها</AdminButton>}
      />

      <section className="admin-panel-card admin-course-create-card">
        <div className="admin-section-heading">
          <h3>ویرایش دوره</h3>
          <AdminStatusBadge tone={course.status === ProductStatus.PUBLISHED ? "success" : course.status === ProductStatus.DRAFT ? "warning" : "neutral"}>{currentStatusLabel}</AdminStatusBadge>
        </div>
        {canWrite ? <AdminCourseCreateForm categories={categories} values={formValues} courseId={course.id} /> : (
          <dl className="admin-detail-list">
            <div><dt>Slug</dt><dd dir="ltr">{course.slug}</dd></div>
            <div><dt>توضیحات</dt><dd className="admin-course-description">{course.description}</dd></div>
            <div><dt>دسته‌بندی</dt><dd>{course.category?.title || "—"}</dd></div>
            <div><dt>قیمت</dt><dd dir="ltr">{(course.priceMinor / 100).toLocaleString("fa-IR")} {course.currency}</dd></div>
          </dl>
        )}
        {canPublish || canWrite ? (
          <div className="admin-form-actions">
            {canWrite ? <AdminActionButton action={`/api/admin/courses/${course.id}/duplicate`} label="ساخت نسخه پیش‌نویس" confirm="از این دوره یک نسخه پیش‌نویس ساخته شود؟" successMessage="نسخه پیش‌نویس ساخته شد." /> : null}
            {canPublish ? statusAction.status === ProductStatus.PUBLISHED ? <AdminActionButton action={`/api/admin/courses/${course.id}/status`} method="PATCH" body={{ status: statusAction.status, reason: "انتشار دوره" }} label={statusAction.label} variant={statusAction.variant} successMessage="دوره منتشر شد و در سایت نمایش داده می‌شود." /> : <AdminActionButton action={`/api/admin/courses/${course.id}/status`} method="PATCH" body={{ status: statusAction.status }} reasonRequired label={statusAction.label} variant={statusAction.variant} confirm={statusAction.confirm} successMessage={`وضعیت دوره به «${statusAction.label}» تغییر کرد.`} /> : null}
            {canWrite ? <AdminActionButton action={`/api/admin/courses/${course.id}`} method="DELETE" label="حذف دوره" variant="danger" confirm="این دوره برای همیشه حذف شود؟ اگر سابقه خرید یا ثبت‌نام داشته باشد حذف انجام نمی‌شود." successMessage="دوره حذف شد." /> : null}
          </div>
        ) : null}
      </section>

    </div>
  );
}
