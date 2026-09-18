import type { Metadata } from "next";
import { AdminDataTable, AdminEmptyState, AdminListToolbar, AdminPageHeader, AdminPagination, AdminSearchInput, AdminStatusBadge } from "@/components/admin/admin-ui";
import { parseAdminListQuery } from "@/lib/admin/query";
import { listTherapistReviews } from "@/lib/therapist/dashboard";
import { ReviewStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "بازخوردهای متخصص", robots: { index: false, follow: false } };
const statusLabel: Record<ReviewStatus, string> = { PENDING: "در انتظار بررسی", PUBLISHED: "منتشرشده", HIDDEN: "پنهان‌شده" };
function tone(status: ReviewStatus) { return status === ReviewStatus.PUBLISHED ? "success" as const : status === ReviewStatus.HIDDEN ? "neutral" as const : "warning" as const; }

export default async function TherapistReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = parseAdminListQuery(params, ["createdAt"]);
  const data = await listTherapistReviews(query);
  const currentParams = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  return <div className="admin-page-stack"><AdminPageHeader eyebrow="فقط قابل مشاهده" title="بازخوردها" description="بازخوردهای ثبت‌شده برای خدمات اختصاص‌یافته به شما نمایش داده می‌شوند و تغییر وضعیت آن‌ها در اختیار مدیریت است." /><section className="admin-panel-card"><AdminListToolbar><AdminSearchInput defaultValue={query.search} placeholder="متن بازخورد، مراجع یا خدمت" /><input type="hidden" name="sort" value={query.sort} /></AdminListToolbar><AdminDataTable rows={data.rows} getRowKey={(row) => row.id} columns={[
    { key: "body", label: "متن بازخورد", render: (row) => <span className="admin-clamp-text" title={row.body}>{row.body}</span> },
    { key: "client", label: "مراجع", render: (row) => <span>{row.user.profile?.displayName || row.user.email}</span> },
    { key: "product", label: "خدمت", render: (row) => <span>{row.product?.title || "—"}</span> },
    { key: "rating", label: "امتیاز", render: (row) => <span>{row.rating ?? "—"}</span> },
    { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={tone(row.status)}>{statusLabel[row.status]}</AdminStatusBadge> },
    { key: "date", label: "تاریخ", render: (row) => <time dateTime={row.createdAt.toISOString()}>{row.createdAt.toLocaleDateString("fa-IR")}</time> },
  ]} empty={<AdminEmptyState title="بازخوردی برای نمایش نیست" description="بازخوردهای خدمات شما پس از ثبت در این جدول دیده می‌شوند." />} /><AdminPagination page={data.meta.page} pageCount={data.meta.pageCount} searchParams={currentParams} /></section></div>;
}
