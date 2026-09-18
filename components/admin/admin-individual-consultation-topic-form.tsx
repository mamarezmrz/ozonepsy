"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";
import type { AdminIndividualConsultationTopic } from "@/lib/admin/individual-consultation-content";

/* Preview URLs may point to the public media endpoint. */
/* eslint-disable @next/next/no-img-element */

type TopicState = AdminIndividualConsultationTopic;

function lines(value: string[]) {
  return value.join("\n");
}

function parseLines(value: string) {
  // Keep the in-progress line exactly as typed. Trimming here would remove
  // the trailing space after a word on every keystroke and make normal typing
  // in controlled textareas impossible. Server-side normalization handles
  // empty lines and surrounding whitespace when the form is saved.
  return value.split(/\r?\n/);
}

type TopicImageMode = TopicState["imageMode"];

type CoreSectionKey = "signs" | "why" | "whenToGetHelp" | "whatHelps" | "approach";

const coreSectionKeys: CoreSectionKey[] = ["signs", "why", "whenToGetHelp", "whatHelps", "approach"];
const coreSectionLabels: Record<CoreSectionKey, string> = {
  signs: "نشانه‌های رایج",
  why: "چرا پیش می‌آید؟",
  whenToGetHelp: "چه زمانی لازم است کمک بگیرم؟",
  whatHelps: "چه کارهایی معمولاً کمک می‌کند؟",
  approach: "اُزون چگونه به تو کمک می‌کند؟",
};

function hasText(value: string | string[]) {
  return Array.isArray(value) ? value.some((item) => item.trim()) : Boolean(value.trim());
}

function hasCoreSectionContent(topic: TopicState, key: CoreSectionKey) {
  switch (key) {
    case "signs": return hasText(topic.signsTitle) || hasText(topic.signs) || hasText(topic.signsNote);
    case "why": return hasText(topic.whyTitle) || hasText(topic.why);
    case "whenToGetHelp": return hasText(topic.whenToGetHelpTitle) || hasText(topic.whenToGetHelp);
    case "whatHelps": return hasText(topic.whatHelpsTitle) || hasText(topic.whatHelps);
    case "approach": return hasText(topic.approachTitle) || hasText(topic.approachParagraphs) || hasText(topic.approach);
  }
}

function editableSectionCount(topic: TopicState) {
  const coreCount = coreSectionKeys.filter((key) => hasCoreSectionContent(topic, key)).length;
  const customCount = topic.customSections.filter((section) => section.title.trim() || section.description.trim()).length;
  return coreCount + customCount;
}

function hasHeroBranding(mode: TopicImageMode) {
  return !mode.endsWith("-no-branding");
}

function withHeroBranding(mode: TopicImageMode, enabled: boolean): TopicImageMode {
  const base = mode.startsWith("normal") ? "normal" : "multiply";
  return `${base}${enabled ? "" : "-no-branding"}` as TopicImageMode;
}

