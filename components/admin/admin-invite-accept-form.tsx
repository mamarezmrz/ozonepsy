"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminInviteAcceptForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch(`/api/admin/invites/${encodeURIComponent(token)}`, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) });
      const body = await response.json() as { ok?: boolean; message?: string; error?: string; fieldErrors?: Record<string, string> };
      if (!response.ok || !body.ok) { setError(body.message ?? body.error ?? Object.values(body.fieldErrors ?? {})[0] ?? "پذیرش دعوت‌نامه انجام نشد."); return; }
      router.replace("/");
    } catch { setError("ارتباط با سرور برقرار نشد."); } finally { setPending(false); }
  }

  return <form className="admin-form-stack" onSubmit={submit} noValidate>
    <label className="admin-form-field"><span>نام</span><input name="firstName" maxLength={100} required /></label>
    <label className="admin-form-field"><span>نام خانوادگی</span><input name="lastName" maxLength={100} required /></label>
    <label className="admin-form-field"><span>رمز ورود</span><input name="password" type="password" minLength={12} maxLength={200} required autoComplete="new-password" dir="ltr" /></label>
    {error ? <p className="admin-inline-error" role="alert">{error}</p> : null}
    <button type="submit" className="admin-button admin-button-primary" disabled={pending}>{pending ? "در حال فعال‌سازی…" : "فعال‌سازی حساب"}</button>
  </form>;
}
