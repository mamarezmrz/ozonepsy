import type { Metadata } from "next";
import { AdminButton, AdminDataTable, AdminListToolbar, AdminPageHeader, AdminSearchInput, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminInviteForm } from "@/components/admin/admin-invite-form";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { listAdminUsers } from "@/lib/admin/admins";
import { parseAdminListQuery } from "@/lib/admin/query";
import { AdminPagination } from "@/components/admin/admin-ui";
import { ADMIN_ROLE_LABELS, type AdminRole } from "@/lib/admin/constants";
import { UserStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "مدیریت ادمین‌ها" };

export default async function AdminsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPagePermission("admins.manage");
  const params = await searchParams;
  const query = parseAdminListQuery(params, ["createdAt", "email", "status"]);
  const data = await listAdminUsers(query, session);
  const currentParams = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  return <div className="admin-page-stack">
    <AdminPageHeader eyebrow="دسترسی و امنیت" title="مدیریت ادمین‌ها" description="دعوت، نقش و وضعیت دسترسی مدیران سیستم را مدیریت کنید." />
    <AdminListToolbar action={null}><AdminSearchInput defaultValue={query.search} placeholder="ایمیل یا نام ادمین…" /></AdminListToolbar>
    <section className="admin-panel-card"><AdminDataTable rows={data.rows} getRowKey={(row) => row.id} columns={[
      { key: "name", label: "نام", render: (row) => <AdminButton href={`/admins/${row.id}`} variant="secondary">{row.name}</AdminButton> },
      { key: "email", label: "ایمیل", render: (row) => <span dir="ltr">{row.email}</span> },
      { key: "roles", label: "نقش", render: (row) => <span>{row.roles.map((role) => ADMIN_ROLE_LABELS[role as AdminRole] ?? role).join("، ")}</span> },
      { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={row.status === UserStatus.ACTIVE ? "success" : "danger"}>{row.status === UserStatus.ACTIVE ? "فعال" : "غیرفعال"}</AdminStatusBadge> },
      { key: "createdAt", label: "تاریخ ایجاد", render: (row) => <span>{row.createdAt.toLocaleDateString("fa-IR")}</span> },
    ]} empty={<p className="admin-table-empty">ادمینی ثبت نشده است.</p>} /></section>
    <AdminPagination page={data.meta.page} pageCount={data.meta.pageCount} searchParams={currentParams} />
    <section className="admin-panel-card"><h2>دعوت ادمین جدید</h2><p className="admin-muted-copy">لینک دعوت فقط یک‌بار نمایش داده می‌شود و باید از کانال امن سازمانی ارسال شود.</p><AdminInviteForm /></section>
  </div>;
}
