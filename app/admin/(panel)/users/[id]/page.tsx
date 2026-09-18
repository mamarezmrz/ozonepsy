import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminButton, AdminDataTable, AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminDatePicker } from "@/components/admin/admin-date-picker";
import { AdminMutationForm } from "@/components/admin/admin-mutation-form";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminCountrySelect, AdminLatinPasswordInput } from "@/components/admin/admin-user-fields";
import { AdminSelect } from "@/components/admin/admin-select";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { getAdminUserDetail } from "@/lib/admin/users";
import { AdminServiceError } from "@/lib/admin/errors";
import { listAdminSessionProducts } from "@/lib/admin/appointments";
import { listAdminSpecialistOptions } from "@/lib/admin/specialists";
import { AdminDetailsButton } from "@/components/admin/admin-details-button";
import { AppointmentStatus, EntitlementStatus, ProductKind, UserStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "جزئیات کاربر" };
const appointmentStatusLabel: Record<AppointmentStatus, string> = { SCHEDULED: "برنامه‌ریزی‌شده", COMPLETED: "برگزارشده", CANCELED: "لغوشده", NO_SHOW: "عدم حضور", RESCHEDULED: "تغییر زمان" };
function appointmentStatusTone(status: AppointmentStatus) { return status === AppointmentStatus.COMPLETED ? "success" : status === AppointmentStatus.CANCELED || status === AppointmentStatus.NO_SHOW ? "danger" : status === AppointmentStatus.RESCHEDULED ? "warning" : "info"; }

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPagePermission("users.read");
  const { id } = await params;
  let user;
  try {
    user = await getAdminUserDetail(id);
  } catch (error) {
    if (error instanceof AdminServiceError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const statusLabel = user.status === UserStatus.ACTIVE ? "فعال" : "تعلیق‌شده";
  const sessionEntitlements = user.entitlements.filter((entitlement) => entitlement.status !== EntitlementStatus.REVOKED && (entitlement.product.kind === ProductKind.CONSULTATION || entitlement.product.kind === ProductKind.PACKAGE));
  const canManageSessions = session.permissions.includes("sessions.manage");
  const canUpdateUser = session.permissions.includes("users.update");
  const sessionProducts = canManageSessions ? await listAdminSessionProducts() : [];
  const specialistOptions = canManageSessions ? await listAdminSpecialistOptions() : [];

  return <div className="admin-page-stack">
    <AdminPageHeader eyebrow="جزئیات کاربر عمومی" title={user.name} description={user.email} action={<AdminButton href="/admin/users" variant="secondary">بازگشت به کاربران</AdminButton>} />
    <section className="admin-detail-grid admin-user-account-grid">
      <article className="admin-panel-card"><h3>اطلاعات حساب</h3><dl className="admin-detail-list"><div><dt>ایمیل</dt><dd dir="ltr">{user.email}</dd></div><div><dt>وضعیت</dt><dd><AdminStatusBadge tone={user.status === UserStatus.ACTIVE ? "success" : "warning"}>{statusLabel}</AdminStatusBadge></dd></div><div><dt>کشور</dt><dd>{user.profile?.country || "—"}</dd></div><div><dt>شماره تلفن</dt><dd dir="ltr">{user.profile?.phone || "—"}</dd></div><div><dt>تاریخ ثبت‌نام</dt><dd>{user.createdAt.toLocaleString("fa-IR")}</dd></div><div><dt>نقش عمومی</dt><dd>کاربر</dd></div></dl>{session.permissions.includes("users.suspend") ? <AdminUserActions userId={user.id} status={user.status} /> : null}
        {canUpdateUser ? <div className="admin-user-edit-stack">
          <section><h4>ویرایش اطلاعات</h4><AdminMutationForm action={`/api/admin/users/${user.id}`} method="PATCH" submitLabel="ذخیره اطلاعات" className="admin-form-stack" notification successMessage="اطلاعات کاربر ذخیره شد.">
            <div className="admin-course-form-grid">
              <label className="admin-form-field"><span>نام و نام خانوادگی</span><input name="fullName" defaultValue={[user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ")} autoComplete="name" required /></label>
              <label className="admin-form-field"><span>ایمیل</span><input name="email" type="email" defaultValue={user.email} dir="ltr" required /></label>
              <label className="admin-form-field"><span>شماره تلفن</span><input name="phone" defaultValue={user.profile?.phone ?? ""} dir="ltr" /></label>
              <label className="admin-form-field"><span>کشور</span><AdminCountrySelect name="country" defaultValue={user.profile?.country ?? ""} /></label>
            </div>
          </AdminMutationForm></section>
          <section><h4>تغییر رمز عبور</h4><p className="admin-muted-copy">پس از تغییر رمز، همهٔ نشست‌های قبلی کاربر بسته می‌شوند.</p><AdminMutationForm action={`/api/admin/users/${user.id}/password`} method="POST" submitLabel="تغییر رمز" className="admin-form-stack" notification successMessage="رمز تغییر کرد و نشست‌های قبلی بسته شدند.">
            <div className="admin-course-form-grid"><label className="admin-form-field"><span>رمز جدید (حداقل ۱۲ کاراکتر)</span><AdminLatinPasswordInput name="password" required /></label><label className="admin-form-field"><span>تایید رمز جدید</span><AdminLatinPasswordInput name="confirmPassword" required /></label></div><label className="admin-form-field"><span>دلیل تغییر رمز</span><input name="reason" required maxLength={1000} /></label>
          </AdminMutationForm></section>
        </div> : null}
      </article>
    </section>

    {canManageSessions && sessionEntitlements.length ? <section className="admin-panel-card admin-user-session-management"><div><h3>مدیریت جلسات فردی</h3><p className="admin-muted-copy">تعداد جلسات و زمان هر جلسه از این بخش مدیریت می‌شود. جلسات انجام‌شده یا زمان‌بندی‌شده قابل حذف از اعتبار نیستند.</p></div>
      <div className="admin-user-session-list">{sessionEntitlements.map((entitlement) => <article className="admin-user-session-card" key={entitlement.id}>
        <header><div><h4>{entitlement.product.title}</h4></div><span className="admin-user-session-credit">{entitlement.totalSessions ?? "—"} جلسه</span></header>
        <div className="admin-user-session-forms">
          <AdminMutationForm action={`/api/admin/entitlements/${entitlement.id}`} method="PATCH" submitLabel="ذخیره تعداد" className="admin-user-session-form" notification successMessage="تعداد جلسات با موفقیت ذخیره شد.">
            <label className="admin-form-field"><span>تعداد کل جلسات</span><input type="number" name="totalSessions" min="0" defaultValue={entitlement.totalSessions ?? 0} required /></label>
            <label className="admin-form-field"><span>دلیل تغییر</span><textarea name="reason" rows={3} required placeholder="مثلاً اصلاح تعداد جلسات خریداری‌شده" /></label>
          </AdminMutationForm>
          <AdminMutationForm action={`/api/admin/entitlements/${entitlement.id}/appointments`} method="POST" submitLabel="برنامه‌ریزی جلسه" className="admin-user-session-form" notification successMessage="جلسه با موفقیت زمان‌بندی شد.">
            <div className="admin-user-session-form-grid"><label className="admin-form-field"><span>زمان شروع</span><AdminDatePicker name="startsAt" ariaLabel="زمان شروع جلسه" includeTime required /></label><label className="admin-form-field"><span>زمان پایان (اختیاری)</span><AdminDatePicker name="endsAt" ariaLabel="زمان پایان جلسه" includeTime /></label></div>
            <label className="admin-form-field"><span>لینک جلسه (اختیاری)</span><input type="url" name="meetingUrl" placeholder="https://…" inputMode="url" dir="ltr" /></label>
            <label className="admin-form-field"><span>نام متخصص</span><AdminSelect name="specialistId" defaultValue="" ariaLabel="نام متخصص" options={[{ value: "", label: "بدون متخصص" }, ...specialistOptions.map((specialist) => ({ value: specialist.id, label: specialist.displayName }))]} /></label>
            <label className="admin-form-field"><span>یادداشت (اختیاری)</span><textarea name="reason" rows={3} placeholder="یادداشت داخلی برای زمان‌بندی جلسه" /></label>
          </AdminMutationForm>
        </div>
        <div className="admin-user-entitlement-action"><AdminActionButton action={`/api/admin/entitlements/${entitlement.id}`} method="DELETE" label="حذف بسته" variant="danger" confirm="دسترسی این بسته از حساب کاربر برداشته می‌شود؛ سابقهٔ خرید حفظ خواهد شد. ادامه می‌دهید؟" successMessage="دسترسی بسته از حساب کاربر برداشته شد." /></div>
      </article>)}</div>
    </section> : null}

    {canManageSessions ? <section className="admin-panel-card admin-user-session-management"><div><h3>زمان‌بندی جلسه</h3><p className="admin-muted-copy">می‌توانید برای این کاربر حتی بدون سابقهٔ خرید، جلسه ثبت کنید.</p></div>
      {sessionProducts.length ? <AdminMutationForm action={`/api/admin/users/${user.id}/appointments`} method="POST" submitLabel="ثبت جلسه" className="admin-form-stack" notification successMessage="جلسه برای کاربر ثبت شد.">
        <label className="admin-form-field"><span>نوع جلسه</span><AdminSelect name="productId" defaultValue={sessionProducts[0].id} ariaLabel="نوع جلسه" options={sessionProducts.map((product) => ({ value: product.id, label: product.title }))} /></label>
        <div className="admin-user-session-form-grid"><label className="admin-form-field"><span>زمان شروع</span><AdminDatePicker name="startsAt" ariaLabel="زمان شروع جلسه" includeTime required /></label><label className="admin-form-field"><span>زمان پایان (اختیاری)</span><AdminDatePicker name="endsAt" ariaLabel="زمان پایان جلسه" includeTime /></label></div>
        <label className="admin-form-field"><span>لینک جلسه (اختیاری)</span><input type="url" name="meetingUrl" placeholder="https://…" inputMode="url" dir="ltr" /></label>
        <label className="admin-form-field"><span>نام متخصص</span><AdminSelect name="specialistId" defaultValue="" ariaLabel="نام متخصص" options={[{ value: "", label: "بدون متخصص" }, ...specialistOptions.map((specialist) => ({ value: specialist.id, label: specialist.displayName }))]} /></label>
        <label className="admin-form-field"><span>یادداشت (اختیاری)</span><textarea name="reason" rows={3} placeholder="یادداشت داخلی برای زمان‌بندی جلسه" /></label>
      </AdminMutationForm> : <p className="admin-muted-copy">برای ثبت جلسه، ابتدا یک محصول مشاورهٔ منتشرشده در پنل ایجاد کنید.</p>}
    </section> : null}

    {user.appointments.length ? <section className="admin-panel-card"><h3>جلسات اخیر</h3><AdminDataTable rows={user.appointments} getRowKey={(row) => row.id} columns={[{ key: "product", label: "جلسه", render: (row) => <span>{row.product.title}</span> }, { key: "specialist", label: "متخصص", render: (row) => <span>{row.specialist?.displayName || "—"}</span> }, { key: "notes", label: "توضیحات", render: (row) => <AdminDetailsButton title={`توضیحات ${row.product.title}`} description={row.notes} /> }, { key: "meetingUrl", label: "لینک جلسه", render: (row) => row.meetingUrl ? <a href={row.meetingUrl} target="_blank" rel="noopener noreferrer" className="admin-table-link">مشاهده</a> : <span>—</span> }, { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={appointmentStatusTone(row.status)}>{appointmentStatusLabel[row.status]}</AdminStatusBadge> }, { key: "date", label: "زمان", render: (row) => <span>{row.startsAt.toLocaleString("fa-IR-u-ca-gregory", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span> }]} /></section> : null}
  </div>;
}
