import type { Metadata } from "next";
import { AdminDataTable, AdminEmptyState, AdminListToolbar, AdminPageHeader, AdminPagination, AdminSearchInput } from "@/components/admin/admin-ui";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { parseAdminListQuery } from "@/lib/admin/query";
import { listAdminPreconsultationRequests } from "@/lib/admin/preconsultation-requests";

export const metadata: Metadata = { title: "درخواست‌های پیش‌مشاوره" };

export default async function AdminPreconsultationRequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPagePermission("users.read");
  const params = await searchParams;
  const query = parseAdminListQuery(params, ["createdAt"]);
  const data = await listAdminPreconsultationRequests(query);
  const currentParams = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));

  return (
    <div className="admin-page-stack">
      <AdminPageHeader eyebrow="درخواست‌های دریافت‌شده از سایت" title="درخواست‌های پیش‌مشاوره" description="اطلاعات تماس و توضیحات ثبت‌شده را ببینید و برای پیگیری با متقاضی تماس بگیرید." />
      <section className="admin-panel-card">
        <AdminListToolbar>
          <AdminSearchInput defaultValue={query.search} placeholder="جست‌وجو در کشور، شماره تماس یا توضیحات" />
        </AdminListToolbar>
        <AdminDataTable
          rows={data.rows}
          getRowKey={(row) => row.id}
          columns={[
            { key: "createdAt", label: "زمان ثبت", render: (row) => <time dateTime={row.createdAt.toISOString()}>{row.createdAt.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" })}</time> },
            { key: "country", label: "کشور", render: (row) => <span>{row.country}</span> },
            { key: "phone", label: "شماره تماس", render: (row) => <span dir="ltr">{row.phone}</span> },
            { key: "message", label: "توضیحات", render: (row) => <span className="admin-preconsultation-message">{row.message?.trim() || "—"}</span> },
          ]}
          empty={<AdminEmptyState title="درخواستی ثبت نشده است" description="درخواست‌های فرم پیش‌مشاوره پس از ثبت، در همین جدول دیده می‌شوند." />}
        />
        <AdminPagination page={data.meta.page} pageCount={data.meta.pageCount} searchParams={currentParams} />
      </section>
    </div>
  );
}
