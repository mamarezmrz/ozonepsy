import type { Metadata } from "next";
import { AdminPageHeader, AdminStatusBadge, AdminButton } from "@/components/admin/admin-ui";
import { AdminIndividualConsultationTopicForm } from "@/components/admin/admin-individual-consultation-topic-form";
import { getAdminIndividualConsultationTopic, parseConsultationCasesPageKey } from "@/lib/admin/individual-consultation-content";
import { requireAdminPagePermission } from "@/lib/admin/page";

export const metadata: Metadata = { title: "ویرایش محتوای صفحه مشاوره" };

const consultationAreaLabels = {
  individual: "مشاوره فردی",
  couples: "زوج و رابطه",
  teenagers: "کودک و نوجوان",
  "group-therapy": "گروه درمانی",
} as const;

export default async function IndividualConsultationTopicPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ pageKey?: string | string[]; cardTitle?: string | string[] }> }) {
  const session = await requireAdminPagePermission("content.read");
  const { slug } = await params;
  const query = await searchParams;
  const pageKey = parseConsultationCasesPageKey(Array.isArray(query.pageKey) ? query.pageKey[0] : query.pageKey);
  const cardTitle = Array.isArray(query.cardTitle) ? query.cardTitle[0] : query.cardTitle;
  const data = await getAdminIndividualConsultationTopic(slug, pageKey);
  const canWrite = session.permissions.includes("content.write");
  const statusLabel = data.status === "ARCHIVED" ? "بایگانی" : data.status === "DRAFT" ? "پیش‌نویس" : "منتشرشده";
  const areaLabel = consultationAreaLabels[pageKey];
  const pageLabel = data.title.trim() || cardTitle?.trim() || slug;

  return (
    <div className={`admin-page-stack${data.ready ? " admin-topic-editor-page" : ""}`}>
      <AdminPageHeader eyebrow={`محتوای حوزه‌های مشاوره / ${areaLabel}`} title={data.title || "صفحه‌ی جدید"} description={`در حال ویرایش صفحه «${pageLabel}» از حوزه «${areaLabel}» با اسلاگ ${slug}.`} action={<AdminButton href="/consultation-issues" variant="secondary">بازگشت به کارت‌ها</AdminButton>} />
      {!data.ready ? <section className="admin-panel-card"><p className="admin-muted-copy">{data.message}</p></section> : <section className="admin-panel-card admin-topic-editor-panel"><div className="admin-topic-editor-context" aria-label="محدوده صفحه در حال ویرایش"><div><span>حوزه</span><strong>{areaLabel}</strong></div><div><span>صفحه</span><strong>{pageLabel}</strong></div><code dir="ltr">/{slug}</code></div><div className="admin-section-heading"><h2>وضعیت صفحه</h2><AdminStatusBadge tone={data.status === "PUBLISHED" ? "success" : data.status === "DRAFT" ? "warning" : "neutral"}>{statusLabel}</AdminStatusBadge></div><AdminIndividualConsultationTopicForm initial={data} returnCardTitle={cardTitle} readOnly={!canWrite} /></section>}
    </div>
  );
}
