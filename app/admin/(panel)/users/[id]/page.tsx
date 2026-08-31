import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminButton, AdminDataTable, AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { getAdminUserDetail } from "@/lib/admin/users";
import { UserStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "جزئیات کاربر" };

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPagePermission("users.read");
  const { id } = await params;
  let user;
  try { user = await getAdminUserDetail(id); } catch { notFound(); }
  const statusLabel = user.status === UserStatus.ACTIVE ? "فعال" : user.status === UserStatus.SUSPENDED ? "تعلیق‌شده" : "بایگانی";
  return <div className="admin-page-stack"><AdminPageHeader eyebrow="جزئیات کاربر عمومی" title={user.name} description={user.email} action={<AdminButton href="/users" variant="secondary">بازگشت به کاربران</AdminButton>} />
    <section className="admin-detail-grid"><article className="admin-panel-card"><h3>اطلاعات حساب</h3><dl className="admin-detail-list"><div><dt>ایمیل</dt><dd dir="ltr">{user.email}</dd></div><div><dt>وضعیت</dt><dd><AdminStatusBadge tone={user.status === UserStatus.ACTIVE ? "success" : user.status === UserStatus.SUSPENDED ? "warning" : "neutral"}>{statusLabel}</AdminStatusBadge></dd></div><div><dt>کشور</dt><dd>{user.profile?.country || "—"}</dd></div><div><dt>شماره تلفن</dt><dd dir="ltr">{user.profile?.phone || "—"}</dd></div><div><dt>تاریخ ثبت‌نام</dt><dd>{user.createdAt.toLocaleString("fa-IR")}</dd></div><div><dt>نقش عمومی</dt><dd>کاربر</dd></div></dl>{session.permissions.includes("users.suspend") ? <AdminUserActions userId={user.id} status={user.status} /> : null}</article>
      <article className="admin-panel-card"><h3>خریدها و دسترسی‌ها</h3><AdminDataTable rows={user.orders} getRowKey={(row) => row.id} columns={[{ key: "title", label: "محصول", render: (row) => <span>{row.productTitleSnapshot}</span> }, { key: "status", label: "وضعیت", render: (row) => <span>{row.status}</span> }, { key: "date", label: "تاریخ", render: (row) => <span>{row.createdAt.toLocaleDateString("fa-IR")}</span> }]} empty={<p className="admin-table-empty">خریدی ثبت نشده است.</p>} /><div className="admin-detail-subsection"><h4>دسترسی‌ها</h4><AdminDataTable rows={user.entitlements} getRowKey={(row) => row.id} columns={[{ key: "product", label: "محصول", render: (row) => <span>{row.product.title}</span> }, { key: "status", label: "وضعیت", render: (row) => <span>{row.status}</span> }, { key: "sessions", label: "جلسات", render: (row) => <span>{row.totalSessions ?? "—"}</span> }]} empty={<p className="admin-table-empty">دسترسی‌ای ثبت نشده است.</p>} /></div></article></section>
    <section className="admin-panel-card"><h3>جلسات و نظرات اخیر</h3><div className="admin-detail-grid"><AdminDataTable rows={user.appointments} getRowKey={(row) => row.id} columns={[{ key: "product", label: "جلسه", render: (row) => <span>{row.product.title}</span> }, { key: "specialist", label: "متخصص", render: (row) => <span>{row.specialist?.displayName || "—"}</span> }, { key: "status", label: "وضعیت", render: (row) => <span>{row.status}</span> }, { key: "date", label: "زمان", render: (row) => <span>{row.startsAt.toLocaleString("fa-IR")}</span> }]} empty={<p className="admin-table-empty">جلسه‌ای ثبت نشده است.</p>} /><AdminDataTable rows={user.reviews} getRowKey={(row) => row.id} columns={[{ key: "product", label: "مرتبط با", render: (row) => <span>{row.product?.title || "—"}</span> }, { key: "status", label: "وضعیت", render: (row) => <span>{row.status}</span> }, { key: "body", label: "متن", render: (row) => <span className="admin-clamp-text">{row.body}</span> }]} empty={<p className="admin-table-empty">نظری ثبت نشده است.</p>} /></div></section>
  </div>;
}
