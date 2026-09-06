import type { Metadata } from "next";
import { AdminDatePicker } from "@/components/admin/admin-date-picker";
import { AdminSelect } from "@/components/admin/admin-select";
import { AdminDataTable, AdminEmptyState, AdminListToolbar, AdminPagination, AdminSearchInput, AdminStatusBadge } from "@/components/admin/admin-ui";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { listAdminAuditLogs } from "@/lib/admin/audit-viewer";
import { parseAdminListQuery } from "@/lib/admin/query";
import { AuditResult } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "گزارش فعالیت کاربران" };

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPagePermission("audit.read");
  const params = await searchParams;
  const query = parseAdminListQuery(params, ["createdAt"]);
  const resultValue = typeof params.result === "string" ? params.result : Array.isArray(params.result) ? params.result[0] : undefined;
  const result = Object.values(AuditResult).includes(resultValue as AuditResult) ? resultValue as AuditResult : undefined;
  const user = typeof params.user === "string" ? params.user : undefined;
  const from = typeof params.from === "string" ? params.from : undefined;
  const to = typeof params.to === "string" ? params.to : undefined;
  const parseDate = (value?: string, endOfDay = false) => { if (!value) return undefined; const parsed = new Date(value); if (Number.isNaN(parsed.getTime())) return undefined; if (endOfDay) parsed.setHours(23, 59, 59, 999); return parsed; };
  const data = await listAdminAuditLogs(query, { user, result, from: parseDate(from), to: parseDate(to, true) });
  const currentParams = Object.fromEntries(Object.entries(params).map(([key, item]) => [key, Array.isArray(item) ? item[0] : item]));

  return <div className="admin-page-stack">
    <section className="admin-panel-card">
      <div className="admin-section-heading"><h2>گزارش فعالیت کاربران</h2></div>
      <AdminListToolbar>
        <AdminSearchInput defaultValue={query.search} placeholder="ایمیل یا نام کاربر" />
        <label className="admin-search-field"><span>کاربر</span><input name="user" defaultValue={user ?? ""} /></label>
        <label className="admin-search-field"><span>نتیجه</span><AdminSelect name="result" defaultValue={result ?? ""} ariaLabel="نتیجه فعالیت" options={[{ value: "", label: "همه" }, { value: "SUCCESS", label: "موفق" }, { value: "FAILURE", label: "ناموفق" }]} /></label>
        <span className="admin-filter-break" aria-hidden="true" />
        <div className="admin-audit-date-row">
          <label className="admin-search-field"><span>از تاریخ</span><AdminDatePicker name="from" defaultValue={from ?? ""} ariaLabel="از تاریخ" /></label>
          <label className="admin-search-field"><span>تا تاریخ</span><AdminDatePicker name="to" defaultValue={to ?? ""} ariaLabel="تا تاریخ" /></label>
        </div>
        <input type="hidden" name="sort" value={query.sort} /><input type="hidden" name="direction" value={query.direction} />
      </AdminListToolbar>
      {data.rows.length ? <AdminDataTable rows={data.rows} getRowKey={(row) => row.id} columns={[
        { key: "user", label: "کاربر", render: (row) => <span><strong>{row.userName}</strong><small className="admin-table-secondary" dir="ltr">{row.userEmail}</small></span> },
        { key: "action", label: "فعالیت", render: (row) => <span>{row.action}</span> },
        { key: "result", label: "نتیجه", render: (row) => <AdminStatusBadge tone={row.result === AuditResult.SUCCESS ? "success" : "danger"}>{row.result === AuditResult.SUCCESS ? "موفق" : "ناموفق"}</AdminStatusBadge> },
        { key: "reason", label: "دلیل", render: (row) => <span className="admin-clamp-text">{row.reason || "—"}</span> },
        { key: "createdAt", label: "زمان", render: (row) => <span>{row.createdAt.toLocaleString("fa-IR")}</span> },
      ]} /> : <AdminEmptyState title="فعالیتی برای کاربران وجود ندارد" description="ثبت‌نام و تغییر وضعیت کاربران پس از ثبت در سیستم، اینجا نمایش داده می‌شود." />}
      <AdminPagination page={query.page} pageCount={data.meta.pageCount} searchParams={currentParams} />
    </section>
  </div>;
}
