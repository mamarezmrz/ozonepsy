import type { Metadata } from "next";
import { AdminConsultationBenefitsForm } from "@/components/admin/admin-consultation-benefits-form";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/admin-ui";
import { getAdminConsultationBenefits } from "@/lib/admin/consultation-benefits";
import { requireAdminPagePermission } from "@/lib/admin/page";

export const metadata: Metadata = { title: "مزایای حوزه‌های مشاوره" };

export default async function ConsultationBenefitsPage() {
  const session = await requireAdminPagePermission("content.read");
  const data = await getAdminConsultationBenefits();
  const canWrite = session.permissions.includes("content.write");

  return (
    <div className="admin-page-stack">
      <AdminPageHeader eyebrow="محتوای صفحات عمومی" title="مزایای حوزه‌های مشاوره" description="سکشن مزایا برای مشاوره فردی، زوج و رابطه، کودک و نوجوان و گروه درمانی را مدیریت کنید." />
      {!data.ready ? (
        <section className="admin-panel-card"><AdminEmptyState title="ساختار مزایا هنوز فعال نشده است" description={data.message} /></section>
      ) : (
        <section className="admin-panel-card"><AdminConsultationBenefitsForm initialSections={data.sections} readOnly={!canWrite} /></section>
      )}
    </div>
  );
}
