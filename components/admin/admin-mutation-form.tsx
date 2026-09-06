"use client";

import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ApiBody = { ok?: boolean; message?: string; error?: string; fieldErrors?: Record<string, string> };

export function AdminMutationForm({
  action,
  method = "POST",
  children,
  submitLabel = "ذخیره",
  pendingLabel = "در حال ذخیره…",
  className = "admin-form-stack",
  successRedirect,
}: {
  action: string;
  method?: "POST" | "PATCH" | "PUT";
  children: ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  className?: string;
  successRedirect?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch(action, {
        method,
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json() as ApiBody;
      if (!response.ok || !body.ok) {
        setError(body.message ?? body.error ?? "عملیات انجام نشد.");
        return;
      }

      setSuccess(body.message ?? "تغییرات با موفقیت ذخیره شد.");
      if (successRedirect) router.push(successRedirect);
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className={className} onSubmit={submit} noValidate>
      {children}
      {error ? <p className="admin-inline-error" role="alert">{error}</p> : null}
      {success ? <p className="admin-inline-success" role="status">{success}</p> : null}
      <div className="admin-form-actions">
        <button type="submit" className="admin-button admin-button-primary" disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function AdminConfirmDialog({
  title,
  description,
  children,
  onCancel,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onCancel: () => void;
}) {
  return (
    <div className="admin-modal-backdrop" role="presentation">
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title">
        <button type="button" className="admin-modal-close" aria-label="بستن" onClick={onCancel}>×</button>
        <h2 id="admin-confirm-title">{title}</h2>
        {description ? <p>{description}</p> : null}
        {children}
      </section>
    </div>
  );
}
