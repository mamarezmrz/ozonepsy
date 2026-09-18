"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export function AdminDetailsButton({ title, description }: { title: string; description?: string | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  const value = description?.trim() || "توضیحی ثبت نشده است.";
  return <>
    <button type="button" className="admin-inline-action" onClick={() => setOpen(true)}>جزئیات</button>
    {open && typeof document !== "undefined" ? createPortal(<div className="admin-details-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}>
      <section className="admin-details-modal" role="dialog" aria-modal="true" aria-labelledby="admin-details-modal-title">
        <button type="button" className="admin-modal-close" aria-label="بستن جزئیات" onClick={() => setOpen(false)}>×</button>
        <span className="admin-eyebrow">جزئیات</span>
        <h2 id="admin-details-modal-title">{title}</h2>
        <p className="admin-details-modal-copy">{value}</p>
        <button type="button" className="admin-button admin-button-secondary" onClick={() => setOpen(false)}>بستن</button>
      </section>
    </div>, document.body) : null}
  </>;
}
