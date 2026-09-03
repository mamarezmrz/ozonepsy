import type { Metadata } from "next";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminIndividualConsultationCasesForm } from "@/components/admin/admin-individual-consultation-cases-form";
import { getAdminIndividualConsultationCases, parseConsultationCasesPageKey } from "@/lib/admin/individual-consultation-content";
import { requireAdminPagePermission } from "@/lib/admin/page";

export const metadata: Metadata = { title: "مشکلات حوزه‌های مشاوره" };

export default async function IndividualConsultationIssuesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPagePermission("content.read");
  const data = await getAdminIndividualConsultationCases();
  const canWrite = session.permissions.includes("content.write");
  const params = await searchParams;
  const tab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const draftSlug = Array.isArray(params.draftSlug) ? params.draftSlug[0] : params.draftSlug;
  const draftTitle = Array.isArray(params.draftTitle) ? params.draftTitle[0] : params.draftTitle;
  const pendingCase = draftSlug && draftTitle ? { pageKey: parseConsultationCasesPageKey(tab), slug: draftSlug, title: draftTitle } : undefined;

  return (
    <div className="admin-page-stack">
      <AdminPageHeader eyebrow="محتوای صفحات عمومی" title="مشکلات حوزه‌های مشاوره" description="عنوان و توضیحات سکشن و کارت‌های لینک‌شده به چهار حوزه‌ی مشاوره را مدیریت کنید." />
      {!data[0]?.ready ? <section className="admin-panel-card"><AdminEmptyState title="ساختار محتوای مشکلات هنوز فعال نشده است" description={data[0]?.message} /></section> : <section className="admin-panel-card"><AdminIndividualConsultationCasesForm initialSections={data} initialActivePageKey={parseConsultationCasesPageKey(tab)} pendingCase={pendingCase} readOnly={!canWrite} /></section>}
    </div>
  );
}
