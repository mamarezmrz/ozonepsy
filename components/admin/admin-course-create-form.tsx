"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";
import { CustomSelect } from "@/components/custom-select";
import { AdminMultiSelect } from "@/components/admin/admin-multi-select";

type CategoryOption = { id: string; title: string; slug: string };
type CoverImageMode = "BRANDED" | "PLAIN";
type VideoDraft = { mediaId: string | null; duration: number | null; fileName: string };
type SessionDraft = { key: number; title: string; video: VideoDraft };
type ApiResponse = { ok?: boolean; message?: string; data?: { id?: string }; fieldErrors?: Record<string, string> };
export type AdminCourseFormValues = {
  title?: string;
  slug?: string;
  description?: string;
  priceMinor?: number;
  currency?: string;
  categoryId?: string | null;
  categorySlugs?: string[];
  coverMediaId?: string | null;
  coverImageMode?: CoverImageMode;
  instructorName?: string | null;
  durationSessions?: number | null;
  demoMediaId?: string | null;
  demoVideoDuration?: number | null;
  demoVideoName?: string;
  sessions?: Array<{ title: string; videoMediaId?: string | null; videoDuration?: number | null; videoName?: string }>;
};
const emptyVideo: VideoDraft = { mediaId: null, duration: null, fileName: "" };
const courseCategoryOptions = [
  { value: "individual-consultation", label: "مشاوره فردی" },
  { value: "couples-and-relationships", label: "زوج و رابطه" },
  { value: "children-and-adolescents", label: "کودک و نوجوان" },
  { value: "group-therapy", label: "گروه درمانی" },
] as const;

function normalizeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/[\s-]+/g, "-").replace(/^-+|-+$/g, "");
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

