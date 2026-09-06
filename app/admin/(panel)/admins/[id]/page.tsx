import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminRoleForm } from "@/components/admin/admin-role-form";
import { AdminButton, AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { getAdminUser } from "@/lib/admin/admins";
import { ADMIN_ROLE_LABELS, type AdminRole } from "@/lib/admin/constants";
import { UserStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "جزئیات ادمین" };

export default async function AdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPagePermission("admins.manage");
  let admin;
  try { admin = await getAdminUser((await params).id, session); } catch { notFound(); }
  const role = admin.roles[0] as AdminRole | undefined;
  return <div className="admin-page-stack">
    <AdminPageHeader eyebrow="مدیریت ادمین‌ها" title={admin.name} description={admin.email} action={<AdminButton href="/admins" variant="secondary">بازگشت</AdminButton>} />
    <section className="admin-panel-card"><dl className="admin-detail-list"><div><dt>ایمیل</dt><dd dir="ltr">{admin.email}</dd></div><div><dt>نقش</dt><dd>{admin.roles.map((item) => ADMIN_ROLE_LABELS[item as AdminRole] ?? item).join("، ")}</dd></div><div><dt>وضعیت</dt><dd><AdminStatusBadge tone={admin.status === UserStatus.ACTIVE ? "success" : "danger"}>{admin.status === UserStatus.ACTIVE ? "فعال" : "غیرفعال"}</AdminStatusBadge></dd></div><div><dt>تاریخ ایجاد</dt><dd>{admin.createdAt.toLocaleString("fa-IR")}</dd></div></dl>
      {role ? <AdminRoleForm adminId={admin.id} currentRole={role} /> : null}
      <div className="admin-form-actions">{admin.status === UserStatus.ACTIVE ? <AdminActionButton action={`/api/admin/admins/${admin.id}`} method="PATCH" body={{ status: "SUSPENDED" }} reasonRequired label="غیرفعال‌سازی" variant="danger" confirm="این ادمین غیرفعال شود؟" /> : <AdminActionButton action={`/api/admin/admins/${admin.id}`} method="PATCH" body={{ status: "ACTIVE" }} reasonRequired label="فعال‌سازی مجدد" />}</div>
    </section>
    <section className="admin-panel-card"><h2>نشست‌های فعال</h2>{admin.adminSessions.length ? <ul className="admin-activity-list">{admin.adminSessions.map((item) => <li key={item.id}><span>{item.lastSeenAt.toLocaleString("fa-IR")}</span><small dir="ltr">{item.ipAddress ?? "—"}</small></li>)}</ul> : <p className="admin-table-empty">نشست فعال وجود ندارد.</p>}</section>
  </div>;
}
