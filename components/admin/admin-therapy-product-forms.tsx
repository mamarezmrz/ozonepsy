"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { CustomSelect } from "@/components/custom-select";
import { AdminDatePicker } from "@/components/admin/admin-date-picker";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";

type ApiResponse = { ok?: boolean; message?: string; data?: { id?: string } };

export type GroupTherapyFormValues = {
  title?: string;
  slug?: string;
  description?: string;
  priceMinor?: number;
  discountPercent?: number;
  currency?: string;
  coverMediaId?: string | null;
  instructorName?: string | null;
  durationSessions?: number | null;
  sessions?: Array<{ id?: string; title?: string; startsAt?: string | Date }>;
};

export type IndividualConsultationFormValues = {
  title?: string;
  slug?: string;
  description?: string;
  priceMinor?: number;
  discountPercent?: number;
  currency?: string;
  durationMinutes?: number;
  includedSessions?: number;
};

function normalizeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
}

function finalizeSlug(value: string) {
  return normalizeSlug(value).replace(/^-+|-+$/g, "");
}

type GroupSessionDraft = { key: number; title: string; startsAt: string };

function localDateTime(value?: string | Date) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value)) return value.slice(0, 16);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function readResponse(response: Response) {
  try { return await response.json() as ApiResponse; } catch { return {} as ApiResponse; }
}

async function uploadCover(file: File) {
  const form = new FormData();
  form.append("file", file);
  form.append("visibility", "PUBLIC");
  const response = await fetch("/api/admin/media", { method: "POST", credentials: "same-origin", body: form });
  const body = await readResponse(response);
  if (!response.ok || !body.ok || !body.data?.id) throw new Error(body.message ?? "بارگذاری تصویر انجام نشد.");
  return body.data.id;
}

function CoverField({ mediaId, onChange }: { mediaId: string | null; onChange: (id: string | null) => void }) {
  const [previewUrl, setPreviewUrl] = useState(mediaId ? `/api/admin/media/${mediaId}/preview` : "");
  const [pending, setPending] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPending(true);
    try {
      const id = await uploadCover(file);
      onChange(id);
      setPreviewUrl(`/api/admin/media/${id}/preview`);
      dispatchAdminNotification("تصویر کاور بارگذاری شد.");
    } catch (error) {
      dispatchAdminNotification(error instanceof Error ? error.message : "بارگذاری تصویر انجام نشد.", "error");
    } finally { setPending(false); }
  }

  function remove() {
    onChange(null);
    setPreviewUrl("");
  }

  return <div className="admin-course-cover-box">
    <div className="admin-course-cover-preview">
      {previewUrl ? <Image src={previewUrl} alt="پیش‌نمایش تصویر کاور" fill unoptimized sizes="(max-width: 760px) 100vw, 48vw" /> : <div className="admin-course-cover-empty">تصویر کاور</div>}
    </div>
    <div className="admin-course-cover-controls">
      <div className="admin-course-cover-actions">
        <label className="admin-button admin-button-secondary admin-course-file-input">{pending ? "در حال بارگذاری…" : "انتخاب تصویر"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} disabled={pending} /></label>
        {previewUrl ? <button type="button" className="admin-button admin-button-danger" onClick={remove}>حذف تصویر</button> : null}
      </div>
    </div>
  </div>;
}

function discountedPrice(priceMajor: string, discountPercent: string) {
  const price = Number(priceMajor);
  const discount = Number(discountPercent);
  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(discount) || discount < 0 || discount > 100) return "—";
  return ((price * (100 - discount)) / 100).toFixed(2);
}

