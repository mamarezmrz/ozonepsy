"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";
import type { AdminIndividualConsultationCase, AdminIndividualConsultationSection, ConsultationCasesPageKey } from "@/lib/admin/individual-consultation-content";

type EditableCase = AdminIndividualConsultationCase;

function newCase(): EditableCase {
  return { id: crypto.randomUUID(), title: "", slug: "", sortOrder: 0, contentReady: false };
}

function completeCases(section: AdminIndividualConsultationSection) {
  return section.cases.filter((item) => item.title.trim() && item.slug.trim());
}

function cleanSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function mergePendingCase(initialSections: AdminIndividualConsultationSection[], pendingCase?: { pageKey: ConsultationCasesPageKey; title: string; slug: string }) {
  if (!pendingCase?.title.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pendingCase.slug.trim())) return initialSections;
  return initialSections.map((section) => {
    if (section.pageKey !== pendingCase.pageKey) return section;
    const existing = section.cases.find((item) => item.slug === pendingCase.slug);
    if (existing) return { ...section, cases: section.cases.map((item) => item.id === existing.id ? { ...item, title: pendingCase.title, contentReady: true } : item) };
    return { ...section, cases: [...section.cases, { id: `pending-${pendingCase.slug}`, title: pendingCase.title, slug: pendingCase.slug, sortOrder: section.cases.length, contentReady: true }] };
  });
}

