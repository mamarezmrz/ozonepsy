"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminMediaUploadForm() {
  const router = useRouter();
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setError(""); setPending(true);
    try { const response = await fetch("/api/admin/media", { method: "POST", credentials: "same-origin", body: new FormData(event.currentTarget) }); const body = await response.json() as { ok?: boolean; message?: string }; if (!response.ok || !body.ok) { setError(body.message ?? "بارگذاری انجام نشد."); return; } setMessage(body.message ?? "رسانه بارگذاری شد."); event.currentTarget.reset(); router.refresh(); } catch { setError("ارتباط با سرور برقرار نشد."); } finally { setPending(false); }
  }
  return <form className="admin-form-stack" onSubmit={submit} encType="multipart/form-data"><label className="admin-form-field"><span>فایل تصویر</span><input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label><label className="admin-form-field"><span>قابل مشاهده برای عموم</span><select name="visibility" defaultValue="PRIVATE"><option value="PRIVATE">خصوصی</option><option value="PUBLIC">عمومی</option></select></label>{error ? <p className="admin-inline-error" role="alert">{error}</p> : null}{message ? <p className="admin-inline-success" role="status">{message}</p> : null}<button className="admin-button admin-button-primary" type="submit" disabled={pending}>{pending ? "در حال بارگذاری…" : "بارگذاری رسانه"}</button></form>;
}