export function AdminIndividualConsultationTopicForm({ initial, returnCardTitle, readOnly = false }: { initial: TopicState; returnCardTitle?: string; readOnly?: boolean }) {
  const router = useRouter();
  const [topic, setTopic] = useState(initial);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);

  function update(update: Partial<TopicState>) {
    setTopic((current) => ({ ...current, ...update }));
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("visibility", "PUBLIC");
      const response = await fetch("/api/admin/media", { method: "POST", credentials: "same-origin", body: form });
      const body = await response.json() as { ok?: boolean; message?: string; data?: { id: string } };
      if (!response.ok || !body.ok || !body.data?.id) {
        dispatchAdminNotification(body.message ?? "بارگذاری تصویر انجام نشد.", "error");
        return;
      }
      update({ heroMediaId: body.data.id, heroImageRemoved: false, heroImageUrl: `/api/admin/media/${body.data.id}/preview` });
      dispatchAdminNotification("تصویر بارگذاری شد؛ برای اتصال آن به صفحه، تغییرات را ذخیره کنید.");
    } catch {
      dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setPending(true);
    try {
      const response = await fetch(`/api/admin/consultation-issues/${encodeURIComponent(topic.slug)}?pageKey=${encodeURIComponent(topic.pageKey)}`, { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: topic.title, description: topic.description, introList: topic.introList, signsTitle: topic.signsTitle, signs: topic.signs, signsNote: topic.signsNote, why: topic.why, whyTitle: topic.whyTitle, whenToGetHelpTitle: topic.whenToGetHelpTitle, whenToGetHelp: topic.whenToGetHelp, whatHelpsTitle: topic.whatHelpsTitle, whatHelps: topic.whatHelps, approachTitle: topic.approachTitle, approachParagraphs: topic.approachParagraphs, approach: topic.approach, customSections: topic.customSections, hideShortQuestions: topic.hideShortQuestions, shortQuestions: topic.shortQuestions, imageMode: topic.imageMode, heroMediaId: topic.heroMediaId, heroImageRemoved: topic.heroImageRemoved }) });
      const body = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !body.ok) {
        dispatchAdminNotification(body.message ?? "ذخیره محتوای صفحه انجام نشد.", "error");
        return;
      }
      dispatchAdminNotification("محتوای صفحه به‌صورت پیش‌نویس ذخیره شد؛ برای انتشار، در صفحه کارت‌ها ذخیره تغییرات را بزنید.");
      const returnUrl = `/admin/consultation-issues?tab=${encodeURIComponent(topic.pageKey)}${returnCardTitle?.trim() ? `&draftSlug=${encodeURIComponent(topic.slug)}&draftTitle=${encodeURIComponent(returnCardTitle.trim())}` : ""}`;
      router.push(returnUrl);
      router.refresh();
    } catch {
      dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error");
    } finally {
      setPending(false);
    }
  }

  async function removeContent() {
    if (!window.confirm("محتوای این صفحه از سایت حذف شود؟")) return;
    setPending(true);
    try {
      const response = await fetch(`/api/admin/consultation-issues/${encodeURIComponent(topic.slug)}?pageKey=${encodeURIComponent(topic.pageKey)}`, { method: "DELETE", credentials: "same-origin" });
      const body = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !body.ok) {
        dispatchAdminNotification(body.message ?? "حذف محتوا انجام نشد.", "error");
        return;
      }
      dispatchAdminNotification("محتوای صفحه حذف شد.");
      router.push("/admin/consultation-issues");
      router.refresh();
    } catch {
      dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error");
    } finally {
      setPending(false);
    }
  }

  const field = (label: string, value: string, setValue: (value: string) => void, multiline = false, className = "") => multiline
    ? <label className={`admin-form-field${className ? ` ${className}` : ""}`}><span>{label}</span><textarea value={value} disabled={readOnly || pending} onChange={(event) => setValue(event.target.value)} /></label>
    : <label className={`admin-form-field${className ? ` ${className}` : ""}`}><span>{label}</span><input value={value} disabled={readOnly || pending} onChange={(event) => setValue(event.target.value)} /></label>;

  const showBranding = hasHeroBranding(topic.imageMode);

  function addCustomSection() {
    update({ customSections: [...topic.customSections, { id: crypto.randomUUID(), title: "", description: "" }] });
  }

  function updateCustomSection(id: string, values: Partial<{ title: string; description: string }>) {
    update({ customSections: topic.customSections.map((section) => section.id === id ? { ...section, ...values } : section) });
  }

  function removeCustomSection(id: string) {
    const section = topic.customSections.find((item) => item.id === id);
    if (section && (section.title.trim() || section.description.trim()) && editableSectionCount(topic) <= 1) {
      dispatchAdminNotification("حداقل یک بخش از محتوای اصلی صفحه باید باقی بماند.", "error");
      return;
    }
    update({ customSections: topic.customSections.filter((section) => section.id !== id) });
  }

  function removeCoreSection(key: CoreSectionKey) {
    if (editableSectionCount(topic) <= 1) {
      dispatchAdminNotification("حداقل یک بخش از محتوای اصلی صفحه باید باقی بماند.", "error");
      return;
    }
    switch (key) {
      case "signs": update({ signsTitle: "", signs: [], signsNote: "" }); break;
      case "why": update({ whyTitle: "", why: "" }); break;
      case "whenToGetHelp": update({ whenToGetHelpTitle: "", whenToGetHelp: [] }); break;
      case "whatHelps": update({ whatHelpsTitle: "", whatHelps: [] }); break;
      case "approach": update({ approachTitle: "", approachParagraphs: [], approach: [] }); break;
    }
  }

  function restoreCoreSection(key: CoreSectionKey) {
    switch (key) {
      case "signs": update({ signsTitle: coreSectionLabels.signs }); break;
      case "why": update({ whyTitle: coreSectionLabels.why }); break;
      case "whenToGetHelp": update({ whenToGetHelpTitle: coreSectionLabels.whenToGetHelp }); break;
      case "whatHelps": update({ whatHelpsTitle: coreSectionLabels.whatHelps }); break;
      case "approach": update({ approachTitle: coreSectionLabels.approach }); break;
    }
  }

  const renderCoreSection = (key: CoreSectionKey, content: ReactNode) => hasCoreSectionContent(topic, key) ? (
    <div className="admin-topic-editable-section admin-form-field-full">
      <div className="admin-topic-editable-section-heading"><strong>{coreSectionLabels[key]}</strong>{!readOnly ? <button type="button" className="admin-topic-section-remove" disabled={pending || editableSectionCount(topic) <= 1} title={editableSectionCount(topic) <= 1 ? "حداقل یک بخش باید باقی بماند" : "حذف بخش"} onClick={() => removeCoreSection(key)}>× حذف بخش</button> : null}</div>
      <div className="admin-topic-editable-section-grid">{content}</div>
    </div>
  ) : null;

  const removedCoreSections = coreSectionKeys.filter((key) => !hasCoreSectionContent(topic, key));

  return (
    <div className="admin-individual-consultation-topic-form">
      <div className="admin-form-notice" role="status">محتوا را در بلوک‌های هم‌جای صفحه وارد کنید؛ فیلدهای چندخطی با هر مورد در یک خط، در پیش‌نمایش زنده هم دیده می‌شوند.</div>
      <div className="admin-topic-editor-layout">
        <div className="admin-topic-editor-fields">
          <section className="admin-topic-editor-block" aria-labelledby="admin-topic-intro-title">
            <div className="admin-topic-editor-block-heading"><h2 id="admin-topic-intro-title">معرفی صفحه</h2><p>عنوان و متن ابتدای صفحه را وارد کنید.</p></div>
            <div className="admin-topic-editor-grid">
              {field("عنوان صفحه", topic.title, (value) => update({ title: value }))}
              {field("توضیحات معرفی", topic.description, (value) => update({ description: value }), true, "admin-form-field-full")}
              {field("فهرست معرفی اولیه", lines(topic.introList), (value) => update({ introList: parseLines(value) }), true, "admin-form-field-full")}
            </div>
          </section>

          <section className="admin-topic-editor-block" aria-labelledby="admin-topic-content-title">
            <div className="admin-topic-editor-block-heading"><h2 id="admin-topic-content-title">محتوای اصلی صفحه</h2><p>هر بخش در جای خودش نمایش داده می‌شود و ترتیب خطوط حفظ خواهد شد.</p></div>
            <div className="admin-topic-editor-grid">
              {renderCoreSection("signs", <>{field("عنوان بخش", topic.signsTitle, (value) => update({ signsTitle: value }))}{field("موارد این بخش", lines(topic.signs), (value) => update({ signs: parseLines(value) }), true)}</>)}
              {renderCoreSection("why", <>{field("عنوان بخش", topic.whyTitle, (value) => update({ whyTitle: value }))}{field("توضیحات این بخش", topic.why, (value) => update({ why: value }), true)}</>)}
              {renderCoreSection("whenToGetHelp", <>{field("عنوان بخش", topic.whenToGetHelpTitle, (value) => update({ whenToGetHelpTitle: value }))}{field("موارد این بخش", lines(topic.whenToGetHelp), (value) => update({ whenToGetHelp: parseLines(value) }), true)}</>)}
              {renderCoreSection("whatHelps", <>{field("عنوان بخش", topic.whatHelpsTitle, (value) => update({ whatHelpsTitle: value }))}{field("موارد این بخش", lines(topic.whatHelps), (value) => update({ whatHelps: parseLines(value) }), true)}</>)}
              {renderCoreSection("approach", <>{field("عنوان بخش", topic.approachTitle, (value) => update({ approachTitle: value }))}{field("توضیحات این بخش", lines(topic.approachParagraphs), (value) => update({ approachParagraphs: parseLines(value) }), true)}</>)}
              {removedCoreSections.length > 0 ? <div className="admin-topic-removed-sections admin-form-field-full"><div className="admin-topic-removed-sections-heading"><strong>بخش‌های حذف‌شده</strong><span>در صورت نیاز می‌توانید هر بخش را دوباره به ویرایشگر برگردانید.</span></div><div className="admin-topic-removed-sections-list">{removedCoreSections.map((key) => <button key={key} type="button" className="admin-topic-section-restore" disabled={readOnly || pending} onClick={() => restoreCoreSection(key)}>+ بازگردانی {coreSectionLabels[key]}</button>)}</div></div> : null}
              <div className="admin-topic-custom-sections admin-form-field-full">
                <div className="admin-topic-custom-sections-heading"><div><strong>بخش‌های جدید</strong><span>برای ساخت بخش اختصاصی، عنوان و توضیحات آن را وارد کنید.</span></div>{!readOnly ? <button type="button" className="admin-button admin-button-secondary" disabled={pending} onClick={addCustomSection}>+ افزودن بخش</button> : null}</div>
                {topic.customSections.map((section, index) => <div className="admin-topic-custom-section" key={section.id}><div className="admin-topic-custom-section-heading"><strong>بخش جدید {index + 1}</strong>{!readOnly ? <button type="button" className="admin-topic-custom-section-remove" aria-label={`حذف بخش جدید ${index + 1}`} disabled={pending} onClick={() => removeCustomSection(section.id)}>×</button> : null}</div><div className="admin-topic-editable-section-grid">{field("عنوان بخش", section.title, (value) => updateCustomSection(section.id, { title: value }))}{field("توضیحات بخش", section.description, (value) => updateCustomSection(section.id, { description: value }), true)}</div></div>)}
              </div>
            </div>
          </section>

          <section className="admin-topic-editor-block" aria-labelledby="admin-topic-image-title">
            <div className="admin-topic-editor-block-heading"><h2 id="admin-topic-image-title">تصویر صفحه</h2><p>تصویر جدید در کتابخانه رسانه ذخیره می‌شود و بعد از ذخیره به صفحه متصل خواهد شد.</p></div>
            <div className="admin-topic-image-box">
              {topic.heroImageUrl ? <img src={topic.heroImageUrl} alt="پیش‌نمایش تصویر صفحه" className={`admin-topic-image-preview${topic.heroImageUrl.startsWith("/api/admin/media/") ? " is-uploaded" : ""}`} /> : <div className="admin-topic-image-empty">تصویری برای نمایش وجود ندارد.</div>}
              <div className="admin-topic-image-controls">
                <div className="admin-topic-image-mode-label">حالت نمایش تصویر</div>
                <div className="admin-topic-image-modes" role="group" aria-label="حالت نمایش لوگو روی تصویر">
                  <button type="button" className={`admin-topic-image-mode${showBranding ? " is-active" : ""}`} aria-pressed={showBranding} disabled={readOnly || pending} onClick={() => update({ imageMode: withHeroBranding(topic.imageMode, true) })}><span className="admin-topic-image-mode-preview admin-topic-image-mode-preview-branded">اُزون</span><span>با لوگو و دایره‌ها</span></button>
                  <button type="button" className={`admin-topic-image-mode${!showBranding ? " is-active" : ""}`} aria-pressed={!showBranding} disabled={readOnly || pending} onClick={() => update({ imageMode: withHeroBranding(topic.imageMode, false) })}><span className="admin-topic-image-mode-preview">تصویر</span><span>بدون لوگو</span></button>
                </div>
              </div>
              {!readOnly ? <div className="admin-form-actions"><label className="admin-button admin-button-secondary admin-file-button">{uploading ? "در حال بارگذاری…" : "انتخاب تصویر"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || pending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.currentTarget.value = ""; }} /></label>{topic.heroImageUrl ? <button type="button" className="admin-button admin-button-danger" disabled={pending || uploading} onClick={() => update({ heroMediaId: null, heroImageRemoved: true, heroImageUrl: "" })}>حذف تصویر</button> : null}</div> : null}
            </div>
          </section>

          {!readOnly ? <div className="admin-form-actions"><Link href={`/admin/consultation-issues?tab=${encodeURIComponent(topic.pageKey)}`} className="admin-button admin-button-secondary">بازگشت</Link><button type="button" className="admin-button admin-button-primary" disabled={pending || uploading} onClick={() => void save()}>{pending ? "در حال ذخیره…" : "ذخیره پیش‌نویس و بازگشت"}</button>{topic.exists ? <button type="button" className="admin-button admin-button-danger" disabled={pending || uploading} onClick={() => void removeContent()}>حذف محتوای صفحه</button> : null}</div> : <div className="admin-form-actions"><Link href={`/admin/consultation-issues?tab=${encodeURIComponent(topic.pageKey)}`} className="admin-button admin-button-secondary">بازگشت</Link></div>}
        </div>
        <aside className="admin-topic-live-preview" aria-label="پیش‌نمایش زنده صفحه"><div className="admin-topic-live-preview-heading"><h2>پیش‌نمایش زنده</h2><span>همان ترتیب صفحه عمومی</span></div><AdminTopicPreview topic={topic} /></aside>
      </div>
    </div>
  );
}

