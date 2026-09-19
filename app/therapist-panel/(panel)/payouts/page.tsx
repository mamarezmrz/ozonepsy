import type { Metadata } from "next";
import { AdminDataTable, AdminEmptyState, AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminDetailsButton } from "@/components/admin/admin-details-button";
import { getTherapistPayouts } from "@/lib/therapist/dashboard";
import { SpecialistPayoutStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "پرداخت‌های متخصص", robots: { index: false, follow: false } };

const statusLabels: Record<SpecialistPayoutStatus, string> = { PENDING: "در انتظار پرداخت", PAID: "پرداخت‌شده", CANCELED: "لغوشده" };

function statusTone(status: SpecialistPayoutStatus) {
  return status === SpecialistPayoutStatus.PAID ? "success" as const : status === SpecialistPayoutStatus.CANCELED ? "danger" as const : "warning" as const;
}

function formatAmount(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("fa-IR", { style: "currency", currency, minimumFractionDigits: 2 }).format(amountMinor / 100);
}

export default async function TherapistPayoutsPage() {
  const rows = await getTherapistPayouts();
  return <div className="admin-page-stack"><AdminPageHeader eyebrow="گزارش مالی متخصص" title="پرداخت‌های من" description="آرشیو پرداخت‌هایی که مدیریت اُزون برای شما ثبت کرده است." /><section className="admin-panel-card">{rows.length ? <AdminDataTable rows={rows} getRowKey={(row) => row.id} columns={[
    { key: "amount", label: "مبلغ", render: (row) => <span dir="ltr">{formatAmount(row.amountMinor, row.currency)}</span> },
    { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={statusTone(row.status)}>{statusLabels[row.status]}</AdminStatusBadge> },
    { key: "date", label: "تاریخ پرداخت", render: (row) => row.paidAt ? <time dateTime={row.paidAt.toISOString()}>{row.paidAt.toLocaleDateString("fa-IR-u-ca-gregory")}</time> : <span>—</span> },
    { key: "reference", label: "شناسه پرداخت", render: (row) => <span dir="ltr">{row.reference || "—"}</span> },
    { key: "note", label: "توضیحات", render: (row) => <AdminDetailsButton title="توضیحات پرداخت" description={row.note} /> },
  ]} /> : <AdminEmptyState title="پرداختی برای نمایش نیست" description="پرداخت‌هایی که مدیریت برای شما ثبت کند، در این آرشیو نمایش داده می‌شوند." />}</section></div>;
}
