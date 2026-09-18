import type { Metadata } from "next";
import Link from "next/link";
import { AdminDataTable, AdminEmptyState, AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";
import { getTherapistServices } from "@/lib/therapist/dashboard";
import { ProductStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "خدمات متخصص", robots: { index: false, follow: false } };

export default async function TherapistServicesPage() {
  const data = await getTherapistServices();
  const rows = [...data.consultations.map((service) => ({ ...service, serviceType: "مشاوره فردی", detail: `${service.durationMinutes} دقیقه`, href: "/pricing" })), ...data.courses.map((service) => ({ ...service, serviceType: "دوره", detail: "دوره آموزشی", href: `/courses/${service.slug}` }))];
  return <div className="admin-page-stack"><AdminPageHeader eyebrow="فقط قابل مشاهده" title="خدمات من" description="این صفحه برای مشاهده‌ی خدماتی است که به شما تخصیص داده شده؛ ویرایش محصولات فقط از پنل مدیریت انجام می‌شود." /><section className="admin-panel-card"><AdminDataTable rows={rows} getRowKey={(row) => row.id} columns={[
    { key: "title", label: "عنوان", render: (row) => <span>{row.title}</span> },
    { key: "type", label: "نوع", render: (row) => <span>{row.serviceType}</span> },
    { key: "detail", label: "جزئیات", render: (row) => <span>{row.detail}</span> },
    { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={row.status === ProductStatus.PUBLISHED ? "success" : "neutral"}>{row.status === ProductStatus.PUBLISHED ? "منتشرشده" : "غیرفعال"}</AdminStatusBadge> },
    { key: "public", label: "نمایش عمومی", render: (row) => row.status === ProductStatus.PUBLISHED ? <Link href={row.href} className="admin-table-link">مشاهده سایت</Link> : <span>—</span> },
  ]} empty={<AdminEmptyState title="خدمتی به شما تخصیص داده نشده است" description="تخصیص مشاوره یا دوره از پنل مدیریت انجام می‌شود." />} /></section></div>;
}
