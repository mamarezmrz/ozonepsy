"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
      const response = await fetch(`/api/admin/consultation-issues/${encodeURIComponent(topic.slug)}?pageKey=${encodeURIComponent(topic.pageKey)}`, { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: topic.title, description: topic.description, introList: topic.introList, signsTitle: topic.signsTitle, signs: topic.signs, signsNote: topic.signsNote, why: topic.why, whenToGetHelpTitle: topic.whenToGetHelpTitle, whenToGetHelp: topic.whenToGetHelp, whatHelps: topic.whatHelps, approachTitle: topic.approachTitle, approachParagraphs: topic.approachParagraphs, approach: topic.approach, hideShortQuestions: topic.hideShortQuestions, shortQuestions: topic.shortQuestions, imageMode: topic.imageMode, heroMediaId: topic.heroMediaId, heroImageRemoved: topic.heroImageRemoved }) });
      const body = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !body.ok) {
        dispatchAdminNotification(body.message ?? "ذخیره محتوای صفحه انجام نشد.", "error");
        return;
      }
      dispatchAdminNotification("محتوای صفحه به‌صورت پیش‌نویس ذخیره شد؛ برای انتشار، در صفحه کارت‌ها ذخیره تغییرات را بزنید.");
      const returnUrl = `/consultation-issues?tab=${encodeURIComponent(topic.pageKey)}${returnCardTitle?.trim() ? `&draftSlug=${encodeURIComponent(topic.slug)}&draftTitle=${encodeURIComponent(returnCardTitle.trim())}` : ""}`;
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
      router.push("/consultation-issues");
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
              {field(topic.signsTitle || "نشانه‌های رایج", lines(topic.signs), (value) => update({ signs: parseLines(value) }), true, "admin-form-field-full")}
              {field("چرا پیش می‌آید؟", topic.why, (value) => update({ why: value }), true, "admin-form-field-full")}
              {field(topic.whenToGetHelpTitle || "چه زمانی لازم است کمک بگیرم؟", lines(topic.whenToGetHelp), (value) => update({ whenToGetHelp: parseLines(value) }), true, "admin-form-field-full")}
              {field("چه کارهایی معمولاً کمک می‌کند؟", lines(topic.whatHelps), (value) => update({ whatHelps: parseLines(value) }), true, "admin-form-field-full")}
              {field(topic.approachTitle || "اُزون چگونه به تو کمک می‌کند؟", lines(topic.approachParagraphs), (value) => update({ approachParagraphs: parseLines(value) }), true, "admin-form-field-full")}
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

          {!readOnly ? <div className="admin-form-actions"><Link href={`/consultation-issues?tab=${encodeURIComponent(topic.pageKey)}`} className="admin-button admin-button-secondary">بازگشت</Link><button type="button" className="admin-button admin-button-primary" disabled={pending || uploading} onClick={() => void save()}>{pending ? "در حال ذخیره…" : "ذخیره پیش‌نویس و بازگشت"}</button>{topic.exists ? <button type="button" className="admin-button admin-button-danger" disabled={pending || uploading} onClick={() => void removeContent()}>حذف محتوای صفحه</button> : null}</div> : <div className="admin-form-actions"><Link href={`/consultation-issues?tab=${encodeURIComponent(topic.pageKey)}`} className="admin-button admin-button-secondary">بازگشت</Link></div>}
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
    <PreviewBlock title={text(topic.signsTitle, "نشانه‌های رایج")} items={topic.signs} list />
    <PreviewBlock title="چرا پیش می‌آید؟" paragraphs={[topic.why]} />
    <PreviewBlock title={text(topic.whenToGetHelpTitle, "چه زمانی لازم است کمک بگیرم؟")} items={topic.whenToGetHelp} list />
    <PreviewBlock title="چه کارهایی معمولاً کمک می‌کند؟" items={topic.whatHelps} list />
    <PreviewBlock title={text(topic.approachTitle, "اُزون چگونه به تو کمک می‌کند؟")} paragraphs={topic.approachParagraphs} />
  </article>;
}

function PreviewBlock({ title, items = [], paragraphs = [], list = false }: { title: string; items?: string[]; paragraphs?: string[]; list?: boolean }) {
  return <section className="admin-topic-preview-block"><h4>{title}</h4>{list ? <ul>{items.filter(Boolean).map((item, index) => <li key={`preview-item-${index}`}>{item}</li>)}</ul> : paragraphs.filter(Boolean).map((paragraph, index) => <p key={`preview-paragraph-${index}`}>{paragraph}</p>)}</section>;
}
