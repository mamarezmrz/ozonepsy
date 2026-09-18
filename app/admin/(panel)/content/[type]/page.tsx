import type { Metadata } from "next";
import Link from "next/link";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminFaqManager } from "@/components/admin/admin-faq-manager";
import { AdminButton, AdminDataTable, AdminEmptyState, AdminListToolbar, AdminPageHeader, AdminPagination, AdminSearchInput, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminSelect } from "@/components/admin/admin-select";
import { listAdminContent } from "@/lib/admin/content";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { parseAdminListQuery } from "@/lib/admin/query";
import { ContentStatus } from "@/lib/generated/prisma/enums";
import { getDefaultFaqsForPage } from "@/lib/public/content-defaults";
import { isFaqPageKey } from "@/lib/public/faq-pages";

export const metadata: Metadata = { title: "محتوای ساختاریافته" };
const labels: Record<ContentStatus, string> = { DRAFT: "پیش‌نویس", PUBLISHED: "منتشرشده", ARCHIVED: "بایگانی" };
function tone(status: ContentStatus) { return status === ContentStatus.PUBLISHED ? "success" : status === ContentStatus.ARCHIVED ? "neutral" : "warning"; }

export default async function ContentPage({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPagePermission("content.read");
  const { type: rawType } = await params;
  const type = rawType === "faq" ? "faq" : rawType === "testimonials" ? "testimonial" : null;
  if (!type) return <AdminEmptyState title="نوع محتوا پیدا نشد" />;

  const values = await searchParams;
  const canWrite = session.permissions.includes("content.write");

  if (type === "faq") {
    const rawPageKey = typeof values.pageKey === "string" ? values.pageKey : Array.isArray(values.pageKey) ? values.pageKey[0] : undefined;
    const pageKey = isFaqPageKey(rawPageKey) ? rawPageKey : "home";
    const faqQuery = parseAdminListQuery({ page: "1", pageSize: "100", sort: "sortOrder", direction: "asc" }, ["sortOrder"]);
    const data = await listAdminContent("faq", faqQuery, undefined, pageKey);

    return <div className="admin-page-stack">
      <AdminPageHeader eyebrow="محتوای سایت" title="سوالات متداول" description="صفحه را از تب‌ها انتخاب کنید؛ سوال‌ها و پاسخ‌های همان صفحه را اینجا مدیریت کنید." />
      <section className="admin-panel-card admin-faq-panel">
        <AdminFaqManager pageKey={pageKey} rows={data.rows as Array<{ id: string; question: string; answer: string; pageKey: string; status: ContentStatus; sortOrder: number }>} defaults={getDefaultFaqsForPage(pageKey)} canWrite={canWrite} />
      </section>
    </div>;
  }

  const query = parseAdminListQuery(values, ["sortOrder", "status"]);
  const statusValue = typeof values.status === "string" ? values.status : Array.isArray(values.status) ? values.status[0] : undefined;
  const status = Object.values(ContentStatus).includes(statusValue as ContentStatus) ? statusValue as ContentStatus : undefined;
  const data = await listAdminContent(type, query, status);
  const currentParams = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  const newHref = "/admin/content/testimonials/new";

  return <div className="admin-page-stack">
    <AdminPageHeader eyebrow="محتوای ساختاریافته" title="نظرات مشتریان" description="محتوای مورد استفاده در بخش‌های عمومی سایت را مدیریت کنید." action={canWrite ? <AdminButton href={newHref}>محتوای جدید</AdminButton> : undefined} />
    <section className="admin-panel-card">
      <AdminListToolbar>
        <AdminSearchInput defaultValue={query.search} placeholder="جست‌وجو در محتوا" />
        <label className="admin-search-field"><span>وضعیت</span><AdminSelect name="status" defaultValue={status ?? ""} ariaLabel="وضعیت محتوا" options={[{ value: "", label: "همه" }, ...Object.values(ContentStatus).map((item) => ({ value: item, label: labels[item] }))]} /></label>
        <input type="hidden" name="sort" value={query.sort} />
      </AdminListToolbar>
      {data.rows.length ? <AdminDataTable rows={data.rows as Array<{ id: string; name: string; body: string; status: ContentStatus; sortOrder: number; updatedAt: Date }>} getRowKey={(row) => row.id} columns={[
        { key: "name", label: "نام", render: (row) => <Link className="admin-table-link" href={`/admin/content/testimonials/${row.id}`}>{row.name}</Link> },
        { key: "body", label: "متن", render: (row) => <span className="admin-clamp-text">{row.body}</span> },
        { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={tone(row.status)}>{labels[row.status]}</AdminStatusBadge> },
        { key: "actions", label: "عملیات", render: (row) => canWrite ? <AdminActionButton action={`/api/admin/content/testimonials/${row.id}`} method="PATCH" body={{ status: row.status === ContentStatus.PUBLISHED ? ContentStatus.DRAFT : ContentStatus.PUBLISHED }} reasonRequired label={row.status === ContentStatus.PUBLISHED ? "پیش‌نویس" : "انتشار"} /> : null },
      ]} /> : <AdminEmptyState title="محتوایی پیدا نشد" description="برای شروع یک مورد جدید بسازید." action={canWrite ? <AdminButton href={newHref}>محتوای جدید</AdminButton> : undefined} />}
      <AdminPagination page={query.page} pageCount={data.meta.pageCount} searchParams={currentParams} />
    </section>
  </div>;
}
