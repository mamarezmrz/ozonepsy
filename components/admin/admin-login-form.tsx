"use client";

import { useState } from "react";

export function AdminLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          rememberMe: form.get("rememberMe") === "on",
        }),
      });
      const body = await response.json() as { ok?: boolean; message?: string; error?: string };
      if (!response.ok || !body.ok) {
        setError(body.message ?? body.error ?? "ورود انجام نشد.");
        return;
      }

      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      window.location.assign(safeNext);
    } catch {
      setError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="admin-login-form space-y-5" noValidate>
      <label className="block text-sm text-[#3b4040]">
        ایمیل
        <input name="email" type="email" autoComplete="username" required dir="ltr" className="mt-2 h-12 w-full rounded-[16px] bg-[#e8eded] px-4 outline-none transition focus:ring-2 focus:ring-[#73bebf]" />
      </label>
      <label className="block text-sm text-[#3b4040]">
        رمز ورود
        <input name="password" type="password" autoComplete="current-password" required dir="ltr" className="mt-2 h-12 w-full rounded-[16px] bg-[#e8eded] px-4 outline-none transition focus:ring-2 focus:ring-[#73bebf]" />
      </label>
      <label className="admin-login-remember">
        <input name="rememberMe" type="checkbox" />
        <span className="admin-login-remember-box" aria-hidden="true">✓</span>
        <span>مرا به خاطر بسپار</span>
      </label>
      {error ? <p role="alert" className="rounded-[14px] bg-[#fff5f5] px-4 py-3 text-sm leading-6 text-[#db4244]">{error}</p> : null}
      <button type="submit" disabled={pending} className="h-12 w-full rounded-[18px] bg-[#f0aa7e] text-[#3b4040] transition hover:bg-[#e99a69] disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? "در حال ورود…" : "ورود"}
      </button>
    </form>
  );
}
