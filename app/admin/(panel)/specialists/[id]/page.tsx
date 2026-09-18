import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminButton, AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminSpecialistForm } from "@/components/admin/admin-specialist-form";
import { AdminMutationForm } from "@/components/admin/admin-mutation-form";
import { AdminLatinPasswordInput } from "@/components/admin/admin-user-fields";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { getAdminSpecialist } from "@/lib/admin/specialists";
import { AdminServiceError } from "@/lib/admin/errors";
import { SpecialistStatus, UserStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "ویرایش متخصص" };

export default async function EditSpecialistPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPagePermission("instructors.read");
  const { id } = await params;
  let specialist;
  try {
    specialist = await getAdminSpecialist(id, session);
  } catch (error) {
    if (error instanceof AdminServiceError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const canWrite = session.permissions.includes("instructors.write");
  return <div className="admin-page-stack">
    <AdminPageHeader eyebrow="مدیریت متخصص ها / ویرایش صفحه عمومی" title={specialist.displayName} description="اطلاعات متخصص و محتوای صفحه عمومی او را ویرایش کنید؛ پیش‌نمایش زنده در کنار فرم نمایش داده می‌شود." action={<AdminButton href="/admin/specialists" variant="secondary">بازگشت</AdminButton>} />
    <section className="admin-panel-card">
      <div className="admin-section-heading"><h2>اطلاعات متخصص</h2><AdminStatusBadge tone={specialist.status === SpecialistStatus.ACTIVE ? "success" : "neutral"}>{specialist.status === SpecialistStatus.ACTIVE ? "فعال" : "غیرفعال"}</AdminStatusBadge></div>
      {canWrite ? <AdminSpecialistForm action={`/api/admin/specialists/${id}`} method="PATCH" livePreview successRedirect="/admin/specialists" values={{ ...specialist, email: specialist.user?.email ?? specialist.email, hasAccount: Boolean(specialist.userId), accountActive: specialist.user ? specialist.user.status === UserStatus.ACTIVE && specialist.status === SpecialistStatus.ACTIVE : specialist.status === SpecialistStatus.ACTIVE }} /> : <dl className="admin-detail-list"><div><dt>نام و نام خانوادگی</dt><dd>{specialist.displayName}</dd></div><div><dt>تخصص</dt><dd>{specialist.specialty || "—"}</dd></div><div><dt>شماره تماس</dt><dd dir="ltr">{specialist.phone || "—"}</dd></div><div><dt>کشور</dt><dd>{specialist.country || "—"}</dd></div><div><dt>ایمیل ورود</dt><dd dir="ltr">{specialist.user?.email ?? specialist.email ?? "—"}</dd></div></dl>}
    </section>
    {canWrite && specialist.userId ? <section className="admin-panel-card"><h2>تغییر رمز متخصص</h2><p className="admin-muted-copy">رمز جدید به‌صورت موقت تنظیم می‌شود و متخصص در ورود بعدی باید آن را تغییر دهد.</p><AdminMutationForm action={`/api/admin/specialists/${id}/password`} method="POST" submitLabel="تنظیم رمز جدید" notification successMessage="رمز متخصص تنظیم شد و نشست‌های قبلی بسته شدند.">
      <div className="admin-course-form-grid"><label className="admin-form-field"><span>رمز موقت جدید</span><AdminLatinPasswordInput name="password" minLength={12} required /></label><label className="admin-form-field"><span>تکرار رمز موقت</span><AdminLatinPasswordInput name="confirmPassword" minLength={12} required /></label></div>
      <label className="admin-form-field"><span>دلیل تغییر رمز</span><input name="reason" maxLength={1000} required /></label>
    </AdminMutationForm></section> : null}
  </div>;
}
