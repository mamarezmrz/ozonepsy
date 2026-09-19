import type { Metadata } from "next";
import { AdminDataTable, AdminEmptyState, AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";
import { getTherapistClients } from "@/lib/therapist/dashboard";
import { UserStatus } from "@/lib/generated/prisma/enums";
import { formatPersianNumber } from "@/lib/format";
import { TherapistClientNote } from "@/components/therapist-client-note";

export const metadata: Metadata = { title: "مراجعان متخصص", robots: { index: false, follow: false } };

export default async function TherapistClientsPage() {
  const rows = await getTherapistClients();
  return <div className="admin-page-stack"><AdminPageHeader eyebrow="داده‌های اختصاصی شما" title="مراجعان من" description="این فهرست فقط از جلسات و دسترسی‌های خدماتی مرتبط با شما ساخته می‌شود." /><section className="admin-panel-card"><AdminDataTable rows={rows} getRowKey={(row) => row.id} columns={[
    { key: "name", label: "نام", render: (row) => <span>{row.name}</span> },
    { key: "email", label: "ایمیل", render: (row) => <span dir="ltr">{row.email}</span> },
    { key: "phone", label: "شماره تماس", render: (row) => <span dir="ltr">{row.phone || "—"}</span> },
    { key: "services", label: "خدمات", render: (row) => <span className="therapist-table-secondary">{row.services.length ? row.services.join("، ") : "—"}</span> },
    { key: "sessions", label: "جلسات", render: (row) => <span>{formatPersianNumber(row.appointmentCount)}</span> },
    { key: "remaining", label: "باقی‌مانده", render: (row) => <span>{row.remainingSessions === null ? "—" : formatPersianNumber(row.remainingSessions)}</span> },
    { key: "next", label: "جلسه بعدی", render: (row) => row.nextAppointment ? <time dateTime={row.nextAppointment.toISOString()}>{row.nextAppointment.toLocaleString("fa-IR-u-ca-gregory", { dateStyle: "medium", timeStyle: "short" })}</time> : <span>—</span> },
    { key: "note", label: "پرونده کمکی", render: (row) => <TherapistClientNote userId={row.id} clientName={row.name} initialNote={row.note} /> },
    { key: "status", label: "حساب", render: (row) => <AdminStatusBadge tone={row.status === UserStatus.ACTIVE ? "success" : "warning"}>{row.status === UserStatus.ACTIVE ? "فعال" : "غیرفعال"}</AdminStatusBadge> },
  ]} empty={<AdminEmptyState title="مراجعی برای نمایش نیست" description="با تخصیص جلسه یا دسترسی خدمت، مراجع در این فهرست دیده می‌شود." />} /></section></div>;
}