function ProductFields({ values, kind, onChange }: { values: { title: string; slug: string; description: string; priceMajor: string; discountPercent: string; currency: string }; kind: "group" | "consultation"; onChange: (field: "title" | "slug" | "description" | "priceMajor" | "discountPercent" | "currency", value: string) => void }) {
  return <div className="admin-course-form-grid">
    <label className="admin-form-field admin-form-field-full"><span>عنوان {kind === "group" ? "گروه‌درمانی" : "مشاوره فردی"}</span><input value={values.title} onChange={(event) => onChange("title", event.target.value)} required /></label>
    <label className="admin-form-field admin-form-field-full admin-course-slug-field"><span>اسلاگ</span><input dir="ltr" value={values.slug} onChange={(event) => onChange("slug", normalizeSlug(event.target.value))} placeholder="مثلاً individual-consultation" required /></label>
    <label className="admin-form-field admin-form-field-full"><span>توضیحات</span><textarea value={values.description} onChange={(event) => onChange("description", event.target.value)} required /></label>
    <label className="admin-form-field"><span>مبلغ</span><input type="number" min="0" step="0.01" value={values.priceMajor} onChange={(event) => onChange("priceMajor", event.target.value)} required /></label>
    <label className="admin-form-field"><span>درصد تخفیف</span><input type="number" min="0" max="100" step="1" value={values.discountPercent} onChange={(event) => onChange("discountPercent", event.target.value)} /></label>
    <label className="admin-form-field"><span>مبلغ پس از تخفیف</span><input value={`${discountedPrice(values.priceMajor, values.discountPercent)} ${values.currency}`} readOnly aria-readonly="true" /></label>
    <label className="admin-form-field"><span>واحد پولی</span><CustomSelect options={[{ value: "USD", label: "دلار" }, { value: "EUR", label: "یورو" }]} value={values.currency} onChange={(value) => onChange("currency", value)} placeholder="انتخاب واحد پولی" ariaLabel="واحد پولی" searchable={false} className="admin-custom-select" /></label>
  </div>;
}

