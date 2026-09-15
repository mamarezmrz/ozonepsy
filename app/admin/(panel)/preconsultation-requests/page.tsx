import type { Metadata } from "next";
import { AdminDataTable, AdminEmptyState, AdminListToolbar, AdminPageHeader, AdminPagination, AdminSearchInput } from "@/components/admin/admin-ui";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { parseAdminListQuery } from "@/lib/admin/query";
import { listAdminPreconsultationRequests } from "@/lib/admin/preconsultation-requests";
import { AdminSelect } from "@/components/admin/admin-select";
import { AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminPreconsultationStatusMenu } from "@/components/admin/admin-preconsultation-status-menu";
import { PreconsultationRequestStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "درخواست‌های پیش‌مشاوره" };

export default async function AdminPreconsultationRequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPagePermission("users.read");
  const canUpdate = session.permissions.includes("users.update");
  const params = await searchParams;
  const query = parseAdminListQuery(params, ["createdAt"]);
  const rawStatus = typeof params.status === "string" ? params.status : Array.isArray(params.status) ? params.status[0] : undefined;
  const statuses = [PreconsultationRequestStatus.PENDING, PreconsultationRequestStatus.CONTACTED, PreconsultationRequestStatus.COMPLETED] as const;
  const status = statuses.includes(rawStatus as (typeof statuses)[number]) ? rawStatus as (typeof statuses)[number] : undefined;
  const labels: Record<(typeof statuses)[number], string> = { PENDING: "بررسی‌نشده", CONTACTED: "بررسی‌شده", COMPLETED: "پاسخ‌داده‌شده" };
  const tones: Record<(typeof statuses)[number], "warning" | "info" | "success"> = { PENDING: "warning", CONTACTED: "info", COMPLETED: "success" };
  const options = statuses.map((value) => ({ value, label: labels[value], tone: tones[value] }));
  const data = await listAdminPreconsultationRequests(query, status);
  const currentParams = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));

  return (
    <div className="admin-page-stack">
      <AdminPageHeader eyebrow="درخواست‌های دریافت‌شده از سایت" title="درخواست‌های پیش‌مشاوره" description="اطلاعات تماس و توضیحات ثبت‌شده را ببینید و برای پیگیری با متقاضی تماس بگیرید." />
      <section className="admin-panel-card">
        <AdminListToolbar>
          <AdminSearchInput defaultValue={query.search} placeholder="جست‌وجو در کشور، شماره تماس یا توضیحات" />
          <label className="admin-search-field"><span>وضعیت</span><AdminSelect name="status" defaultValue={status ?? ""} ariaLabel="وضعیت درخواست" options={[{ value: "", label: "همه" }, ...options]} /></label>
          <input type="hidden" name="sort" value={query.sort} />
        </AdminListToolbar>
        <AdminDataTable
          rows={data.rows}
          getRowKey={(row) => row.id}
          columns={[
            { key: "createdAt", label: "زمان ثبت", render: (row) => <time dateTime={row.createdAt.toISOString()}>{row.createdAt.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" })}</time> },
            { key: "country", label: "کشور", render: (row) => <span>{row.country}</span> },
            { key: "phone", label: "شماره تماس", render: (row) => <span dir="ltr">{row.phone}</span> },
            { key: "message", label: "توضیحات", render: (row) => <span className="admin-preconsultation-message">{row.message?.trim() || "—"}</span> },
            { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={row.status === PreconsultationRequestStatus.CANCELED ? "danger" : tones[row.status]}>{row.status === PreconsultationRequestStatus.CANCELED ? "لغوشده" : labels[row.status]}</AdminStatusBadge> },
            ...(canUpdate ? [{ key: "actions", label: "عملیات", render: (row: (typeof data.rows)[number]) => <AdminPreconsultationStatusMenu requestId={row.id} currentStatus={row.status} options={options} /> }] : []),
          ]}
          empty={<AdminEmptyState title="درخواستی ثبت نشده است" description="درخواست‌های فرم پیش‌مشاوره پس از ثبت، در همین جدول دیده می‌شوند." />}
        />
        <AdminPagination page={data.meta.page} pageCount={data.meta.pageCount} searchParams={currentParams} />
      </section>
    </div>
  );
}
