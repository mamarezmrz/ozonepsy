import type { Metadata } from "next";
import { AdminButton, AdminDataTable, AdminStatusBadge } from "@/components/admin/admin-ui";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { getAdminDashboardData } from "@/lib/admin/dashboard";
import { formatPersianNumber, toPersianDigits } from "@/lib/format";
import { AppointmentStatus, OrderStatus, UserStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "نمای کلی" };

export default async function AdminOverviewPage() {
  const session = await requireAdminPagePermission("dashboard.view");
  const data = await getAdminDashboardData(session);

  return (
    <div className="admin-page-stack">
      <section className="admin-metric-grid admin-overview-metrics" aria-label="شاخص‌های اصلی سیستم">
        {data.metrics.map((metric) => (
          <article key={metric.label} className="admin-metric-card">
            <span>{metric.label}</span>
            <strong>{formatPersianNumber(metric.value)}</strong>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-panel-card">
          <div className="admin-section-heading"><h3>ثبت‌نام‌های اخیر</h3>{session.permissions.includes("users.read") ? <AdminButton href="/users" variant="secondary">همه کاربران</AdminButton> : null}</div>
          <AdminDataTable
            rows={data.recentUsers}
            getRowKey={(row) => row.id}
            columns={[
              { key: "name", label: "نام", render: (row) => <span>{row.name}</span> },
              { key: "email", label: "ایمیل", render: (row) => <span dir="ltr">{row.email}</span> },
              { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={row.status === UserStatus.ACTIVE ? "success" : row.status === UserStatus.SUSPENDED ? "warning" : "neutral"}>{row.status === UserStatus.ACTIVE ? "فعال" : row.status === UserStatus.SUSPENDED ? "تعلیق‌شده" : "بایگانی"}</AdminStatusBadge> },
              { key: "createdAt", label: "تاریخ", render: (row) => <span>{row.createdAt.toLocaleDateString("fa-IR")}</span> },
            ]}
            empty={<p className="admin-table-empty">هنوز کاربر عمومی ثبت نشده است.</p>}
          />
        </article>

        <article className="admin-panel-card">
          <div className="admin-section-heading"><h3>جلسات آینده</h3>{session.permissions.includes("sessions.read") ? <AdminButton href="/sessions" variant="secondary">همه جلسات</AdminButton> : null}</div>
          <AdminDataTable
            rows={data.upcomingSessions}
            getRowKey={(row) => row.id}
            columns={[
              { key: "title", label: "جلسه", render: (row) => <span>{row.title}</span> },
              { key: "email", label: "کاربر", render: (row) => <span dir="ltr">{row.email}</span> },
              { key: "startsAt", label: "زمان", render: (row) => <span>{row.startsAt.toLocaleString("fa-IR")}</span> },
              { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={row.status === AppointmentStatus.RESCHEDULED ? "warning" : "info"}>{row.status === AppointmentStatus.RESCHEDULED ? "تغییرزمان‌یافته" : "برنامه‌ریزی‌شده"}</AdminStatusBadge> },
            ]}
            empty={<p className="admin-table-empty">جلسه آینده‌ای ثبت نشده است.</p>}
          />
        </article>
      </section>

      {data.recentOrders.length > 0 ? <section className="admin-panel-card"><div className="admin-section-heading"><h3>سفارش‌های اخیر</h3></div><AdminDataTable rows={data.recentOrders} getRowKey={(row) => row.id} columns={[
        { key: "orderNumber", label: "شماره سفارش", render: (row) => <span dir="ltr">{row.orderNumber}</span> },
        { key: "title", label: "محصول", render: (row) => <span>{row.title}</span> },
        { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={row.status === OrderStatus.PAID ? "success" : "neutral"}>{row.status}</AdminStatusBadge> },
        { key: "total", label: "مبلغ", render: (row) => <span dir="ltr">{toPersianDigits(`${(row.totalMinor / 100).toFixed(2)} ${row.currency}`)}</span> },
      ]} /></section> : null}
    </div>
  );
}