export function AdminGroupTherapyForm({ values = {}, productId }: { values?: GroupTherapyFormValues; productId?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(values.title ?? "");
  const [slug, setSlug] = useState(values.slug ?? "");
  const [description, setDescription] = useState(values.description ?? "");
  const [priceMajor, setPriceMajor] = useState(values.priceMinor === undefined ? "0" : String(values.priceMinor / 100));
  const [discountPercent, setDiscountPercent] = useState(String(values.discountPercent ?? 0));
  const [currency, setCurrency] = useState(values.currency === "EUR" ? "EUR" : "USD");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(values.coverMediaId ?? null);
  const [instructorName, setInstructorName] = useState(values.instructorName ?? "");
  const [durationSessions, setDurationSessions] = useState(values.durationSessions == null ? "" : String(values.durationSessions));
  const [nextSessionKey, setNextSessionKey] = useState((values.sessions?.length ?? 0) + 1);
  const [sessions, setSessions] = useState<GroupSessionDraft[]>(() => (values.sessions ?? []).map((session, index) => ({ key: index + 1, title: session.title ?? "", startsAt: localDateTime(session.startsAt) })));
  const [pending, setPending] = useState(false);

  function update(field: "title" | "slug" | "description" | "priceMajor" | "discountPercent" | "currency", value: string) {
    ({ title: setTitle, slug: setSlug, description: setDescription, priceMajor: setPriceMajor, discountPercent: setDiscountPercent, currency: setCurrency } as const)[field](value);
  }

  function buildSessions() {
    const count = Number(durationSessions);
    if (!Number.isInteger(count) || count < 1 || count > 100) {
      dispatchAdminNotification("تعداد جلسات باید بین ۱ تا ۱۰۰ باشد.", "error");
      return;
    }
    setSessions((current) => {
      if (current.length >= count) return current.slice(0, count);
      const additions = Array.from({ length: count - current.length }, () => ({ key: nextSessionKey, title: "", startsAt: "" }));
      setNextSessionKey((key) => key + additions.length);
      return [...current, ...additions];
    });
  }

  function addSession() {
    setSessions((current) => [...current, { key: nextSessionKey, title: "", startsAt: "" }]);
    setNextSessionKey((key) => key + 1);
    setDurationSessions((current) => String((Number(current) || 0) + 1));
  }

  function removeSession(key: number) {
    setSessions((current) => {
      const next = current.filter((session) => session.key !== key);
      setDurationSessions(String(next.length));
      return next;
    });
  }

  function updateSession(key: number, field: "title" | "startsAt", value: string) {
    setSessions((current) => current.map((session) => session.key === key ? { ...session, [field]: value } : session));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sessionCount = Number(durationSessions);
    if (!title.trim() || !finalizeSlug(slug) || !description.trim()) { dispatchAdminNotification("عنوان، اسلاگ و توضیحات را کامل کنید.", "error"); return; }
    if (!instructorName.trim()) { dispatchAdminNotification("نام مدرس را وارد کنید.", "error"); return; }
    if (!Number.isInteger(sessionCount) || sessionCount < 1 || sessions.length !== sessionCount) { dispatchAdminNotification("تعداد جلسات و ردیف‌های جلسه باید یکسان و کامل باشند.", "error"); return; }
    if (sessions.some((session) => !session.title.trim() || !session.startsAt)) { dispatchAdminNotification("عنوان و تاریخ و ساعت همهٔ جلسات را کامل کنید.", "error"); return; }
    setPending(true);
    try {
      const response = await fetch(productId ? `/api/admin/group-therapy/${productId}` : "/api/admin/group-therapy", { method: productId ? "PATCH" : "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: title.trim(), slug: finalizeSlug(slug), description: description.trim(), priceMinor: Math.round((Number(priceMajor) || 0) * 100), discountPercent: Number(discountPercent) || 0, currency, coverMediaId, instructorName: instructorName.trim(), durationSessions: sessionCount, sessions: sessions.map((session) => ({ title: session.title.trim(), startsAt: new Date(session.startsAt).toISOString() })) }) });
      const body = await readResponse(response);
      if (!response.ok || !body.ok) { dispatchAdminNotification(body.message ?? "ذخیره گروه‌درمانی انجام نشد.", "error"); return; }
      dispatchAdminNotification(body.message ?? "گروه‌درمانی ذخیره شد.");
      router.push("/group-therapy"); router.refresh();
    } catch { dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error"); } finally { setPending(false); }
  }

  return <form className="admin-course-create-form" onSubmit={submit} noValidate>
    <section className="admin-course-editor-section admin-course-specs-section"><h2>مشخصات گروه‌درمانی</h2><p>این اطلاعات روی کارت و صفحهٔ جزئیات گروه‌درمانی نمایش داده می‌شود.</p><CoverField mediaId={coverMediaId} onChange={setCoverMediaId} /><ProductFields values={{ title, slug, description, priceMajor, discountPercent, currency }} kind="group" onChange={update} /></section>
    <section className="admin-course-editor-section"><h2>جزئیات گروه‌درمانی</h2><p>مدرس و تعداد جلسات این گروه را وارد کنید.</p><div className="admin-course-form-grid"><label className="admin-form-field"><span>نام مدرس</span><input value={instructorName} onChange={(event) => setInstructorName(event.target.value)} required /></label><label className="admin-form-field"><span>تعداد جلسات</span><div className="admin-course-session-input"><input type="number" min="1" max="100" step="1" value={durationSessions} onChange={(event) => setDurationSessions(event.target.value)} required /><button type="button" className="admin-course-build-sessions" onClick={buildSessions} disabled={!durationSessions}>ساخت جلسات</button></div></label></div></section>
    <section className="admin-course-editor-section admin-course-sessions-section"><div className="admin-course-section-heading"><div><h2>جلسات گروه‌درمانی</h2><p>برای هر جلسه عنوان، تاریخ و ساعت مشخص کنید.</p></div><span className="admin-course-session-count">{sessions.length.toLocaleString("fa-IR")} جلسه</span></div><div className="admin-course-session-list">{sessions.map((session, index) => <div className="admin-course-session-row group-therapy-admin-session-row" key={session.key}><span className="admin-course-session-number">{(index + 1).toLocaleString("fa-IR")}</span><label className="admin-form-field"><span>عنوان جلسه</span><input value={session.title} onChange={(event) => updateSession(session.key, "title", event.target.value)} /></label><label className="admin-form-field"><span>تاریخ و ساعت جلسه</span><AdminDatePicker name={`group-therapy-session-${session.key}`} defaultValue={session.startsAt} includeTime required ariaLabel={`تاریخ و ساعت جلسه ${index + 1}`} onChange={(value) => updateSession(session.key, "startsAt", value)} /></label><button type="button" className="admin-course-session-delete group-therapy-session-delete" onClick={() => removeSession(session.key)} aria-label={`حذف جلسه ${index + 1}`}>×</button></div>)}</div><button type="button" className="admin-button admin-button-secondary admin-course-add-session" onClick={addSession}>+ افزودن جلسه</button></section>
    <div className="admin-course-actions"><button type="submit" className="admin-button admin-button-primary" disabled={pending}>{pending ? "در حال ذخیره…" : "ذخیره"}</button><button type="button" className="admin-button admin-button-secondary" onClick={() => router.push("/group-therapy")} disabled={pending}>لغو تغییرات</button></div>
  </form>;
}

export function AdminIndividualConsultationForm({ values = {}, productId }: { values?: IndividualConsultationFormValues; productId?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(values.title ?? "");
  const [slug, setSlug] = useState(values.slug ?? "");
  const [description, setDescription] = useState(values.description ?? "");
  const [priceMajor, setPriceMajor] = useState(values.priceMinor === undefined ? "0" : String(values.priceMinor / 100));
  const [discountPercent, setDiscountPercent] = useState(String(values.discountPercent ?? 0));
  const [currency, setCurrency] = useState(values.currency === "EUR" ? "EUR" : "USD");
  const [durationMinutes, setDurationMinutes] = useState(String(values.durationMinutes ?? 50));
  const [includedSessions, setIncludedSessions] = useState(String(values.includedSessions ?? 1));
  const [pending, setPending] = useState(false);

  function update(field: "title" | "slug" | "description" | "priceMajor" | "discountPercent" | "currency", value: string) {
    ({ title: setTitle, slug: setSlug, description: setDescription, priceMajor: setPriceMajor, discountPercent: setDiscountPercent, currency: setCurrency } as const)[field](value);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !finalizeSlug(slug) || !description.trim()) { dispatchAdminNotification("عنوان، اسلاگ و توضیحات را کامل کنید.", "error"); return; }
    setPending(true);
    try {
      const response = await fetch(productId ? `/api/admin/individual-consultation/${productId}` : "/api/admin/individual-consultation", { method: productId ? "PATCH" : "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: title.trim(), slug: finalizeSlug(slug), description: description.trim(), priceMinor: Math.round((Number(priceMajor) || 0) * 100), discountPercent: Number(discountPercent) || 0, currency, durationMinutes: Number(durationMinutes), includedSessions: Number(includedSessions) }) });
      const body = await readResponse(response);
      if (!response.ok || !body.ok) { dispatchAdminNotification(body.message ?? "ذخیره مشاوره فردی انجام نشد.", "error"); return; }
      dispatchAdminNotification(body.message ?? "مشاوره فردی ذخیره شد.");
      router.push("/individual-consultation"); router.refresh();
    } catch { dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error"); } finally { setPending(false); }
  }

  return <form className="admin-course-create-form" onSubmit={submit} noValidate>
    <section className="admin-course-editor-section admin-course-specs-section"><h2>مشخصات مشاوره فردی</h2><p>این اطلاعات در کارت قیمت‌گذاری و صفحهٔ خرید نمایش داده می‌شود.</p><ProductFields values={{ title, slug, description, priceMajor, discountPercent, currency }} kind="consultation" onChange={update} /></section>
    <section className="admin-course-editor-section"><h2>جزئیات مشاوره فردی</h2><p>مدت هر جلسه و تعداد جلسات پکیج را مشخص کنید.</p><div className="admin-course-form-grid"><label className="admin-form-field"><span>مدت هر جلسه (دقیقه)</span><input type="number" min="1" max="1440" step="1" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} required /></label><label className="admin-form-field"><span>تعداد جلسات</span><input type="number" min="1" max="1000" step="1" value={includedSessions} onChange={(event) => setIncludedSessions(event.target.value)} required /></label></div></section>
    <div className="admin-course-actions"><button type="submit" className="admin-button admin-button-primary" disabled={pending}>{pending ? "در حال ذخیره…" : "ذخیره"}</button><button type="button" className="admin-button admin-button-secondary" onClick={() => router.push("/individual-consultation")} disabled={pending}>لغو تغییرات</button></div>
  </form>;
}
