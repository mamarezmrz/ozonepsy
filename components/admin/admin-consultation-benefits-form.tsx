"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";
import type { AdminConsultationBenefitSection } from "@/lib/admin/consultation-benefits";

type EditableBenefit = AdminConsultationBenefitSection["benefits"][number];

function newBenefit(): EditableBenefit {
  return { id: crypto.randomUUID(), title: "", description: "", sortOrder: 0 };
}

export function AdminConsultationBenefitsForm({ initialSections, readOnly = false }: { initialSections: AdminConsultationBenefitSection[]; readOnly?: boolean }) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [pending, setPending] = useState(false);
  const [activePageKey, setActivePageKey] = useState(initialSections[0]?.pageKey ?? "individual");

  function updateSection(pageKey: string, update: Partial<AdminConsultationBenefitSection>) {
    setSections((current) => current.map((section) => section.pageKey === pageKey ? { ...section, ...update } : section));
  }

  function updateBenefit(pageKey: string, benefitId: string, update: Partial<EditableBenefit>) {
    setSections((current) => current.map((section) => section.pageKey === pageKey
      ? { ...section, benefits: section.benefits.map((benefit) => benefit.id === benefitId ? { ...benefit, ...update } : benefit) }
      : section));
  }

  function addBenefit(pageKey: string) {
    setSections((current) => current.map((section) => section.pageKey === pageKey ? { ...section, benefits: [...section.benefits, newBenefit()] } : section));
  }

  function removeBenefit(pageKey: string, benefitId: string) {
    setSections((current) => current.map((section) => section.pageKey === pageKey ? { ...section, benefits: section.benefits.filter((benefit) => benefit.id !== benefitId) } : section));
  }

  function validateRows() {
    for (const section of sections) {
      const hasRows = section.benefits.length > 0;
      const completeRows = section.benefits.filter((benefit) => benefit.title.trim() && benefit.description.trim());
      const partialRow = section.benefits.find((benefit) => Boolean(benefit.title.trim()) !== Boolean(benefit.description.trim()));
      if (partialRow) return `ردیف‌های بخش «${section.label}» باید عنوان و توضیحات کامل داشته باشند.`;
      if (section.enabled && hasRows && completeRows.length === 0) return `برای بخش «${section.label}» حداقل یک ردیف کامل وارد کنید؛ ردیف‌های خالی ذخیره نمی‌شوند.`;
    }
    return null;
  }

  async function save() {
    const validationError = validateRows();
    if (validationError) {
      dispatchAdminNotification(validationError, "error");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/admin/consultation-benefits", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sections: sections.map((section) => ({
            pageKey: section.pageKey,
            enabled: section.enabled,
            benefits: section.benefits.map(({ id, title, description }) => ({ id, title, description })),
          })),
        }),
      });
      const body = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !body.ok) {
        dispatchAdminNotification(body.message ?? "ذخیره تغییرات انجام نشد.", "error");
        return;
      }
      dispatchAdminNotification("تغییرات مزایا با موفقیت ذخیره شد.");
      router.refresh();
    } catch {
      dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-consultation-benefits-form">
      <div className="admin-form-notice" role="status">ردیف‌های نیمه‌کاره ذخیره نمی‌شوند. ردیف کاملاً خالی هنگام ذخیره نادیده گرفته می‌شود و فقط ردیف‌های کامل به‌صورت کارت عمومی نمایش داده می‌شوند.</div>
      <div className="admin-consultation-benefits-tabs" role="tablist" aria-label="حوزه‌های مشاوره">
        {sections.map((section) => {
          const isActive = activePageKey === section.pageKey;
          return <button key={section.pageKey} id={`benefits-tab-${section.pageKey}`} type="button" role="tab" aria-selected={isActive} aria-controls={`benefits-panel-${section.pageKey}`} className={`admin-consultation-benefits-tab${isActive ? " is-active" : ""}`} onClick={() => setActivePageKey(section.pageKey)}>{section.label}</button>;
        })}
      </div>
      {sections.map((section) => (
        activePageKey === section.pageKey ? <section key={section.pageKey} id={`benefits-panel-${section.pageKey}`} className="admin-consultation-benefits-section" role="tabpanel" tabIndex={-1} aria-labelledby={`benefits-tab-${section.pageKey}`}>
          <div className="admin-section-heading admin-consultation-benefits-heading">
            <div>
              <h2 id={`benefits-${section.pageKey}-title`}>{section.label}</h2>
              <p>مزایایی که در صفحه عمومی این حوزه نمایش داده می‌شوند.</p>
            </div>
            <label className="admin-toggle">
              <input type="checkbox" checked={section.enabled} disabled={readOnly || pending} onChange={(event) => updateSection(section.pageKey, { enabled: event.target.checked })} />
              <span>{section.enabled ? "نمایش سکشن" : "سکشن خاموش"}</span>
            </label>
          </div>

          <div className="admin-consultation-benefit-rows">
            {section.benefits.map((benefit, index) => (
              <div key={benefit.id} className="admin-consultation-benefit-row">
                <label className="admin-form-field"><span>عنوان ردیف {index + 1}</span><input value={benefit.title} maxLength={240} disabled={readOnly || pending} onChange={(event) => updateBenefit(section.pageKey, benefit.id, { title: event.target.value })} /></label>
                <label className="admin-form-field"><span>توضیحات ردیف {index + 1}</span><textarea value={benefit.description} maxLength={4000} disabled={readOnly || pending} onChange={(event) => updateBenefit(section.pageKey, benefit.id, { description: event.target.value })} /></label>
                {!readOnly ? <button type="button" className="admin-icon-button" aria-label={`حذف ردیف ${index + 1} از ${section.label}`} disabled={pending} onClick={() => removeBenefit(section.pageKey, benefit.id)}>×</button> : null}
              </div>
            ))}
          </div>

          {!readOnly ? <button type="button" className="admin-button admin-button-secondary admin-consultation-benefit-add" disabled={pending} onClick={() => addBenefit(section.pageKey)}>+ افزودن ردیف</button> : null}
        </section> : null
      ))}

      {!readOnly ? <div className="admin-form-actions"><button type="button" className="admin-button admin-button-primary" disabled={pending} onClick={() => void save()}>{pending ? "در حال ذخیره…" : "ذخیره تغییرات"}</button></div> : null}
    </div>
  );
}
