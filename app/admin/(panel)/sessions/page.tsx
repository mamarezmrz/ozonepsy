import type { Metadata } from "next";
import Link from "next/link";
import { AdminAppointmentStatusMenu } from "@/components/admin/admin-appointment-status-menu";
import { AdminSelect } from "@/components/admin/admin-select";
import { AdminDataTable, AdminEmptyState, AdminListToolbar, AdminPageHeader, AdminPagination, AdminSearchInput, AdminStatusBadge } from "@/components/admin/admin-ui";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { listAdminAppointments } from "@/lib/admin/appointments";
import { parseAdminListQuery } from "@/lib/admin/query";
import { AppointmentStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "جلسات" };
const statusLabel: Record<AppointmentStatus, string> = { SCHEDULED: "برنامه‌ریزی‌شده", COMPLETED: "برگزارشده", CANCELED: "لغوشده", NO_SHOW: "عدم حضور", RESCHEDULED: "تغییر زمان" };
function statusTone(status: AppointmentStatus): "success" | "danger" | "warning" | "info" { return status === AppointmentStatus.COMPLETED ? "success" : status === AppointmentStatus.CANCELED || status === AppointmentStatus.NO_SHOW ? "danger" : status === AppointmentStatus.RESCHEDULED ? "warning" : "info"; }
const statusOptions = Object.values(AppointmentStatus).map((value) => ({ value, label: statusLabel[value], tone: statusTone(value) }));

export default async function SessionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPagePermission("sessions.read");
  const canManage = session.permissions.includes("sessions.manage");
  const params = await searchParams; const query = parseAdminListQuery(params, ["startsAt", "createdAt", "status"]); const statusValue = typeof params.status === "string" ? params.status : Array.isArray(params.status) ? params.status[0] : undefined; const status = Object.values(AppointmentStatus).includes(statusValue as AppointmentStatus) ? statusValue as AppointmentStatus : undefined; const data = await listAdminAppointments(query, { status }, session); const currentParams = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  return <div className="admin-page-stack"><AdminPageHeader eyebrow="Appointment" title="جلسات" description="فهرست جلسات و وضعیت فعلی آن‌ها از داده‌های واقعی سیستم." />
    <section className="admin-panel-card"><AdminListToolbar><AdminSearchInput defaultValue={query.search} placeholder="ایمیل، نام، دوره یا متخصص" /><label className="admin-search-field"><span>وضعیت</span><AdminSelect name="status" defaultValue={status ?? ""} ariaLabel="وضعیت جلسه" options={[{ value: "", label: "همه" }, ...Object.values(AppointmentStatus).map((value) => ({ value, label: statusLabel[value] }))]} /></label><input type="hidden" name="sort" value={query.sort} /></AdminListToolbar>{data.rows.length ? <AdminDataTable rows={data.rows} getRowKey={(row) => row.id} columns={[{ key: "user", label: "کاربر", render: (row) => <Link className="admin-table-link" href={`/sessions/${row.id}`}>{row.user.profile?.displayName || row.user.email}</Link> }, { key: "product", label: "محصول", render: (row) => <span>{row.product.title}</span> }, { key: "specialist", label: "متخصص", render: (row) => <span>{row.specialist?.displayName || "—"}</span> }, { key: "meetingUrl", label: "لینک جلسه", render: (row) => row.meetingUrl ? <a href={row.meetingUrl} target="_blank" rel="noopener noreferrer" className="admin-table-link">مشاهده</a> : <span>—</span> }, { key: "startsAt", label: "زمان", render: (row) => <time dateTime={row.startsAt.toISOString()}>{row.startsAt.toLocaleString("fa-IR-u-ca-gregory", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</time> }, { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={statusTone(row.status)}>{statusLabel[row.status]}</AdminStatusBadge> }, ...(canManage ? [{ key: "actions", label: "عملیات", className: "admin-session-actions-column", render: (row: (typeof data.rows)[number]) => <AdminAppointmentStatusMenu appointmentId={row.id} currentStatus={row.status} options={statusOptions} /> }] : [])]} /> : <AdminEmptyState title="جلسه‌ای پیدا نشد" description="فیلتر یا عبارت جست‌وجو را تغییر دهید." />}<AdminPagination page={query.page} pageCount={data.meta.pageCount} searchParams={currentParams} /></section></div>;
}
