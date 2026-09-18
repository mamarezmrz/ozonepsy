import type { Metadata } from "next";
import { AdminDataTable, AdminEmptyState, AdminListToolbar, AdminPageHeader, AdminPagination, AdminSearchInput, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminDetailsButton } from "@/components/admin/admin-details-button";
import { parseAdminListQuery } from "@/lib/admin/query";
import { listTherapistSessions } from "@/lib/therapist/dashboard";
import { AppointmentStatus } from "@/lib/generated/prisma/enums";
import { TherapistSessionStatusMenu } from "@/components/therapist-session-status-menu";

export const metadata: Metadata = { title: "جلسات متخصص", robots: { index: false, follow: false } };

const statusLabel: Record<AppointmentStatus, string> = { SCHEDULED: "برنامه‌ریزی‌شده", RESCHEDULED: "تغییر زمان", COMPLETED: "برگزارشده", CANCELED: "لغوشده", NO_SHOW: "عدم حضور" };
function statusTone(status: AppointmentStatus) { return status === AppointmentStatus.COMPLETED ? "success" as const : status === AppointmentStatus.CANCELED || status === AppointmentStatus.NO_SHOW ? "danger" as const : status === AppointmentStatus.RESCHEDULED ? "warning" as const : "info" as const; }
function clientName(row: { email: string; profile: { displayName: string | null; firstName: string | null; lastName: string | null } | null }) { return row.profile?.displayName || [row.profile?.firstName, row.profile?.lastName].filter(Boolean).join(" ") || row.email; }

export default async function TherapistSessionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = parseAdminListQuery(params, ["startsAt", "status"]);
  const data = await listTherapistSessions(query);
  const currentParams = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  return <div className="admin-page-stack"><AdminPageHeader eyebrow="داده‌های اختصاصی شما" title="جلسات من" description="فقط جلساتی که به حساب متخصص شما تخصیص داده شده‌اند در این جدول دیده می‌شوند." /><section className="admin-panel-card"><AdminListToolbar><AdminSearchInput defaultValue={query.search} placeholder="نام مراجع، ایمیل یا خدمت" /><input type="hidden" name="sort" value={query.sort} /></AdminListToolbar><AdminDataTable rows={data.rows} getRowKey={(row) => row.id} columns={[
    { key: "client", label: "مراجع", render: (row) => <span>{clientName(row.user)}</span> },
    { key: "product", label: "خدمت", render: (row) => <span>{row.product.title}</span> },
    { key: "time", label: "زمان", render: (row) => <time dateTime={row.startsAt.toISOString()}>{row.startsAt.toLocaleString("fa-IR-u-ca-gregory", { dateStyle: "medium", timeStyle: "short" })}</time> },
    { key: "meeting", label: "لینک جلسه", render: (row) => row.meetingUrl ? <a className="admin-table-link" href={row.meetingUrl} target="_blank" rel="noopener noreferrer">ورود</a> : <span>—</span> },
    { key: "notes", label: "توضیحات", render: (row) => <AdminDetailsButton title="توضیحات جلسه" description={row.notes} /> },
    { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={statusTone(row.status)}>{statusLabel[row.status]}</AdminStatusBadge> },
    { key: "actions", label: "عملیات", render: (row) => row.status === AppointmentStatus.SCHEDULED || row.status === AppointmentStatus.RESCHEDULED ? <TherapistSessionStatusMenu appointmentId={row.id} /> : <span className="therapist-table-secondary">نهایی‌شده</span> },
  ]} empty={<AdminEmptyState title="جلسه‌ای پیدا نشد" description="جلساتی که مدیریت به شما تخصیص دهد اینجا نمایش داده می‌شوند." />} /><AdminPagination page={data.meta.page} pageCount={data.meta.pageCount} searchParams={currentParams} /></section></div>;
}