function AdminTopicPreview({ topic }: { topic: TopicState }) {
  const showBranding = hasHeroBranding(topic.imageMode);
  const isUploadedHero = topic.heroImageUrl.startsWith("/api/admin/media/");
  const text = (value: string, fallback: string) => value.trim() || fallback;
  return <article className="admin-topic-preview">
    <header className="admin-topic-preview-heading"><h3>{text(topic.title, "عنوان صفحه")}</h3><p>{text(topic.description, "توضیحات معرفی صفحه در اینجا نمایش داده می‌شود.")}</p>{topic.introList.length > 0 ? <ul>{topic.introList.map((item, index) => <li key={`preview-intro-${index}`}>{item || "مورد معرفی"}</li>)}</ul> : null}</header>
    {topic.heroImageUrl ? <figure className="admin-topic-preview-hero"><div className={`admin-topic-preview-hero-image${isUploadedHero ? " is-uploaded" : ""}`}><img src={topic.heroImageUrl} alt="" />{showBranding ? <><span className="admin-topic-preview-circles" aria-hidden="true" /><img src="/ozone-logo.svg" alt="" className="admin-topic-preview-logo" /></> : null}</div></figure> : <div className="admin-topic-preview-empty-image">تصویر صفحه</div>}
    {hasCoreSectionContent(topic, "signs") ? <PreviewBlock title={text(topic.signsTitle, "نشانه‌های رایج")} items={topic.signs} list /> : null}
    {hasCoreSectionContent(topic, "why") ? <PreviewBlock title={text(topic.whyTitle, "چرا پیش می‌آید؟")} paragraphs={[topic.why]} /> : null}
    {hasCoreSectionContent(topic, "whenToGetHelp") ? <PreviewBlock title={text(topic.whenToGetHelpTitle, "چه زمانی لازم است کمک بگیرم؟")} items={topic.whenToGetHelp} list /> : null}
    {hasCoreSectionContent(topic, "whatHelps") ? <PreviewBlock title={text(topic.whatHelpsTitle, "چه کارهایی معمولاً کمک می‌کند?")} items={topic.whatHelps} list /> : null}
    {hasCoreSectionContent(topic, "approach") ? <PreviewBlock title={text(topic.approachTitle, "اُزون چگونه به تو کمک می‌کند؟")} paragraphs={topic.approachParagraphs} /> : null}
    {topic.customSections.map((section) => section.title.trim() || section.description.trim() ? <PreviewBlock key={section.id} title={text(section.title, "عنوان بخش جدید")} paragraphs={[section.description]} /> : null)}
  </article>;
}

function PreviewBlock({ title, items = [], paragraphs = [], list = false }: { title: string; items?: string[]; paragraphs?: string[]; list?: boolean }) {
  return <section className="admin-topic-preview-block"><h4>{title}</h4>{list ? <ul>{items.filter(Boolean).map((item, index) => <li key={`preview-item-${index}`}>{item}</li>)}</ul> : paragraphs.filter(Boolean).map((paragraph, index) => <p key={`preview-paragraph-${index}`}>{paragraph}</p>)}</section>;
}
