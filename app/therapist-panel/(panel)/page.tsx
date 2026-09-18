import type { Metadata } from "next";
import Link from "next/link";
import { AdminDataTable, AdminEmptyState, AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";
import { getTherapistOverview } from "@/lib/therapist/dashboard";
import { AppointmentStatus, ProductStatus, ReviewStatus, UserStatus } from "@/lib/generated/prisma/enums";
import { formatPersianNumber } from "@/lib/format";

export const metadata: Metadata = { title: "نمای کلی متخصص", robots: { index: false, follow: false } };

const appointmentStatusLabel: Record<AppointmentStatus, string> = { SCHEDULED: "برنامه‌ریزی‌شده", RESCHEDULED: "تغییر زمان", COMPLETED: "برگزارشده", CANCELED: "لغوشده", NO_SHOW: "عدم حضور" };
const reviewStatusLabel: Record<ReviewStatus, string> = { PENDING: "در انتظار بررسی", PUBLISHED: "منتشرشده", HIDDEN: "پنهان‌شده" };

function appointmentTone(status: AppointmentStatus) {
  return status === AppointmentStatus.COMPLETED ? "success" as const : status === AppointmentStatus.CANCELED || status === AppointmentStatus.NO_SHOW ? "danger" as const : status === AppointmentStatus.RESCHEDULED ? "warning" as const : "info" as const;
}

export default async function TherapistPanelPage() {
  const data = await getTherapistOverview();
  return <div className="admin-page-stack therapist-dashboard-page">
    <AdminPageHeader eyebrow="داشبورد متخصص" title="نمای کلی" description="خلاصه‌ای از مراجعان، جلسات و خدماتی که به حساب شما مربوط است." />
    <section className="admin-metric-grid therapist-metric-grid" aria-label="شاخص‌های پنل متخصص">
      {data.metrics.map((metric) => <article key={metric.label} className="admin-metric-card"><span>{metric.label}</span><strong>{formatPersianNumber(metric.value)}</strong></article>)}
    </section>

    <section className="admin-panel-card">
      <div className="admin-section-heading"><h3>جلسات آینده</h3><Link href="/therapist-panel/sessions" className="admin-button admin-button-secondary">همه جلسات</Link></div>
      <AdminDataTable rows={data.upcoming} getRowKey={(row) => row.id} columns={[
        { key: "product", label: "خدمت", render: (row) => <span>{row.product.title}</span> },
        { key: "client", label: "مراجع", render: (row) => <span>{row.user.profile?.displayName || row.user.email}</span> },
        { key: "time", label: "زمان", render: (row) => <time dateTime={row.startsAt.toISOString()}>{row.startsAt.toLocaleString("fa-IR-u-ca-gregory", { dateStyle: "medium", timeStyle: "short" })}</time> },
        { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={appointmentTone(row.status)}>{appointmentStatusLabel[row.status]}</AdminStatusBadge> },
      ]} empty={<AdminEmptyState title="جلسه آینده‌ای ندارید" description="جلساتی که مستقیماً به شما تخصیص داده شوند، در این بخش دیده می‌شوند." />} />
    </section>

    <div className="admin-dashboard-grid therapist-dashboard-grid">
      <section className="admin-panel-card"><div className="admin-section-heading"><h3>خدمات من</h3><Link href="/therapist-panel/services" className="admin-button admin-button-secondary">مشاهده خدمات</Link></div>{data.services.length ? <ul className="therapist-summary-list">{data.services.slice(0, 5).map((service) => <li key={service.id}><span>{service.title}</span><AdminStatusBadge tone={service.status === ProductStatus.PUBLISHED ? "success" : "neutral"}>{service.kind === "COURSE" ? "دوره" : "مشاوره فردی"}</AdminStatusBadge></li>)}</ul> : <AdminEmptyState title="خدمتی تخصیص داده نشده است" description="خدماتی که توسط مدیریت به شما تخصیص داده شوند در اینجا نمایش داده می‌شوند." />}</section>
      <section className="admin-panel-card"><div className="admin-section-heading"><h3>بازخوردهای اخیر</h3><Link href="/therapist-panel/reviews" className="admin-button admin-button-secondary">مشاهده بازخوردها</Link></div>{data.recentReviews.length ? <ul className="therapist-summary-list therapist-review-summary">{data.recentReviews.map((review) => <li key={review.id}><span className="admin-clamp-text" title={review.body}>{review.body}</span><small>{review.product?.title || "خدمت"} · {reviewStatusLabel[review.status]}</small></li>)}</ul> : <AdminEmptyState title="بازخوردی ثبت نشده است" description="بازخوردهای مربوط به خدمات شما در این بخش دیده می‌شوند." />}</section>
    </div>

    <section className="admin-panel-card"><div className="admin-section-heading"><h3>مراجعان من</h3><Link href="/therapist-panel/clients" className="admin-button admin-button-secondary">مشاهده مراجعان</Link></div>{data.clients.length ? <AdminDataTable rows={data.clients.slice(0, 5)} getRowKey={(row) => row.id} columns={[{ key: "name", label: "نام", render: (row) => <span>{row.name}</span> }, { key: "sessions", label: "جلسات", render: (row) => <span>{formatPersianNumber(row.appointmentCount)}</span> }, { key: "remaining", label: "باقی‌مانده", render: (row) => <span>{row.remainingSessions === null ? "—" : formatPersianNumber(row.remainingSessions)}</span> }, { key: "next", label: "جلسه بعدی", render: (row) => row.nextAppointment ? <time dateTime={row.nextAppointment.toISOString()}>{row.nextAppointment.toLocaleString("fa-IR-u-ca-gregory", { dateStyle: "medium", timeStyle: "short" })}</time> : <span>—</span> }, { key: "status", label: "حساب", render: (row) => <AdminStatusBadge tone={row.status === UserStatus.ACTIVE ? "success" : "warning"}>{row.status === UserStatus.ACTIVE ? "فعال" : "غیرفعال"}</AdminStatusBadge> }]} /> : <AdminEmptyState title="مراجعی ندارید" description="مراجعان از روی جلسات تخصیص‌یافته و دسترسی‌های خدمات خودکار شناسایی می‌شوند." />}</section>
  </div>;
}
