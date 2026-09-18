import type { Metadata } from "next";
import Link from "next/link";
import { AdminButton, AdminDataTable, AdminEmptyState, AdminListToolbar, AdminPageHeader, AdminPagination, AdminSearchInput, AdminStatusBadge } from "@/components/admin/admin-ui";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { listAdminSpecialists } from "@/lib/admin/specialists";
import { parseAdminListQuery } from "@/lib/admin/query";
import { SpecialistStatus, UserStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "متخصص ها" };

function statusLabel(status: SpecialistStatus) {
  return status === SpecialistStatus.ACTIVE ? "فعال" : "غیرفعال";
}

export default async function SpecialistsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPagePermission("instructors.read");
  const params = await searchParams;
  const query = parseAdminListQuery(params, ["createdAt", "displayName", "status"]);
  const statusValue = typeof params.status === "string" ? params.status : undefined;
  const status = Object.values(SpecialistStatus).includes(statusValue as SpecialistStatus) ? statusValue as SpecialistStatus : undefined;
  const data = await listAdminSpecialists(query, status, session);
  const canWrite = session.permissions.includes("instructors.write");
  const currentParams = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));

  return <div className="admin-page-stack">
    <AdminPageHeader eyebrow="مدیریت تیم درمان" title="متخصص ها" description="فهرست متخصصانی که می‌توانند برای جلسات به کاربران اختصاص داده شوند." action={canWrite ? <AdminButton href="/admin/specialists/new">افزودن متخصص</AdminButton> : undefined} />
    <section className="admin-panel-card">
      <AdminListToolbar>
        <AdminSearchInput defaultValue={query.search} placeholder="نام، تخصص، ایمیل یا شماره تماس" />
      </AdminListToolbar>
      {data.rows.length ? <AdminDataTable rows={data.rows} getRowKey={(row) => row.id} columns={[
        { key: "displayName", label: "نام و نام خانوادگی", render: (row) => canWrite ? <Link className="admin-table-link" href={`/admin/specialists/${row.id}`}>{row.displayName}</Link> : <span>{row.displayName}</span> },
        { key: "specialty", label: "تخصص", render: (row) => <span>{row.specialty || "—"}</span> },
        { key: "phone", label: "شماره تماس", render: (row) => <span dir="ltr">{row.phone || "—"}</span> },
        { key: "country", label: "کشور", render: (row) => <span>{row.country || "—"}</span> },
        { key: "email", label: "ایمیل", render: (row) => <span dir="ltr">{row.email || "—"}</span> },
        { key: "status", label: "وضعیت پروفایل", render: (row) => <AdminStatusBadge tone={row.status === SpecialistStatus.ACTIVE ? "success" : "neutral"}>{statusLabel(row.status)}</AdminStatusBadge> },
        { key: "accountStatus", label: "حساب ورود", render: (row) => <AdminStatusBadge tone={row.user?.status === UserStatus.ACTIVE ? "success" : "warning"}>{row.user?.status === UserStatus.ACTIVE ? "فعال" : row.user ? "غیرفعال" : "بدون حساب"}</AdminStatusBadge> },
        ...(canWrite ? [{ key: "actions", label: "عملیات", render: (row: typeof data.rows[number]) => <div className="admin-table-actions"><AdminButton href={`/admin/specialists/${row.id}`} variant="secondary">ویرایش</AdminButton></div> }] : []),
      ]} /> : <AdminEmptyState title="متخصصی ثبت نشده است" description="برای اضافه‌کردن اولین متخصص، از دکمهٔ بالای صفحه استفاده کنید." action={canWrite ? <AdminButton href="/admin/specialists/new">افزودن متخصص</AdminButton> : undefined} />}
      <AdminPagination page={data.meta.page} pageCount={data.meta.pageCount} searchParams={currentParams} />
    </section>
  </div>;
}
