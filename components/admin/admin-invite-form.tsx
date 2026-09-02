"use client";

import { useState } from "react";

export function AdminInviteForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setPending(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/admins", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) });
      const body = await response.json() as { ok?: boolean; message?: string; data?: { invitePath?: string }; fieldErrors?: Record<string, string> };
      if (!response.ok || !body.ok || !body.data?.invitePath) { setError(body.fieldErrors ? Object.values(body.fieldErrors)[0] ?? "اطلاعات معتبر نیست." : "ساخت دعوت‌نامه انجام نشد."); return; }
      setMessage(`${body.message ?? "دعوت‌نامه ساخته شد."} لینک: ${window.location.origin}${body.data.invitePath}`);
      event.currentTarget.reset();
    } catch { setError("ارتباط با سرور برقرار نشد."); } finally { setPending(false); }
  }

  return <form className="admin-form-stack" onSubmit={submit} noValidate>
    <label className="admin-form-field"><span>ایمیل</span><input name="email" type="email" required dir="ltr" /></label>
    <label className="admin-form-field"><span>نقش</span><select name="role" defaultValue="ADMIN"><option value="ADMIN">مدیر</option><option value="CONTENT_MANAGER">مدیر محتوا</option><option value="SUPPORT">پشتیبانی</option><option value="INSTRUCTOR">مدرس</option><option value="SUPER_ADMIN">ادمین ارشد</option></select></label>
    <label className="admin-form-field"><span>دلیل (اختیاری)</span><textarea name="reason" maxLength={1000} /></label>
    {error ? <p className="admin-inline-error" role="alert">{error}</p> : null}
    {message ? <p className="admin-inline-success" role="status">{message}</p> : null}
    <button type="submit" className="admin-button admin-button-primary" disabled={pending}>{pending ? "در حال ساخت…" : "ساخت دعوت‌نامه"}</button>
  </form>;
}