export function AdminIndividualConsultationCasesForm({ initialSections, initialActivePageKey = "individual", pendingCase, readOnly = false }: { initialSections: AdminIndividualConsultationSection[]; initialActivePageKey?: ConsultationCasesPageKey; pendingCase?: { pageKey: ConsultationCasesPageKey; title: string; slug: string }; readOnly?: boolean }) {
  const router = useRouter();
  const [sections, setSections] = useState(() => mergePendingCase(initialSections, pendingCase));
  const [pending, setPending] = useState(false);
  const [activePageKey, setActivePageKey] = useState<ConsultationCasesPageKey>(initialActivePageKey);

  function updateSection(pageKey: ConsultationCasesPageKey, update: Partial<AdminIndividualConsultationSection>) {
    setSections((current) => current.map((section) => section.pageKey === pageKey ? { ...section, ...update } : section));
  }

  function updateCase(pageKey: ConsultationCasesPageKey, id: string, update: Partial<EditableCase>) {
    setSections((current) => current.map((section) => section.pageKey === pageKey ? { ...section, cases: section.cases.map((item) => item.id === id ? { ...item, ...update, contentReady: "slug" in update ? false : item.contentReady } : item) } : section));
  }

  function addCase(pageKey: ConsultationCasesPageKey) {
    setSections((current) => current.map((section) => section.pageKey === pageKey ? { ...section, cases: [...section.cases, newCase()] } : section));
  }

  function apiCase(item: EditableCase) {
    return { ...(isUuid(item.id) ? { id: item.id } : {}), title: item.title, slug: item.slug };
  }

  function removeCase(pageKey: ConsultationCasesPageKey, id: string) {
    setSections((current) => current.map((section) => {
      if (section.pageKey !== pageKey) return section;
      const cases = section.cases.filter((item) => item.id !== id);
      return { ...section, cases, enabled: section.enabled && completeCases({ ...section, cases }).length > 0 };
    }));
  }

  function validate() {
    const slugs: string[] = [];
    for (const section of sections) {
      if (!section.title.trim() || !section.description.trim()) return `عنوان و توضیحات سکشن «${section.label}» را کامل کنید.`;
      const active = section.cases.filter((item) => item.title.trim() || item.slug.trim());
      const partial = active.find((item) => !item.title.trim() || !item.slug.trim());
      if (partial) return `هر ردیف در سکشن «${section.label}» باید عنوان کارت و اسلاگ صفحه را کامل داشته باشد.`;
      const invalidSlug = active.find((item) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug.trim()));
      if (invalidSlug) return "اسلاگ فقط باید شامل حروف انگلیسی کوچک، عدد و خط تیره باشد.";
      if (new Set(active.map((item) => item.slug.trim())).size !== active.length) return `اسلاگ کارت‌های «${section.label}» باید یکتا باشد.`;
      slugs.push(...active.map((item) => item.slug.trim()));
      if (section.enabled && active.length === 0) return `برای سکشن فعال «${section.label}» حداقل یک کارت کامل وارد کنید.`;
      if (section.enabled && !completeCases(section).some((item) => item.contentReady)) return `برای نمایش سکشن «${section.label}» حداقل یک کارت باید محتوای کامل داشته باشد.`;
    }
    if (new Set(slugs).size !== slugs.length) return "اسلاگ کارت‌ها در هر چهار حوزه باید یکتا باشد.";
    return null;
  }

  async function save() {
    const error = validate();
    if (error) {
      dispatchAdminNotification(error, "error");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/admin/consultation-issues", { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ sections: sections.map((section) => ({ pageKey: section.pageKey, title: section.title, description: section.description, enabled: section.enabled, cases: section.cases.map(apiCase) })) }) });
      const body = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !body.ok) {
        dispatchAdminNotification(body.message ?? "ذخیره تغییرات انجام نشد.", "error");
        return;
      }
      dispatchAdminNotification("سکشن‌های مشکلات مشاوره با موفقیت ذخیره شدند.");
      router.refresh();
    } catch {
      dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error");
    } finally {
      setPending(false);
    }
  }

  const activeSection = sections.find((section) => section.pageKey === activePageKey) ?? sections[0];
  if (!activeSection) return null;
  const activeCompleteCases = completeCases(activeSection);
  const canEnableActiveSection = activeCompleteCases.length > 0;
  const canSave = sections.every((section) => section.title.trim() && section.description.trim() && (!section.enabled || completeCases(section).some((item) => item.contentReady)));

  return (
    <div className="admin-individual-consultation-form">
      <div className="admin-form-notice" role="status">از هر تب، کارت‌ها و محتوای کامل صفحات همان حوزه را مدیریت کنید. تغییرات این بخش از مسیر امن پنل ذخیره می‌شوند.</div>
      <div className="admin-consultation-benefits-tabs" role="tablist" aria-label="حوزه‌های مشکلات مشاوره">
        {sections.map((section) => {
          const isActive = activeSection.pageKey === section.pageKey;
          return <button key={section.pageKey} id={`cases-tab-${section.pageKey}`} type="button" role="tab" aria-selected={isActive} aria-controls={`cases-panel-${section.pageKey}`} className={`admin-consultation-benefits-tab${isActive ? " is-active" : ""}`} onClick={() => setActivePageKey(section.pageKey)}>{section.label}</button>;
        })}
      </div>

      <section id={`cases-panel-${activeSection.pageKey}`} className="admin-consultation-benefits-section" role="tabpanel" tabIndex={-1} aria-labelledby={`cases-tab-${activeSection.pageKey}`}>
        <div className="admin-section-heading admin-consultation-benefits-heading">
          <div><h2>{activeSection.label}</h2><p>عنوان، توضیحات و کارت‌های سکشن این حوزه را مدیریت کنید.</p></div>
          <label className={`admin-toggle${!canEnableActiveSection ? " is-disabled" : ""}`}><input type="checkbox" checked={activeSection.enabled && canEnableActiveSection} disabled={readOnly || pending || !canEnableActiveSection} onChange={(event) => updateSection(activeSection.pageKey, { enabled: event.target.checked })} /><span>{canEnableActiveSection ? (activeSection.enabled ? "نمایش سکشن" : "سکشن خاموش") : "برای نمایش، کارت اضافه کنید"}</span></label>
        </div>
        <div className="admin-individual-consultation-section-fields">
          <label className="admin-form-field"><span>عنوان سکشن</span><input value={activeSection.title} maxLength={240} disabled={readOnly || pending} onChange={(event) => updateSection(activeSection.pageKey, { title: event.target.value })} /></label>
          <label className="admin-form-field"><span>توضیحات سکشن</span><textarea value={activeSection.description} maxLength={4000} disabled={readOnly || pending} onChange={(event) => updateSection(activeSection.pageKey, { description: event.target.value })} /></label>
        </div>
        <div className="admin-individual-consultation-case-rows">
          {activeSection.cases.map((item, index) => (
            <div className="admin-individual-consultation-case-row" key={item.id}>
              <label className="admin-form-field"><span>عنوان کارت {index + 1}</span><input value={item.title} maxLength={240} disabled={readOnly || pending} onChange={(event) => updateCase(activeSection.pageKey, item.id, { title: event.target.value })} /></label>
              <label className="admin-form-field"><span>اسلاگ صفحه</span><input dir="ltr" value={item.slug} maxLength={160} placeholder="anxiety-disorders" disabled={readOnly || pending} onChange={(event) => updateCase(activeSection.pageKey, item.id, { slug: cleanSlug(event.target.value) })} /></label>
              <div className="admin-individual-consultation-case-actions">{item.title.trim() && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug.trim()) ? <Link className="admin-inline-action" href={`/consultation-issues/${encodeURIComponent(item.slug)}?pageKey=${encodeURIComponent(activeSection.pageKey)}&cardTitle=${encodeURIComponent(item.title)}`}>ویرایش محتوا</Link> : <button type="button" className="admin-inline-action admin-inline-action-disabled" disabled title="ابتدا عنوان و اسلاگ انگلیسی را کامل کنید">ویرایش محتوا</button>}{!readOnly ? <button type="button" className="admin-icon-button" aria-label={`حذف کارت ${index + 1}`} disabled={pending} onClick={() => removeCase(activeSection.pageKey, item.id)}>×</button> : null}</div>
            </div>
          ))}
        </div>
        {!readOnly ? <div className="admin-form-actions"><button type="button" className="admin-button admin-button-secondary" disabled={pending} onClick={() => addCase(activeSection.pageKey)}>+ افزودن کارت</button></div> : null}
      </section>

      {!readOnly ? <div className="admin-form-actions"><button type="button" className="admin-button admin-button-primary" disabled={pending || !canSave} title={!canSave ? "عنوان و توضیحات و حداقل یک کارت با محتوای کامل برای سکشن فعال لازم است." : undefined} onClick={() => void save()}>{pending ? "در حال ذخیره…" : "ذخیره تغییرات"}</button></div> : null}
    </div>
  );
}
