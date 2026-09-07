import type { Metadata } from "next";
import Link from "next/link";
import { AdminButton, AdminDataTable, AdminEmptyState, AdminListToolbar, AdminPageHeader, AdminPagination, AdminSearchInput, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminSelect } from "@/components/admin/admin-select";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { listAdminCourses } from "@/lib/admin/courses";
import { parseAdminListQuery } from "@/lib/admin/query";
import { ProductStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "دوره‌ها" };

function statusLabel(status: ProductStatus) {
  return status === ProductStatus.PUBLISHED ? "منتشرشده" : status === ProductStatus.ARCHIVED ? "مخفی‌شده" : "پیش‌نویس";
}

export default async function CoursesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPagePermission("courses.read");
  const params = await searchParams;
  const query = parseAdminListQuery(params, ["createdAt", "title", "status"]);
  const statusValue = typeof params.status === "string" ? params.status : undefined;
  const status = Object.values(ProductStatus).includes(statusValue as ProductStatus) ? statusValue as ProductStatus : undefined;
  const data = await listAdminCourses(query, status, session);
  const canWrite = session.permissions.includes("courses.write");
  const canPublish = session.permissions.includes("courses.publish");

  return (
    <div className="admin-page-stack">
      <AdminPageHeader eyebrow="Product / CourseProduct" title="دوره‌ها" description="مدیریت دوره‌های واقعی موجود در کاتالوگ اُزون." action={canWrite ? <AdminButton href="/courses/new">دوره جدید</AdminButton> : undefined} />
      <section className="admin-panel-card">
        <AdminListToolbar>
          <AdminSearchInput defaultValue={query.search} placeholder="عنوان یا slug دوره" />
          <label className="admin-search-field"><span>وضعیت</span><AdminSelect name="status" defaultValue={status ?? ""} ariaLabel="وضعیت دوره" options={[{ value: "", label: "همه" }, { value: "DRAFT", label: "پیش‌نویس" }, { value: "PUBLISHED", label: "منتشرشده" }, { value: "ARCHIVED", label: "مخفی‌شده" }]} /></label>
          <input type="hidden" name="sort" value={query.sort} />
        </AdminListToolbar>
        {data.rows.length ? (
          <AdminDataTable
            rows={data.rows}
            getRowKey={(row) => row.id}
            columns={[
              { key: "title", label: "عنوان", render: (row) => <Link className="admin-table-link" href={`/courses/${row.id}`}>{row.title}</Link> },
              { key: "slug", label: "Slug", render: (row) => <span dir="ltr">{row.slug}</span> },
              { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={row.status === ProductStatus.PUBLISHED ? "success" : row.status === ProductStatus.DRAFT ? "warning" : "neutral"}>{statusLabel(row.status)}</AdminStatusBadge> },
              { key: "category", label: "دسته‌بندی", render: (row) => <span>{row.category?.title || "—"}</span> },
              { key: "modules", label: "ماژول", render: (row) => <span>{row.moduleCount.toLocaleString("fa-IR")}</span> },
              { key: "enrollments", label: "ثبت‌نام", render: (row) => <span>{row.enrollmentCount.toLocaleString("fa-IR")}</span> },
              {
                key: "actions",
                label: "عملیات",
                render: (row) => {
                  const statusAction = row.status === ProductStatus.PUBLISHED
                    ? { status: ProductStatus.ARCHIVED, label: "مخفی کردن", variant: "danger" as const, confirm: "این دوره از سایت مخفی شود؟" }
                    : row.status === ProductStatus.ARCHIVED
                      ? { status: ProductStatus.DRAFT, label: "نمایش دوباره", variant: "secondary" as const, confirm: "این دوره دوباره به پیش‌نویس برگردد؟" }
                      : { status: ProductStatus.PUBLISHED, label: "انتشار", variant: "primary" as const, confirm: "این دوره در سایت منتشر شود؟" };
                  return <div className="admin-table-actions">
                    {canWrite ? <AdminButton href={`/courses/${row.id}`} variant="secondary">ویرایش</AdminButton> : null}
                    {canPublish ? statusAction.status === ProductStatus.PUBLISHED ? <AdminActionButton action={`/api/admin/courses/${row.id}/status`} method="PATCH" body={{ status: statusAction.status, reason: "انتشار دوره" }} label={statusAction.label} variant={statusAction.variant} successMessage="دوره منتشر شد و در سایت نمایش داده می‌شود." /> : <AdminActionButton action={`/api/admin/courses/${row.id}/status`} method="PATCH" body={{ status: statusAction.status }} reasonRequired label={statusAction.label} variant={statusAction.variant} confirm={statusAction.confirm} successMessage={`وضعیت دوره به «${statusAction.label}» تغییر کرد.`} /> : null}
                    {canWrite ? <AdminActionButton action={`/api/admin/courses/${row.id}`} method="DELETE" label="حذف" variant="danger" confirm="این دوره برای همیشه حذف شود؟ اگر سابقه خرید یا ثبت‌نام داشته باشد حذف انجام نمی‌شود." successMessage="دوره حذف شد." /> : null}
                  </div>;
                },
              },
            ]}
          />
        ) : <AdminEmptyState title="دوره‌ای پیدا نشد" description="عبارت جست‌وجو یا فیلتر را تغییر دهید." />}
        <AdminPagination page={query.page} pageCount={data.meta.pageCount} searchParams={params as Record<string, string | undefined>} />
      </section>
    </div>
  );
}
