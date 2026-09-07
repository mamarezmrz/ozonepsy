import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminButton, AdminDataTable, AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminDatePicker } from "@/components/admin/admin-date-picker";
import { AdminMutationForm } from "@/components/admin/admin-mutation-form";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { getAdminUserDetail } from "@/lib/admin/users";
import { AppointmentStatus, ProductKind, UserStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "جزئیات کاربر" };
const appointmentStatusLabel: Record<AppointmentStatus, string> = { SCHEDULED: "برنامه‌ریزی‌شده", COMPLETED: "برگزارشده", CANCELED: "لغوشده", NO_SHOW: "عدم حضور", RESCHEDULED: "تغییر زمان" };
function appointmentStatusTone(status: AppointmentStatus) { return status === AppointmentStatus.COMPLETED ? "success" : status === AppointmentStatus.CANCELED || status === AppointmentStatus.NO_SHOW ? "danger" : status === AppointmentStatus.RESCHEDULED ? "warning" : "info"; }

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPagePermission("users.read");
  const { id } = await params;
  let user;
  try {
    user = await getAdminUserDetail(id);
  } catch { notFound(); }
  const statusLabel = user.status === UserStatus.ACTIVE ? "فعال" : user.status === UserStatus.SUSPENDED ? "تعلیق‌شده" : "بایگانی";
  const sessionEntitlements = user.entitlements.filter((entitlement) => entitlement.product.kind === ProductKind.CONSULTATION || entitlement.product.kind === ProductKind.PACKAGE);
  const canManageSessions = session.permissions.includes("sessions.manage");

  return <div className="admin-page-stack">
    <AdminPageHeader eyebrow="جزئیات کاربر عمومی" title={user.name} description={user.email} action={<AdminButton href="/users" variant="secondary">بازگشت به کاربران</AdminButton>} />
    <section className="admin-detail-grid admin-user-account-grid">
      <article className="admin-panel-card"><h3>اطلاعات حساب</h3><dl className="admin-detail-list"><div><dt>ایمیل</dt><dd dir="ltr">{user.email}</dd></div><div><dt>وضعیت</dt><dd><AdminStatusBadge tone={user.status === UserStatus.ACTIVE ? "success" : user.status === UserStatus.SUSPENDED ? "warning" : "neutral"}>{statusLabel}</AdminStatusBadge></dd></div><div><dt>کشور</dt><dd>{user.profile?.country || "—"}</dd></div><div><dt>شماره تلفن</dt><dd dir="ltr">{user.profile?.phone || "—"}</dd></div><div><dt>تاریخ ثبت‌نام</dt><dd>{user.createdAt.toLocaleString("fa-IR")}</dd></div><div><dt>نقش عمومی</dt><dd>کاربر</dd></div></dl>{session.permissions.includes("users.suspend") ? <AdminUserActions userId={user.id} status={user.status} /> : null}</article>
    </section>

    {canManageSessions && sessionEntitlements.length ? <section className="admin-panel-card admin-user-session-management"><div><h3>مدیریت جلسات فردی</h3><p className="admin-muted-copy">تعداد جلسات و زمان هر جلسه از این بخش مدیریت می‌شود. جلسات انجام‌شده یا زمان‌بندی‌شده قابل حذف از اعتبار نیستند.</p></div>
      <div className="admin-user-session-list">{sessionEntitlements.map((entitlement) => <article className="admin-user-session-card" key={entitlement.id}>
        <header><div><h4>{entitlement.product.title}</h4><p>مصرف‌شده: {entitlement.completedCount} · زمان‌بندی‌شده: {entitlement.reservedCount} · وضعیت: {entitlement.status}</p></div><span className="admin-user-session-credit">{entitlement.totalSessions ?? "—"} جلسه</span></header>
        <div className="admin-user-session-forms">
          <AdminMutationForm action={`/api/admin/entitlements/${entitlement.id}`} method="PATCH" submitLabel="ذخیره تعداد" className="admin-user-session-form" notification successMessage="تعداد جلسات با موفقیت ذخیره شد.">
            <label className="admin-form-field"><span>تعداد کل جلسات</span><input type="number" name="totalSessions" min="0" defaultValue={entitlement.totalSessions ?? 0} required /></label>
            <label className="admin-form-field"><span>دلیل تغییر</span><textarea name="reason" rows={3} required placeholder="مثلاً اصلاح تعداد جلسات خریداری‌شده" /></label>
          </AdminMutationForm>
          <AdminMutationForm action={`/api/admin/entitlements/${entitlement.id}/appointments`} method="POST" submitLabel="برنامه‌ریزی جلسه" className="admin-user-session-form" notification successMessage="جلسه با موفقیت زمان‌بندی شد.">
            <div className="admin-user-session-form-grid"><label className="admin-form-field"><span>زمان شروع</span><AdminDatePicker name="startsAt" ariaLabel="زمان شروع جلسه" includeTime required /></label><label className="admin-form-field"><span>زمان پایان (اختیاری)</span><AdminDatePicker name="endsAt" ariaLabel="زمان پایان جلسه" includeTime /></label></div>
            <label className="admin-form-field"><span>لینک جلسه (اختیاری)</span><input type="url" name="meetingUrl" placeholder="https://…" inputMode="url" dir="ltr" /></label>
            <label className="admin-form-field"><span>یادداشت (اختیاری)</span><textarea name="reason" rows={3} placeholder="یادداشت داخلی برای زمان‌بندی جلسه" /></label>
          </AdminMutationForm>
        </div>
      </article>)}</div>
    </section> : null}

    {user.appointments.length ? <section className="admin-panel-card"><h3>جلسات اخیر</h3><AdminDataTable rows={user.appointments} getRowKey={(row) => row.id} columns={[{ key: "product", label: "جلسه", render: (row) => <span>{row.product.title}</span> }, { key: "specialist", label: "متخصص", render: (row) => <span>{row.specialist?.displayName || "—"}</span> }, { key: "meetingUrl", label: "لینک جلسه", render: (row) => row.meetingUrl ? <a href={row.meetingUrl} target="_blank" rel="noopener noreferrer" className="admin-table-link">مشاهده</a> : <span>—</span> }, { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={appointmentStatusTone(row.status)}>{appointmentStatusLabel[row.status]}</AdminStatusBadge> }, { key: "date", label: "زمان", render: (row) => <span>{row.startsAt.toLocaleString("fa-IR-u-ca-gregory", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span> }]} /></section> : null}
  </div>;
}
