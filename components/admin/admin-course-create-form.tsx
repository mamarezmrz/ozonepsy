"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";
import { CustomSelect } from "@/components/custom-select";
import { AdminConfirmDialog } from "@/components/admin/admin-mutation-form";

type VideoDraft = { mediaId: string | null; duration: number | null; fileName: string };
type SessionDraft = { key: number; title: string; video: VideoDraft };
type ApiResponse = { ok?: boolean; message?: string; data?: { id?: string; name?: string }; fieldErrors?: Record<string, string> };
export type AdminCourseFormValues = {
  title?: string;
  slug?: string;
  description?: string;
  priceMinor?: number;
  currency?: string;
  tags?: string[];
  coverMediaId?: string | null;
  instructorName?: string | null;
  durationSessions?: number | null;
  demoMediaId?: string | null;
  demoVideoDuration?: number | null;
  demoVideoName?: string;
  sessions?: Array<{ title: string; videoMediaId?: string | null; videoDuration?: number | null; videoName?: string }>;
};
const emptyVideo: VideoDraft = { mediaId: null, duration: null, fileName: "" };
function normalizeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
}

function finalizeSlug(value: string) {
  return normalizeSlug(value).replace(/^-+|-+$/g, "");
}

async function readApiResponse(response: Response) {
  try {
    return await response.json() as ApiResponse;
  } catch {
    return {} as ApiResponse;
  }
}

async function readVideoDuration(file: File) {
  return new Promise<number | null>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;
    const finish = (duration: number | null) => {
      if (settled) return;
      settled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      video.remove();
      resolve(duration && Number.isFinite(duration) ? Math.round(duration) : null);
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => finish(video.duration);
    video.onerror = () => finish(null);
    const timeoutId = window.setTimeout(() => finish(null), 5000);
    video.src = objectUrl;
    video.load();
  });
}

