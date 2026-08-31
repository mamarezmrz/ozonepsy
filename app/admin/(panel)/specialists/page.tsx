import type { Metadata } from "next";
import Link from "next/link";
import { AdminButton, AdminDataTable, AdminEmptyState, AdminListToolbar, AdminPageHeader, AdminPagination, AdminSearchInput, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminSelect } from "@/components/admin/admin-select";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { listAdminSpecialists } from "@/lib/admin/specialists";
import { parseAdminListQuery } from "@/lib/admin/query";
import { SpecialistStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "متخصصان" };

export default async function SpecialistsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPagePermission("instructors.read");
  const params = await searchParams;
  const query = parseAdminListQuery(params, ["createdAt", "displayName", "status"]);
  const statusValue = typeof params.status === "string" ? params.status : Array.isArray(params.status) ? params.status[0] : undefined;
  const status = Object.values(SpecialistStatus).includes(statusValue as SpecialistStatus) ? statusValue as SpecialistStatus : undefined;
  const data = await listAdminSpecialists(query, status, session);
  const currentParams = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  const canWrite = session.permissions.includes("instructors.write");
  return <div className="admin-page-stack"><AdminPageHeader eyebrow="Specialist" title="متخصصان" description="مدیریت متخصصان و مدرس‌های ثبت‌شده در سیستم." action={canWrite ? <AdminButton href="/specialists/new">متخصص جدید</AdminButton> : undefined} />
    <section className="admin-panel-card"><AdminListToolbar><AdminSearchInput defaultValue={query.search} placeholder="نام، slug یا تخصص" /><label className="admin-search-field"><span>وضعیت</span><AdminSelect name="status" defaultValue={status ?? ""} ariaLabel="وضعیت متخصص" options={[{ value: "", label: "همه" }, { value: "ACTIVE", label: "فعال" }, { value: "INACTIVE", label: "غیرفعال" }]} /></label><input type="hidden" name="sort" value={query.sort} /></AdminListToolbar>
      {data.rows.length ? <AdminDataTable rows={data.rows} getRowKey={(row) => row.id} columns={[{ key: "name", label: "نام", render: (row) => <Link className="admin-table-link" href={`/specialists/${row.id}`}>{row.displayName}</Link> }, { key: "specialty", label: "تخصص", render: (row) => <span>{row.specialty || "—"}</span> }, { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={row.status === SpecialistStatus.ACTIVE ? "success" : "neutral"}>{row.status === SpecialistStatus.ACTIVE ? "فعال" : "غیرفعال"}</AdminStatusBadge> }, { key: "courses", label: "دوره‌ها", render: (row) => <span>{row.courseCount.toLocaleString("fa-IR")}</span> }, { key: "appointments", label: "جلسات", render: (row) => <span>{row.appointmentCount.toLocaleString("fa-IR")}</span> }]} /> : <AdminEmptyState title="متخصصی پیدا نشد" description="فیلتر یا عبارت جست‌وجو را تغییر دهید." />}
      <AdminPagination page={data.meta.page} pageCount={data.meta.pageCount} searchParams={currentParams} />
    </section></div>;
}
