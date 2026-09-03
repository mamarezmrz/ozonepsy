"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";

type AdminActionButtonProps = {
  action: string;
  label: string;
  method?: "POST" | "PATCH" | "DELETE";
  variant?: "primary" | "secondary" | "danger";
  confirm?: string;
  reasonRequired?: boolean;
  body?: Record<string, unknown>;
  successMessage?: string;
};

export function AdminActionButton({ action, label, method = "POST", variant = "secondary", confirm, reasonRequired = false, body, successMessage }: AdminActionButtonProps) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      triggerRef.current?.focus();
      return;
    }

    (reasonRequired ? reasonRef.current : cancelRef.current)?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        setOpen(false);
        setError(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, pending, reasonRequired]);

  function requestAction() {
    setError(null);
    if (confirm || reasonRequired) {
      setReason("");
      setOpen(true);
      return;
    }
    void executeAction();
  }

  async function executeAction() {
    if (reasonRequired && !reason.trim()) {
      setError("دلیل این عملیات را وارد کنید.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch(action, {
        method,
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: method === "DELETE" ? undefined : JSON.stringify({ ...body, ...(reason.trim() ? { reason: reason.trim() } : {}) }),
      });
      const responseBody = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !responseBody.ok) {
        setError(responseBody.message ?? "عملیات انجام نشد.");
        return;
      }

      setOpen(false);
      setReason("");
      if (successMessage) {
        dispatchAdminNotification(successMessage);
      }
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="admin-action-control">
      <button ref={triggerRef} type="button" className={`admin-button admin-button-${variant}`} onClick={requestAction} disabled={pending}>
        {pending ? "در حال انجام…" : label}
      </button>
      {error && !open ? <small className="admin-inline-error" role="alert">{error}</small> : null}
      {open ? (
        <div className="admin-modal-backdrop" role="presentation">
          <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-action-title" aria-describedby="admin-action-description">
            <button ref={cancelRef} type="button" className="admin-modal-close" aria-label="بستن" onClick={() => { if (!pending) { setOpen(false); setError(null); } }} disabled={pending}>×</button>
            <h2 id="admin-action-title">تأیید عملیات</h2>
            <p id="admin-action-description">{confirm ?? `آیا از انجام «${label}» مطمئن هستید؟`}</p>
            {reasonRequired ? <label className="admin-modal-field"><span>دلیل عملیات</span><textarea ref={reasonRef} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="دلیل این عملیات را وارد کنید…" aria-required="true" /></label> : null}
            {error ? <p className="admin-inline-error" role="alert">{error}</p> : null}
            <div className="admin-modal-actions">
              <button type="button" className="admin-button admin-button-secondary" onClick={() => { if (!pending) { setOpen(false); setError(null); } }} disabled={pending}>انصراف</button>
              <button type="button" className={`admin-button admin-button-${variant}`} onClick={() => void executeAction()} disabled={pending || (reasonRequired && !reason.trim())}>{pending ? "در حال انجام…" : "تأیید"}</button>
            </div>
          </section>
        </div>
      ) : null}
    </span>
  );
}