function formatVideoDuration(duration: number | null) {
  if (duration === null) return "";
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes.toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}:${seconds.toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}`;
}

async function uploadVideo(file: File, visibility: "PUBLIC" | "PRIVATE") {
  const form = new FormData();
  form.append("file", file);
  form.append("mediaType", "VIDEO");
  form.append("visibility", visibility);
  const response = await fetch("/api/admin/media", { method: "POST", credentials: "same-origin", body: form });
  const body = await readApiResponse(response);
  if (!response.ok || !body.ok || !body.data?.id) throw new Error(body.message ?? "بارگذاری ویدئو انجام نشد.");
  return { mediaId: body.data.id, duration: await readVideoDuration(file), fileName: file.name };
}

function VideoUploadField({ label, value, visibility, onChange, onError }: { label: string; value: VideoDraft; visibility: "PUBLIC" | "PRIVATE"; onChange: (value: VideoDraft) => void; onError: (message: string) => void }) {
  const [pending, setPending] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPending(true);
    try {
      onChange(await uploadVideo(file, visibility));
      dispatchAdminNotification("ویدئو با موفقیت بارگذاری شد.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "بارگذاری ویدئو انجام نشد.");
    } finally {
      setPending(false);
    }
  }

  return <label className="admin-form-field"><span>{label}</span><span className="admin-course-video-field"><span dir={value.fileName ? "ltr" : undefined}>{pending ? "در حال بارگذاری…" : value.fileName || "برای آپلود ویدئو کلیک کنید"}</span>{value.duration !== null ? <small dir="ltr">{formatVideoDuration(value.duration)}</small> : null}<input type="file" accept="video/mp4,video/webm,video/ogg,.mp4,.webm,.ogv" onChange={handleChange} disabled={pending} /></span></label>;
}

function AdminCourseTags({ values, existingTags, onChange }: { values: string[]; existingTags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState("");
  const [availableTags, setAvailableTags] = useState(() => [...new Set(existingTags)]);
  const [open, setOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const normalizedInput = normalizeTag(input).toLocaleLowerCase("fa");
  const filteredTags = normalizedInput ? availableTags.filter((tag) => normalizeTag(tag).toLocaleLowerCase("fa").startsWith(normalizedInput)) : availableTags;
  const exactMatch = availableTags.some((tag) => normalizeTag(tag).toLocaleLowerCase("fa") === normalizedInput);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function toggle(tag: string) {
    const selected = values.some((value) => normalizeTag(value).toLocaleLowerCase("fa") === normalizeTag(tag).toLocaleLowerCase("fa"));
    if (selected) onChange(values.filter((value) => normalizeTag(value).toLocaleLowerCase("fa") !== normalizeTag(tag).toLocaleLowerCase("fa")));
    else if (values.length < 20) onChange([...values, tag]);
  }

  async function addTag() {
    const name = normalizeTag(input);
    if (!name || filteredTags.length || exactMatch || pending || values.length >= 20) return;
    setPending(true);
    try {
      const response = await fetch("/api/admin/course-tags", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
      const body = await readApiResponse(response);
      if (!response.ok || !body.ok || !body.data?.name) throw new Error(body.message ?? "افزودن تگ انجام نشد.");
      const createdName = body.data.name;
      setAvailableTags((current) => current.some((tag) => normalizeTag(tag).toLocaleLowerCase("fa") === normalizeTag(createdName).toLocaleLowerCase("fa")) ? current : [...current, createdName].sort((left, right) => left.localeCompare(right, "fa")));
      if (!values.some((tag) => normalizeTag(tag).toLocaleLowerCase("fa") === normalizeTag(createdName).toLocaleLowerCase("fa"))) onChange([...values, createdName]);
      setInput("");
      setOpen(true);
      dispatchAdminNotification(body.message ?? "تگ اضافه شد.");
    } catch (error) {
      dispatchAdminNotification(error instanceof Error ? error.message : "افزودن تگ انجام نشد.", "error");
    } finally {
      setPending(false);
    }
  }

  async function deleteTag() {
    if (!tagToDelete || pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/admin/course-tags", { method: "DELETE", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: tagToDelete }) });
      const body = await readApiResponse(response);
      if (!response.ok || !body.ok) throw new Error(body.message ?? "حذف تگ انجام نشد.");
      const deletedName = tagToDelete;
      setAvailableTags((current) => current.filter((tag) => normalizeTag(tag).toLocaleLowerCase("fa") !== normalizeTag(deletedName).toLocaleLowerCase("fa")));
      onChange(values.filter((tag) => normalizeTag(tag).toLocaleLowerCase("fa") !== normalizeTag(deletedName).toLocaleLowerCase("fa")));
      setTagToDelete(null);
      dispatchAdminNotification(body.message ?? "تگ حذف شد.");
    } catch (error) {
      dispatchAdminNotification(error instanceof Error ? error.message : "حذف تگ انجام نشد.", "error");
    } finally {
      setPending(false);
    }
  }

  return <div className="admin-course-tags-control" ref={rootRef}>
    <button type="button" className="auth-custom-select-trigger admin-course-tags-trigger" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((current) => !current)}>
      <span className={values.length ? "" : "is-placeholder"}>{values.length ? values.join("، ") : "انتخاب یا ساخت تگ"}</span>
      <Image src="/icons/chevron-down.svg" alt="" width={16} height={16} className={open ? "is-open" : ""} />
    </button>
    {open ? <div className="auth-custom-select-menu admin-course-tags-menu">
      <div className="admin-course-tags-search-row">
        <div className="auth-custom-select-search-wrap"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg><input type="search" value={input} maxLength={80} placeholder="جست‌وجوی تگ" aria-label="جست‌وجوی تگ" onChange={(event) => setInput(event.target.value)} /></div>
        <button type="button" className="admin-button admin-button-secondary" disabled={!normalizedInput || filteredTags.length > 0 || exactMatch || pending || values.length >= 20} onClick={addTag}>افزودن تگ</button>
      </div>
      <div className="auth-custom-select-options admin-course-tags-options" role="listbox" aria-label="تگ‌های دوره" aria-multiselectable="true">
        {filteredTags.length ? filteredTags.map((tag) => {
          const selected = values.some((value) => normalizeTag(value).toLocaleLowerCase("fa") === normalizeTag(tag).toLocaleLowerCase("fa"));
          return <div className="admin-course-tag-option-row" key={tag}>
            <button type="button" role="option" aria-selected={selected} className={`auth-custom-select-option${selected ? " is-selected" : ""}`} onClick={() => toggle(tag)}><span>{tag}</span><span className="admin-multi-select-checkbox" aria-hidden="true">{selected ? "✓" : ""}</span></button>
            <button type="button" className="admin-course-tag-delete" aria-label={`حذف تگ ${tag}`} disabled={pending} onClick={() => setTagToDelete(tag)}>×</button>
          </div>;
        }) : <p className="auth-custom-select-empty">{normalizedInput ? "تگی با این عبارت پیدا نشد؛ برای ساخت آن «افزودن تگ» را بزنید." : "هنوز تگی ساخته نشده است."}</p>}
      </div>
    </div> : null}
    {values.length ? <div className="admin-course-tag-list">{values.map((tag) => <span key={tag}>{tag}<button type="button" aria-label={`برداشتن تگ ${tag} از این دوره`} onClick={() => toggle(tag)}>×</button></span>)}</div> : <small className="admin-course-cover-hint">می‌توانید چند تگ را هم‌زمان انتخاب کنید.</small>}
    {tagToDelete ? <AdminConfirmDialog title="حذف تگ" description={`تگ «${tagToDelete}» از فهرست و دوره‌هایی که به آن وصل است حذف می‌شود. ادامه می‌دهید؟`} onCancel={() => pending ? undefined : setTagToDelete(null)}>
      <div className="admin-form-actions"><button type="button" className="admin-button admin-button-secondary" onClick={() => setTagToDelete(null)} disabled={pending}>انصراف</button><button type="button" className="admin-button admin-button-danger" onClick={deleteTag} disabled={pending}>{pending ? "در حال حذف…" : "حذف تگ"}</button></div>
    </AdminConfirmDialog> : null}
  </div>;
}

function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, " ").replace(/ي/g, "ی").replace(/ك/g, "ک");
}

export function AdminCourseCreateForm({ existingTags = [], values = {}, courseId }: { existingTags?: string[]; values?: AdminCourseFormValues; courseId?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(values.title ?? "");
  const [slug, setSlug] = useState(values.slug ?? "");
  const [description, setDescription] = useState(values.description ?? "");
  const [tags, setTags] = useState<string[]>(values.tags ?? []);
  const [priceMajor, setPriceMajor] = useState(values.priceMinor === undefined ? "0" : String(values.priceMinor / 100));
  const [currency, setCurrency] = useState(values.currency === "EUR" || values.currency === "CAD" ? values.currency : "USD");
  const [instructorName, setInstructorName] = useState(values.instructorName ?? "");
  const [durationSessions, setDurationSessions] = useState(values.durationSessions ? String(values.durationSessions) : "");
  const [demoVideo, setDemoVideo] = useState<VideoDraft>({ mediaId: values.demoMediaId ?? null, duration: values.demoVideoDuration ?? null, fileName: values.demoVideoName ?? (values.demoMediaId ? "ویدئوی بارگذاری‌شده" : "") });
  const [coverMediaId, setCoverMediaId] = useState<string | null>(values.coverMediaId ?? null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(values.coverMediaId ? `/api/admin/media/${values.coverMediaId}/preview` : "");
  const [sessions, setSessions] = useState<SessionDraft[]>(values.sessions?.length ? values.sessions.map((session, index) => ({ key: index + 1, title: session.title, video: { mediaId: session.videoMediaId ?? null, duration: session.videoDuration ?? null, fileName: session.videoName ?? (session.videoMediaId ? "ویدئوی بارگذاری‌شده" : "") } })) : []);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [pending, setPending] = useState(false);

  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingCover(true);
    const form = new FormData();
    form.append("file", file);
    form.append("visibility", "PUBLIC");
    try {
      const response = await fetch("/api/admin/media", { method: "POST", credentials: "same-origin", body: form });
      const body = await readApiResponse(response);
      if (!response.ok || !body.ok || !body.data?.id) {
        dispatchAdminNotification(body.message ?? "بارگذاری تصویر انجام نشد.", "error");
        return;
      }
      setCoverMediaId(body.data.id);
      setCoverPreviewUrl(`/api/admin/media/${body.data.id}/preview`);
      dispatchAdminNotification(body.message ?? "تصویر کاور بارگذاری شد.");
    } catch {
      dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error");
    } finally {
      setUploadingCover(false);
    }
  }

  function removeCover() {
    setCoverMediaId(null);
    setCoverPreviewUrl("");
  }

  function updateSession(key: number, field: "title", value: string) {
    setSessions((current) => current.map((session) => session.key === key ? { ...session, [field]: value } : session));
  }

  function updateSessionVideo(key: number, video: VideoDraft) {
    setSessions((current) => current.map((session) => session.key === key ? { ...session, video } : session));
  }

  function buildSessions() {
    const count = Number.parseInt(durationSessions, 10);
    if (!Number.isInteger(count) || count < 1 || count > 100) return;
    setSessions(Array.from({ length: count }, (_, index) => {
      const existing = sessions[index];
      return existing ? { ...existing, key: index + 1 } : { key: index + 1, title: "", video: { ...emptyVideo } };
    }));
    dispatchAdminNotification(`${count.toLocaleString("fa-IR")} جلسه برای دوره ساخته شد.`);
  }

  function removeSession(key: number) {
    setSessions((current) => {
      const next = current.filter((session) => session.key !== key);
      setDurationSessions(String(next.length));
      return next;
    });
  }

  function addSession() {
    setSessions((current) => {
      const nextKey = current.reduce((largest, session) => Math.max(largest, session.key), 0) + 1;
      const next = [...current, { key: nextKey, title: "", video: { ...emptyVideo } }];
      setDurationSessions(String(next.length));
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !slug.trim() || !description.trim()) {
      const message = "عنوان، اسلاگ و توضیحات دوره را وارد کنید.";
      dispatchAdminNotification(message, "error");
      return;
    }
    const requestedSessionCount = Number.parseInt(durationSessions, 10);
    if (!Number.isInteger(requestedSessionCount) || requestedSessionCount < 1) {
      const message = "تعداد جلسات دوره را وارد کنید و ابتدا روی «ساخت جلسات» بزنید.";
      dispatchAdminNotification(message, "error");
      return;
    }
    if (sessions.length !== requestedSessionCount) {
      const message = "تعداد فیلدهای جلسه با مدت دوره یکسان نیست. دوباره روی «ساخت جلسات» بزنید.";
      dispatchAdminNotification(message, "error");
      return;
    }
    const incompleteSessionIndex = sessions.findIndex((session) => !session.title.trim() || !session.video.mediaId);
    if (incompleteSessionIndex !== -1) {
      const message = `عنوان و ویدئوی جلسه ${ (incompleteSessionIndex + 1).toLocaleString("fa-IR") } را کامل کنید.`;
      dispatchAdminNotification(message, "error");
      return;
    }
    const filledSessions = sessions;
    setPending(true);
    try {
      const response = await fetch(courseId ? `/api/admin/courses/${courseId}` : "/api/admin/courses", {
        method: courseId ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: finalizeSlug(slug),
          description: description.trim(),
          priceMinor: Math.round((Number(priceMajor) || 0) * 100),
          currency: currency.trim().toUpperCase() || "USD",
          categoryId: null,
          tags,
          deliveryMode: "RECORDED",
          coverMediaId,
          instructorName: instructorName.trim(),
          durationSessions: durationSessions ? Number(durationSessions) : null,
          demoMediaId: demoVideo.mediaId,
          demoVideoDuration: demoVideo.duration,
          sessions: filledSessions.map((session) => ({ title: session.title.trim(), videoMediaId: session.video.mediaId, videoDuration: session.video.duration })),
        }),
      });
      const body = await readApiResponse(response);
      if (!response.ok || !body.ok) {
        dispatchAdminNotification(body.message ?? "ذخیره دوره انجام نشد.", "error");
        return;
      }
      dispatchAdminNotification(body.message ?? "دوره ایجاد شد.");
      router.push("/admin/courses");
      router.refresh();
    } catch {
      dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-course-create-form" onSubmit={submit} noValidate>
      <div className="admin-course-editor-layout">
        <div className="admin-course-editor-blank" aria-hidden="true" />
        <div className="admin-course-editor-main">
          <section className="admin-course-editor-section admin-course-specs-section">
            <h2>مشخصات دوره</h2>
            <p>این مشخصات روی کارت دوره و در صفحه‌ی جزئیات دوره نمایش داده می‌شود.</p>
            <div className="admin-course-cover-box">
              <div className="admin-course-cover-preview">
                {coverPreviewUrl ? <Image src={coverPreviewUrl} alt="پیش‌نمایش تصویر کاور دوره" fill unoptimized sizes="(max-width: 1100px) 100vw, 48vw" /> : <div className="admin-course-cover-empty">تصویر کاور دوره</div>}
              </div>
              <div className="admin-course-cover-controls">
                <div className="admin-course-cover-actions">
                  <label className="admin-button admin-button-secondary admin-course-file-input">
                    {uploadingCover ? "در حال بارگذاری…" : "انتخاب تصویر"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadCover} disabled={uploadingCover} />
                  </label>
                  {coverPreviewUrl ? <button type="button" className="admin-button admin-button-danger" onClick={removeCover}>حذف تصویر</button> : null}
                </div>
                <p className="admin-course-cover-hint">پیشنهاد: ۱۲۰۰ × ۱۲۰۰ پیکسل · JPG، PNG یا WebP</p>
              </div>
            </div>
            <div className="admin-course-form-grid">
              <label className="admin-form-field admin-form-field-full"><span>عنوان دوره</span><input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
              <label className="admin-form-field admin-form-field-full admin-course-slug-field"><span>اسلاگ دوره</span><input dir="ltr" value={slug} onChange={(event) => setSlug(normalizeSlug(event.target.value))} placeholder="مثلاً anxiety-course" required /></label>
              <label className="admin-form-field admin-form-field-full"><span>توضیحات دوره</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} required /></label>
              <label className="admin-form-field admin-form-field-full"><span>موضوعات مرتبط (تگ‌ها)</span><AdminCourseTags values={tags} existingTags={existingTags} onChange={setTags} /></label>
              <label className="admin-form-field"><span>مبلغ دوره</span><input type="number" min="0" step="0.01" value={priceMajor} onChange={(event) => setPriceMajor(event.target.value)} required /></label>
              <label className="admin-form-field"><span>واحد پولی</span><CustomSelect options={[{ value: "USD", label: "دلار آمریکا" }, { value: "CAD", label: "دلار کانادا" }, { value: "EUR", label: "یورو" }]} value={currency} onChange={setCurrency} placeholder="انتخاب واحد پولی" ariaLabel="واحد پولی" searchable={false} className="admin-custom-select" /></label>
            </div>
          </section>

          <section className="admin-course-editor-section">
            <h2>جزئیات دوره</h2>
            <p>این بخش فقط در صفحه‌ی جزئیات دوره نمایش داده می‌شود.</p>
            <div className="admin-course-form-grid">
              <label className="admin-form-field admin-form-field-full"><span>مدرس دوره</span><input value={instructorName} onChange={(event) => setInstructorName(event.target.value)} /></label>
              <label className="admin-form-field"><span>مدت دوره (تعداد جلسات)</span><span className="admin-course-session-input"><input type="number" min="0" max="100" step="1" value={durationSessions} onChange={(event) => setDurationSessions(event.target.value)} /><button type="button" className="admin-course-build-sessions" onClick={buildSessions} disabled={!Number.isInteger(Number(durationSessions)) || Number(durationSessions) < 1 || Number(durationSessions) > 100}>ساخت جلسات</button></span></label>
              <VideoUploadField label="ویدئوی دمو" value={demoVideo} visibility="PUBLIC" onChange={setDemoVideo} onError={(message) => dispatchAdminNotification(message, "error")} />
            </div>
          </section>

          <section className="admin-course-editor-section admin-course-sessions-section">
            <div className="admin-course-section-heading"><div><h2>جلسات دوره</h2></div><span className="admin-course-session-count">{sessions.length.toLocaleString("fa-IR")} جلسه</span></div>
            <div className="admin-course-session-list">
              {sessions.map((session, index) => <div className="admin-course-session-row" key={session.key}>
                <span className="admin-course-session-number">{(index + 1).toLocaleString("fa-IR")}</span>
                <label className="admin-form-field"><span>عنوان جلسه</span><input value={session.title} onChange={(event) => updateSession(session.key, "title", event.target.value)} /></label>
                <VideoUploadField label="ویدئوی جلسه" value={session.video} visibility="PRIVATE" onChange={(video) => updateSessionVideo(session.key, video)} onError={(message) => dispatchAdminNotification(message, "error")} />
                <button type="button" className="admin-course-session-delete" aria-label={`حذف جلسه ${(index + 1).toLocaleString("fa-IR")}`} onClick={() => removeSession(session.key)}>×</button>
              </div>)}
            </div>
            <div className="admin-course-session-actions">
              <button type="button" className="admin-button admin-button-secondary" onClick={addSession}>افزودن جلسه</button>
            </div>
          </section>
        </div>
      </div>
      <div className="admin-course-actions"><button type="submit" className="admin-button admin-button-primary" disabled={pending || uploadingCover}>{pending ? "در حال ذخیره…" : "ذخیره"}</button><button type="button" className="admin-button admin-button-secondary" onClick={() => router.push("/admin/courses")} disabled={pending}>لغو تغییرات</button></div>
    </form>
  );
}
