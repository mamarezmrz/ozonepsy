import type { Metadata } from "next";
import Link from "next/link";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminButton, AdminDataTable, AdminEmptyState, AdminListToolbar, AdminPageHeader, AdminPagination, AdminSearchInput, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminSelect } from "@/components/admin/admin-select";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { listAdminTherapyProducts } from "@/lib/admin/therapy-products";
import { parseAdminListQuery } from "@/lib/admin/query";
import { ProductStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "گروه‌درمانی" };

function statusLabel(status: ProductStatus) { return status === ProductStatus.PUBLISHED ? "منتشرشده" : status === ProductStatus.ARCHIVED ? "مخفی‌شده" : "پیش‌نویس"; }

export default async function GroupTherapyAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPagePermission("products.read");
  const params = await searchParams;
  const query = parseAdminListQuery(params, ["createdAt", "title", "status"]);
  const rawStatus = typeof params.status === "string" ? params.status : undefined;
  const status = Object.values(ProductStatus).includes(rawStatus as ProductStatus) ? rawStatus as ProductStatus : undefined;
  const data = await listAdminTherapyProducts("group", query, status);
  const canWrite = session.permissions.includes("products.write");

  return <div className="admin-page-stack">
    <AdminPageHeader eyebrow="Product / GroupTherapyProduct" title="گروه‌درمانی" description="ساخت و مدیریت گروه‌های درمانی قابل انتشار در سایت." action={canWrite ? <AdminButton href="/group-therapy/new">گروه‌درمانی جدید</AdminButton> : undefined} />
    <section className="admin-panel-card">
      <AdminListToolbar><AdminSearchInput defaultValue={query.search} placeholder="عنوان یا slug گروه‌درمانی" /><label className="admin-search-field"><span>وضعیت</span><AdminSelect name="status" defaultValue={status ?? ""} ariaLabel="وضعیت گروه‌درمانی" options={[{ value: "", label: "همه" }, { value: "DRAFT", label: "پیش‌نویس" }, { value: "PUBLISHED", label: "منتشرشده" }, { value: "ARCHIVED", label: "مخفی‌شده" }]} /></label><input type="hidden" name="sort" value={query.sort} /></AdminListToolbar>
      {data.rows.length ? <AdminDataTable rows={data.rows} getRowKey={(row) => row.id} columns={[
        { key: "title", label: "عنوان", render: (row) => <Link className="admin-table-link" href={`/group-therapy/${row.id}`}>{row.title}</Link> },
        { key: "slug", label: "Slug", render: (row) => <span dir="ltr">{row.slug}</span> },
        { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={row.status === ProductStatus.PUBLISHED ? "success" : row.status === ProductStatus.DRAFT ? "warning" : "neutral"}>{statusLabel(row.status)}</AdminStatusBadge> },
        { key: "actions", label: "عملیات", render: (row) => <div className="admin-table-actions">
          {canWrite ? <AdminButton href={`/group-therapy/${row.id}`} variant="secondary">ویرایش</AdminButton> : null}
          {canWrite ? row.status === ProductStatus.PUBLISHED ? <AdminActionButton action={`/api/admin/group-therapy/${row.id}/status`} method="PATCH" body={{ status: ProductStatus.ARCHIVED, reason: "مخفی‌سازی گروه‌درمانی" }} label="مخفی کردن" variant="danger" confirm="این گروه‌درمانی از سایت مخفی شود؟" successMessage="گروه‌درمانی مخفی شد." /> : row.status === ProductStatus.ARCHIVED ? <AdminActionButton action={`/api/admin/group-therapy/${row.id}/status`} method="PATCH" body={{ status: ProductStatus.DRAFT }} label="نمایش دوباره" variant="secondary" reasonRequired confirm="این گروه‌درمانی دوباره به پیش‌نویس برگردد؟" successMessage="گروه‌درمانی به پیش‌نویس برگشت." /> : <AdminActionButton action={`/api/admin/group-therapy/${row.id}/status`} method="PATCH" body={{ status: ProductStatus.PUBLISHED, reason: "انتشار گروه‌درمانی" }} label="انتشار" variant="primary" successMessage="گروه‌درمانی منتشر شد و در سایت نمایش داده می‌شود." /> : null}
          {canWrite ? <AdminActionButton action={`/api/admin/group-therapy/${row.id}`} method="DELETE" label="حذف" variant="danger" confirm="این گروه‌درمانی برای همیشه حذف شود؟ اگر سابقه خرید یا جلسه داشته باشد حذف انجام نمی‌شود." successMessage="گروه‌درمانی حذف شد." /> : null}
        </div> },
      ]} /> : <AdminEmptyState title="گروه‌درمانی‌ای پیدا نشد" description="برای ساخت اولین گروه‌درمانی از دکمهٔ بالای صفحه استفاده کنید." action={canWrite ? <AdminButton href="/group-therapy/new">گروه‌درمانی جدید</AdminButton> : undefined} />}
      <AdminPagination page={data.meta.page} pageCount={data.meta.pageCount} searchParams={{ search: query.search, sort: query.sort, direction: query.direction, status: status ?? undefined }} />
    </section>
  </div>;
}
