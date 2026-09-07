import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminDatePicker } from "@/components/admin/admin-date-picker";
import { AdminMutationForm } from "@/components/admin/admin-mutation-form";
import { AdminButton, AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { getAdminAppointment } from "@/lib/admin/appointments";
import { AppointmentStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "جزئیات جلسه" };
const statusLabel: Record<AppointmentStatus, string> = { SCHEDULED: "برنامه‌ریزی‌شده", COMPLETED: "برگزارشده", CANCELED: "لغوشده", NO_SHOW: "عدم حضور", RESCHEDULED: "تغییر زمان" };
function dateInputValue(date: Date | null) { return date ? new Date(date).toISOString().slice(0, 16) : ""; }

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPagePermission("sessions.read"); const { id } = await params; let appointment; try { appointment = await getAdminAppointment(id, session); } catch { notFound(); } const canManage = session.permissions.includes("sessions.manage"); const finalStatus = appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.CANCELED;
  return <div className="admin-page-stack"><AdminPageHeader eyebrow="Appointment" title={appointment.product.title} description={appointment.user.profile?.displayName || appointment.user.email} action={<AdminButton href="/sessions" variant="secondary">بازگشت به جلسات</AdminButton>} />
    <section className="admin-detail-grid"><article className="admin-panel-card"><h3>اطلاعات جلسه</h3><dl className="admin-detail-list"><div><dt>کاربر</dt><dd>{appointment.user.profile?.displayName || appointment.user.email}</dd></div><div><dt>ایمیل</dt><dd dir="ltr">{appointment.user.email}</dd></div><div><dt>متخصص</dt><dd>{appointment.specialist?.displayName || "—"}</dd></div><div><dt>زمان</dt><dd>{appointment.startsAt.toLocaleString("fa-IR-u-ca-gregory", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</dd></div><div><dt>لینک جلسه</dt><dd>{appointment.meetingUrl ? <a href={appointment.meetingUrl} target="_blank" rel="noopener noreferrer" className="admin-table-link">مشاهده لینک</a> : "—"}</dd></div><div><dt>وضعیت</dt><dd><AdminStatusBadge tone={appointment.status === AppointmentStatus.COMPLETED ? "success" : appointment.status === AppointmentStatus.CANCELED ? "danger" : "info"}>{statusLabel[appointment.status]}</AdminStatusBadge></dd></div></dl>{canManage && !finalStatus ? <div className="admin-form-actions"><AdminActionButton action={`/api/admin/sessions/${id}/status`} method="PATCH" body={{ status: "COMPLETED" }} reasonRequired label="ثبت انجام جلسه" variant="primary" confirm="این جلسه به‌عنوان انجام‌شده ثبت شود؟" /><AdminActionButton action={`/api/admin/sessions/${id}/status`} method="PATCH" body={{ status: "CANCELED" }} reasonRequired label="لغو جلسه" variant="danger" confirm="این جلسه لغو شود؟" /></div> : null}</article>
      {canManage && !finalStatus ? <article className="admin-panel-card"><h3>تغییر زمان جلسه</h3><AdminMutationForm action={`/api/admin/sessions/${id}/reschedule`} method="PATCH" submitLabel="ذخیره زمان جدید"><label className="admin-form-field"><span>زمان شروع</span><AdminDatePicker name="startsAt" defaultValue={dateInputValue(appointment.startsAt)} ariaLabel="زمان شروع" includeTime required /></label><label className="admin-form-field"><span>زمان پایان (اختیاری)</span><AdminDatePicker name="endsAt" defaultValue={dateInputValue(appointment.endsAt)} ariaLabel="زمان پایان" includeTime /></label><label className="admin-form-field"><span>دلیل</span><textarea name="reason" rows={4} required /></label></AdminMutationForm></article> : null}</section>
  </div>;
}
