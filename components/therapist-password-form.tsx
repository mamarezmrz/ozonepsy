"use client";

import { FormEvent, useState } from "react";

export function TherapistPasswordForm({ firstLogin = false }: { firstLogin?: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/therapists/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())),
      });
      const body = await response.json() as { ok?: boolean; error?: string; message?: string };
      if (!response.ok || !body.ok) {
        setError(body.error ?? "تغییر رمز انجام نشد.");
        return;
      }
      setSuccess(body.message ?? "رمز عبور با موفقیت تغییر کرد.");
      event.currentTarget.reset();
      if (firstLogin) {
        // The database transaction has committed before the response arrives.
        // A full navigation avoids refreshing the still-mounted password page
        // while its server guard is redirecting after mustChangePassword flips.
        window.location.replace("/therapist-panel");
      }
    } catch {
      setError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setPending(false);
    }
  }

  return <form className="grid gap-4" noValidate onSubmit={submit}>
    <label className="grid gap-2 text-sm font-bold text-[#355859]"><span>رمز فعلی</span><input className="focus-ring rounded-xl border border-[#d8e5e5] px-4 py-3" name="currentPassword" type="password" dir="ltr" autoComplete="current-password" minLength={8} required /></label>
    <label className="grid gap-2 text-sm font-bold text-[#355859]"><span>رمز جدید</span><input className="focus-ring rounded-xl border border-[#d8e5e5] px-4 py-3" name="newPassword" type="password" dir="ltr" autoComplete="new-password" minLength={8} required /></label>
    <label className="grid gap-2 text-sm font-bold text-[#355859]"><span>تکرار رمز جدید</span><input className="focus-ring rounded-xl border border-[#d8e5e5] px-4 py-3" name="passwordConfirmation" type="password" dir="ltr" autoComplete="new-password" minLength={8} required /></label>
    {error ? <p className="rounded-xl bg-[#fff5f5] p-4 text-sm text-[#db4244]" role="alert">{error}</p> : null}
    {success ? <p className="rounded-xl bg-[#ebf7f7] p-4 text-sm font-bold text-[#355859]" role="status">{success}</p> : null}
    <button className="rounded-xl bg-[#0f8b8d] px-4 py-3 font-bold text-white transition hover:bg-[#0c7779] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={pending}>{pending ? "در حال ذخیره…" : "تغییر رمز عبور"}</button>
  </form>;
}
