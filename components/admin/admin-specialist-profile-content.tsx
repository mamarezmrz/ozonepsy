"use client";

import { useMemo } from "react";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";
import type { SpecialistProfileSection } from "@/lib/specialist-profile";

export type SpecialistProfileContentValues = {
  profileSections?: SpecialistProfileSection[];
};

function initialSections(values: SpecialistProfileContentValues) {
  const sections = values.profileSections ?? [];
  return sections.length ? sections : [{ id: "draft-profile-section-1", title: "", description: "" }];
}

export function AdminSpecialistProfileContent({ values = {}, onChange }: { values?: SpecialistProfileContentValues; onChange?: (values: SpecialistProfileContentValues) => void }) {
  const sections = useMemo(() => initialSections(values), [values]);

  function updateSections(next: SpecialistProfileSection[]) {
    onChange?.({ ...values, profileSections: next });
  }

  function updateSection(id: string, update: Partial<SpecialistProfileSection>) {
    updateSections(sections.map((section) => section.id === id ? { ...section, ...update } : section));
  }

  function addSection() {
    updateSections([...sections, { id: crypto.randomUUID(), title: "", description: "" }]);
  }

  function removeSection(id: string) {
    if (sections.length <= 1) {
      dispatchAdminNotification("حداقل یک بخش محتوایی باید باقی بماند.", "error");
      return;
    }
    updateSections(sections.filter((section) => section.id !== id));
  }

  return (
    <section className="admin-specialist-profile-content">
      <div className="admin-section-heading">
        <div>
          <h2>محتوای صفحه عمومی متخصص</h2>
          <p>هر بخش صفحه را با یک عنوان و توضیحات کامل کنید. ترتیب بخش‌ها همان ترتیبی است که در صفحه متخصص نمایش داده می‌شود.</p>
        </div>
      </div>

      <input type="hidden" name="profileSections" value={JSON.stringify(sections)} />
      <div className="admin-specialist-profile-sections">
        {sections.map((section, index) => (
          <article className="admin-specialist-profile-section-card" key={section.id}>
            <div className="admin-specialist-profile-section-heading">
              <strong>بخش {index + 1}</strong>
              <button type="button" className="admin-specialist-profile-section-remove" aria-label={`حذف بخش ${index + 1}`} onClick={() => removeSection(section.id)}>× حذف بخش</button>
            </div>
            <div className="admin-specialist-profile-section-fields">
              <label className="admin-form-field"><span>عنوان بخش</span><input value={section.title} maxLength={240} placeholder="مثلاً درباره من" onChange={(event) => updateSection(section.id, { title: event.target.value })} /></label>
              <label className="admin-form-field"><span>توضیحات بخش</span><textarea value={section.description} maxLength={20000} rows={6} placeholder="متن این بخش را وارد کنید" onChange={(event) => updateSection(section.id, { description: event.target.value })} /></label>
            </div>
          </article>
        ))}
      </div>

      <button type="button" className="admin-button admin-button-secondary admin-specialist-profile-add-section" onClick={addSection}>+ افزودن بخش</button>
    </section>
  );
}
