import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminButton, AdminDataTable, AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminSpecialistForm } from "@/components/admin/admin-specialist-form";
import { AdminSpecialistCoursesForm } from "@/components/admin/admin-specialist-courses-form";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { getAdminSpecialist } from "@/lib/admin/specialists";
import { listAdminCourseOptions } from "@/lib/admin/courses";
import { SpecialistStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "جزئیات متخصص" };
export default async function SpecialistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPagePermission("instructors.read");
  const { id } = await params;
  let specialist;
  try { specialist = await getAdminSpecialist(id, session); } catch { notFound(); }
  const canWrite = session.permissions.includes("instructors.write");
  const courseOptions = canWrite ? await listAdminCourseOptions() : [];
  return <div className="admin-page-stack"><AdminPageHeader eyebrow="Specialist" title={specialist.displayName} description={specialist.specialty || specialist.slug} action={<AdminButton href="/specialists" variant="secondary">بازگشت</AdminButton>} />
    <section className="admin-panel-card"><div className="admin-section-heading"><h3>اطلاعات متخصص</h3><AdminStatusBadge tone={specialist.status === SpecialistStatus.ACTIVE ? "success" : "neutral"}>{specialist.status === SpecialistStatus.ACTIVE ? "فعال" : "غیرفعال"}</AdminStatusBadge></div>{canWrite ? <AdminSpecialistForm action={`/api/admin/specialists/${id}`} method="PATCH" values={specialist} /> : <dl className="admin-detail-list"><div><dt>Slug</dt><dd dir="ltr">{specialist.slug}</dd></div><div><dt>تخصص</dt><dd>{specialist.specialty || "—"}</dd></div><div><dt>معرفی</dt><dd>{specialist.bio || "—"}</dd></div></dl>}{canWrite ? <div className="admin-form-actions"><AdminActionButton action={`/api/admin/specialists/${id}/status`} method="PATCH" body={{ status: specialist.status === SpecialistStatus.ACTIVE ? "INACTIVE" : "ACTIVE" }} reasonRequired label={specialist.status === SpecialistStatus.ACTIVE ? "غیرفعال‌سازی" : "فعال‌سازی"} variant={specialist.status === SpecialistStatus.ACTIVE ? "danger" : "primary"} confirm="وضعیت این متخصص تغییر کند؟" /></div> : null}</section>
    <section className="admin-panel-card"><div className="admin-section-heading"><h3>دوره‌های تخصیص‌یافته</h3></div>{canWrite ? <AdminSpecialistCoursesForm specialistId={specialist.id} options={courseOptions} selectedIds={specialist.courseAssignments.map((assignment) => assignment.courseProductId)} /> : specialist.courseAssignments.length ? <AdminDataTable rows={specialist.courseAssignments} getRowKey={(row) => row.courseProductId} columns={[{ key: "title", label: "دوره", render: (row) => <span>{row.courseProduct.product.title}</span> }, { key: "slug", label: "Slug", render: (row) => <span dir="ltr">{row.courseProduct.product.slug}</span> }, { key: "status", label: "وضعیت", render: (row) => <span>{row.courseProduct.product.status}</span> }]} /> : <p className="admin-table-empty">دوره‌ای تخصیص داده نشده است.</p>}</section>
  </div>;
}
