"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";

export function TherapistClientNote({ userId, clientName, initialNote }: { userId: string; clientName: string; initialNote?: string | null }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(initialNote ?? "");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  async function save() {
    setPending(true);
    try {
      const response = await fetch(`/api/therapists/clients/${userId}/note`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const result = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) {
        dispatchAdminNotification(result.message ?? "ذخیره یادداشت انجام نشد.", "error");
        return;
      }
      dispatchAdminNotification(result.message ?? "یادداشت مراجع ذخیره شد.");
      setOpen(false);
      window.location.reload();
    } catch {
      dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error");
    } finally {
      setPending(false);
    }
  }

  return <>
    <button type="button" className="admin-inline-action" onClick={() => setOpen(true)}>{initialNote?.trim() ? "مشاهده / ویرایش" : "افزودن یادداشت"}</button>
    {open && typeof document !== "undefined" ? createPortal(<div className="admin-details-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}>
      <section className="admin-details-modal therapist-client-note-modal" role="dialog" aria-modal="true" aria-labelledby="therapist-client-note-title">
        <button type="button" className="admin-modal-close" aria-label="بستن یادداشت" onClick={() => setOpen(false)}>×</button>
        <span className="admin-eyebrow">پرونده کمکی مراجع</span>
        <h2 id="therapist-client-note-title">یادداشت درباره {clientName}</h2>
        <p className="therapist-client-note-hint">این یادداشت داخلی است و در صفحه کاربر یا سایت نمایش داده نمی‌شود.</p>
        <label className="admin-form-field"><span>توضیحات مهم</span><textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={10000} rows={8} autoFocus /></label>
        <div className="admin-form-actions"><button type="button" className="admin-button admin-button-primary" onClick={save} disabled={pending}>{pending ? "در حال ذخیره…" : "ذخیره یادداشت"}</button><button type="button" className="admin-button admin-button-secondary" onClick={() => setOpen(false)}>انصراف</button></div>
      </section>
    </div>, document.body) : null}
  </>;
}
