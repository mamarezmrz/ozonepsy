"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

type Mode = "request" | "reset";

export function PasswordRecoveryPage({ mode }: { mode: Mode }) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setPending(true);

    try {
      const body = mode === "request"
        ? { email }
        : { token: searchParams.get("token") ?? "", password, passwordConfirmation };
      const response = await fetch(`/api/auth/${mode === "request" ? "forgot-password" : "reset-password"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json() as { ok?: boolean; message?: string; error?: string; devToken?: string };
      if (!response.ok || !result.ok) {
        setError(result.error ?? "درخواست انجام نشد.");
        return;
      }
      setMessage(result.devToken ? `${result.message} توکن توسعه: ${result.devToken}` : (result.message ?? "عملیات با موفقیت انجام شد."));
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="recovery-title">
        <h1 id="recovery-title">{mode === "request" ? "بازیابی رمز ورود" : "تعیین رمز جدید"}</h1>
        <p>{mode === "request" ? "ایمیل حساب کاربری خود را وارد کنید." : "رمز جدید خود را انتخاب کنید."}</p>
        <form onSubmit={handleSubmit}>
          {mode === "request" ? <label className="auth-field"><span>ایمیل</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" dir="ltr" /></label> : <>
            <label className="auth-field"><span>رمز جدید</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={12} maxLength={128} autoComplete="new-password" /></label>
            <label className="auth-field"><span>تکرار رمز جدید</span><input type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} required minLength={12} maxLength={128} autoComplete="new-password" /></label>
          </>}
          {error ? <p className="auth-form-error" role="alert">{error}</p> : null}
          {message ? <p className="auth-form-success" role="status">{message}</p> : null}
          <button type="submit" className="auth-submit" disabled={pending}>{pending ? "در حال ارسال…" : "ادامه"}</button>
        </form>
        <Link href="/login">بازگشت به ورود</Link>
      </section>
    </main>
  );
}
