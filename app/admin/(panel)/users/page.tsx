import type { Metadata } from "next";
import Link from "next/link";
import { AdminButton, AdminDataTable, AdminListToolbar, AdminPageHeader, AdminPagination, AdminStatusBadge, AdminSearchInput } from "@/components/admin/admin-ui";
import { AdminSelect } from "@/components/admin/admin-select";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { listAdminUsers } from "@/lib/admin/users";
import { parseAdminListQuery } from "@/lib/admin/query";
import { UserStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "کاربران" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPagePermission("users.read");
  const params = await searchParams;
  const query = parseAdminListQuery(params, ["createdAt", "email", "status"]);
  const statusValue = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = statusValue === UserStatus.ACTIVE || statusValue === UserStatus.SUSPENDED ? statusValue as UserStatus : undefined;
  const data = await listAdminUsers(query, status);
  const currentParams = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));

  return <div className="admin-page-stack"><AdminPageHeader eyebrow="مدیریت کاربران عمومی" title="کاربران" description="فهرست کاربران عمومی با داده‌های واقعی و صفحه‌بندی سمت سرور." action={<>{session.permissions.includes("users.update") ? <AdminButton href="/users/new">ساخت کاربر</AdminButton> : null}<AdminButton href="/admin" variant="secondary">بازگشت به نمای کلی</AdminButton></>} />
    <section className="admin-panel-card"><AdminListToolbar><AdminSearchInput defaultValue={query.search} placeholder="نام، ایمیل یا شماره تلفن" /><label className="admin-search-field"><span>وضعیت</span><AdminSelect name="status" defaultValue={status ?? ""} ariaLabel="وضعیت کاربر" options={[{ value: "", label: "همه" }, { value: UserStatus.ACTIVE, label: "فعال" }, { value: UserStatus.SUSPENDED, label: "تعلیق‌شده" }]} /></label><input type="hidden" name="sort" value={query.sort} /></AdminListToolbar>
      <AdminDataTable rows={data.rows} getRowKey={(row) => row.id} columns={[
        { key: "name", label: "نام", render: (row) => <Link className="admin-table-link" href={`/users/${row.id}`}>{row.name}</Link> },
        { key: "email", label: "ایمیل", render: (row) => <span dir="ltr">{row.email}</span> },
        { key: "phone", label: "تلفن", render: (row) => <span dir="ltr">{row.phone}</span> },
        { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={row.status === UserStatus.ACTIVE ? "success" : "warning"}>{row.status === UserStatus.ACTIVE ? "فعال" : "تعلیق‌شده"}</AdminStatusBadge> },
        { key: "createdAt", label: "ثبت‌نام", render: (row) => <span>{row.createdAt.toLocaleDateString("fa-IR")}</span> },
      ]} empty={<div className="admin-table-empty"><h3>کاربری پیدا نشد</h3><p>فیلتر یا عبارت جست‌وجو را تغییر دهید.</p></div>} />
      <AdminPagination page={data.meta.page} pageCount={data.meta.pageCount} searchParams={currentParams} />
    </section>
  </div>;
}