export function AdminCourseCreateForm({ categories, values = {}, courseId }: { categories: CategoryOption[]; values?: AdminCourseFormValues; courseId?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(values.title ?? "");
  const [slug, setSlug] = useState(values.slug ?? "");
  const [description, setDescription] = useState(values.description ?? "");
  const [categorySlugs, setCategorySlugs] = useState<string[]>(values.categorySlugs ?? []);
  const [priceMajor, setPriceMajor] = useState(values.priceMinor === undefined ? "0" : String(values.priceMinor / 100));
  const [currency, setCurrency] = useState(values.currency === "EUR" ? "EUR" : "USD");
  const [instructorName, setInstructorName] = useState(values.instructorName ?? "");
  const [durationSessions, setDurationSessions] = useState(values.durationSessions ? String(values.durationSessions) : "");
  const [demoVideo, setDemoVideo] = useState<VideoDraft>({ mediaId: values.demoMediaId ?? null, duration: values.demoVideoDuration ?? null, fileName: values.demoVideoName ?? (values.demoMediaId ? "ویدئوی بارگذاری‌شده" : "") });
  const [coverMediaId, setCoverMediaId] = useState<string | null>(values.coverMediaId ?? null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(values.coverMediaId ? `/api/admin/media/${values.coverMediaId}/preview` : "");
  const [coverImageMode, setCoverImageMode] = useState<CoverImageMode>(values.coverImageMode ?? "BRANDED");
  const [sessions, setSessions] = useState<SessionDraft[]>(values.sessions?.length ? values.sessions.map((session, index) => ({ key: index + 1, title: session.title, video: { mediaId: session.videoMediaId ?? null, duration: session.videoDuration ?? null, fileName: session.videoName ?? (session.videoMediaId ? "ویدئوی بارگذاری‌شده" : "") } })) : [{ key: 1, title: "", video: { ...emptyVideo } }]);
  const [nextSessionKey, setNextSessionKey] = useState((values.sessions?.length ?? 0) + 1);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingCover(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("visibility", "PUBLIC");
    try {
      const response = await fetch("/api/admin/media", { method: "POST", credentials: "same-origin", body: form });
      const body = await readApiResponse(response);
      if (!response.ok || !body.ok || !body.data?.id) {
        setError(body.message ?? "بارگذاری تصویر انجام نشد.");
        return;
      }
      setCoverMediaId(body.data.id);
      setCoverPreviewUrl(`/api/admin/media/${body.data.id}/preview`);
      dispatchAdminNotification(body.message ?? "تصویر کاور بارگذاری شد.");
    } catch {
      setError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
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

  function addSession() {
    setSessions((current) => [...current, { key: nextSessionKey, title: "", video: { ...emptyVideo } }]);
    setNextSessionKey((current) => current + 1);
  }

  function removeSession(key: number) {
    setSessions((current) => current.length === 1 ? current : current.filter((session) => session.key !== key));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !slug.trim() || !description.trim()) {
      setError("عنوان، اسلاگ و توضیحات دوره را وارد کنید.");
      return;
    }
    const filledSessions = sessions.filter((session) => session.title.trim());
    const hasIncompleteSession = sessions.some((session) => !session.title.trim() && session.video.mediaId);
    if (hasIncompleteSession) {
      setError("برای هر ویدئوی جلسه، عنوان همان جلسه را هم وارد کنید.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(courseId ? `/api/admin/courses/${courseId}` : "/api/admin/courses", {
        method: courseId ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: normalizeSlug(slug),
          description: description.trim(),
          priceMinor: Math.round((Number(priceMajor) || 0) * 100),
          currency: currency.trim().toUpperCase() || "USD",
          categoryId: categories.find((category) => category.slug === categorySlugs[0])?.id ?? null,
          categorySlugs,
          deliveryMode: "RECORDED",
          coverMediaId,
          coverImageMode,
          instructorName: instructorName.trim(),
          durationSessions: durationSessions ? Number(durationSessions) : null,
          demoMediaId: demoVideo.mediaId,
          demoVideoDuration: demoVideo.duration,
          sessions: filledSessions.map((session) => ({ title: session.title.trim(), videoMediaId: session.video.mediaId, videoDuration: session.video.duration })),
        }),
      });
      const body = await readApiResponse(response);
      if (!response.ok || !body.ok) {
        setError(body.message ?? "ذخیره دوره انجام نشد.");
        return;
      }
      dispatchAdminNotification(body.message ?? "دوره ایجاد شد.");
      router.push("/courses");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
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
                {coverPreviewUrl ? <><Image src={coverPreviewUrl} alt="پیش‌نمایش تصویر کاور دوره" fill unoptimized sizes="(max-width: 1100px) 100vw, 48vw" />{coverImageMode === "BRANDED" ? <span className="admin-course-cover-branding" aria-hidden="true"><Image src="/ozone-logo.svg" alt="" width={124} height={124} /></span> : null}</> : <div className="admin-course-cover-empty">تصویر کاور دوره</div>}
              </div>
              <div className="admin-course-cover-controls">
                <span className="admin-course-control-label">حالت نمایش تصویر</span>
                <div className="admin-course-cover-modes">
                  <button type="button" className={`admin-course-cover-mode${coverImageMode === "BRANDED" ? " is-active" : ""}`} onClick={() => setCoverImageMode("BRANDED")}>
                    <span className="admin-course-cover-mode-preview is-branded"><Image src="/ozone-logo.svg" alt="" width={18} height={18} /></span>
                    <span>با لوگو و دایره‌ها</span>
                  </button>
                  <button type="button" className={`admin-course-cover-mode${coverImageMode === "PLAIN" ? " is-active" : ""}`} onClick={() => setCoverImageMode("PLAIN")}>
                    <span className="admin-course-cover-mode-preview">تصویر</span>
                    <span>بدون لوگو</span>
                  </button>
                </div>
                <div className="admin-course-cover-actions">
                  <label className="admin-button admin-button-secondary admin-course-file-input">
                    {uploadingCover ? "در حال بارگذاری…" : "انتخاب تصویر"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadCover} disabled={uploadingCover} />
                  </label>
                  {coverPreviewUrl ? <button type="button" className="admin-button admin-button-danger" onClick={removeCover}>حذف تصویر</button> : null}
                </div>
              </div>
            </div>
            <div className="admin-course-form-grid">
              <label className="admin-form-field admin-form-field-full"><span>عنوان دوره</span><input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
              <label className="admin-form-field admin-form-field-full admin-course-slug-field"><span>اسلاگ دوره</span><input dir="ltr" value={slug} onChange={(event) => setSlug(normalizeSlug(event.target.value))} placeholder="مثلاً anxiety-course" required /></label>
              <label className="admin-form-field admin-form-field-full"><span>توضیحات دوره</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} required /></label>
              <label className="admin-form-field admin-form-field-full"><span>موضوعات مرتبط (حوزه‌ها)</span><AdminMultiSelect options={courseCategoryOptions} values={categorySlugs} onChange={setCategorySlugs} placeholder="حوزه‌ها را انتخاب کنید" ariaLabel="حوزه‌های مرتبط دوره" /></label>
              <label className="admin-form-field"><span>مبلغ دوره</span><input type="number" min="0" step="0.01" value={priceMajor} onChange={(event) => setPriceMajor(event.target.value)} required /></label>
              <label className="admin-form-field"><span>واحد پولی</span><CustomSelect options={[{ value: "USD", label: "دلار" }, { value: "EUR", label: "یورو" }]} value={currency} onChange={setCurrency} placeholder="انتخاب واحد پولی" ariaLabel="واحد پولی" searchable={false} className="admin-custom-select" /></label>
            </div>
          </section>

          <section className="admin-course-editor-section">
            <h2>جزئیات دوره</h2>
            <p>این بخش فقط در صفحه‌ی جزئیات دوره نمایش داده می‌شود.</p>
            <div className="admin-course-form-grid">
              <label className="admin-form-field admin-form-field-full"><span>مدرس دوره</span><input value={instructorName} onChange={(event) => setInstructorName(event.target.value)} /></label>
              <label className="admin-form-field"><span>مدت دوره (تعداد جلسات)</span><input type="number" min="1" value={durationSessions} onChange={(event) => setDurationSessions(event.target.value)} /></label>
              <VideoUploadField label="ویدئوی دمو" value={demoVideo} visibility="PUBLIC" onChange={setDemoVideo} onError={setError} />
            </div>
          </section>

          <section className="admin-course-editor-section admin-course-sessions-section">
            <div className="admin-course-section-heading"><div><h2>جلسات دوره</h2><p>برای هر جلسه یک ردیف جدید بسازید.</p></div><span className="admin-course-session-count">{sessions.length.toLocaleString("fa-IR")} جلسه</span></div>
            <div className="admin-course-session-list">
              {sessions.map((session, index) => <div className="admin-course-session-row" key={session.key}>
                <span className="admin-course-session-number">{(index + 1).toLocaleString("fa-IR")}</span>
                <label className="admin-form-field"><span>عنوان جلسه</span><input value={session.title} onChange={(event) => updateSession(session.key, "title", event.target.value)} /></label>
                <VideoUploadField label="ویدئوی جلسه" value={session.video} visibility="PRIVATE" onChange={(video) => updateSessionVideo(session.key, video)} onError={setError} />
                <button type="button" className="admin-course-session-delete" aria-label={`حذف جلسه ${(index + 1).toLocaleString("fa-IR")}`} onClick={() => removeSession(session.key)} disabled={sessions.length === 1}>×</button>
              </div>)}
            </div>
            <button type="button" className="admin-course-add-session" onClick={addSession}>+ افزودن جلسه</button>
          </section>
        </div>
      </div>
      {error ? <p className="admin-course-error" role="alert">{error}</p> : null}
      <div className="admin-course-actions"><button type="submit" className="admin-button admin-button-primary" disabled={pending || uploadingCover}>{pending ? "در حال ذخیره…" : "ذخیره"}</button><button type="button" className="admin-button admin-button-secondary" onClick={() => router.push("/courses")} disabled={pending}>لغو تغییرات</button></div>
    </form>
  );
}
