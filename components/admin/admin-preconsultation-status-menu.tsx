"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";

type Option = { value: string; label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" };

export function AdminPreconsultationStatusMenu({ requestId, currentStatus, options }: { requestId: string; currentStatus: string; options: Option[] }) {
  const router = useRouter();
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pending, setPending] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 228 });

  const close = useCallback(() => {
    setOpen(false);
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMounted(false), 180);
  }, []);

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(228, window.innerWidth - 32);
    const estimatedHeight = options.length * 48 + 54;
    const top = rect.bottom + estimatedHeight + 8 < window.innerHeight ? rect.bottom + 8 : Math.max(16, rect.top - estimatedHeight - 8);
    const left = Math.min(Math.max(16, rect.right - width), window.innerWidth - width - 16);
    setPosition({ top, left, width });
  }, [options.length]);

  useEffect(() => () => { if (closeTimer.current !== null) window.clearTimeout(closeTimer.current); }, []);
  useEffect(() => {
    if (!mounted) return;
    updatePosition();
    const reposition = () => updatePosition();
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) close();
    };
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", keydown);
    };
  }, [mounted, updatePosition, close]);

  function openMenu() {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    updatePosition();
    setMounted(true);
    window.requestAnimationFrame(() => setOpen(true));
  }

  async function changeStatus(status: string) {
    if (status === currentStatus) { close(); return; }
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/admin/preconsultation-requests/${requestId}/status`, { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
      const body = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !body.ok) { dispatchAdminNotification(body.message ?? "وضعیت درخواست تغییر نکرد.", "error"); return; }
      dispatchAdminNotification(`وضعیت درخواست به «${options.find((option) => option.value === status)?.label ?? "جدید"}» تغییر کرد.`);
      close();
      router.refresh();
    } catch {
      dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error");
    } finally { setPending(false); }
  }

  return <span ref={rootRef} className="admin-status-menu">
    <button ref={triggerRef} type="button" className="admin-status-menu-trigger" aria-expanded={open} aria-haspopup="true" onClick={() => open ? close() : openMenu()}>
      <span>تغییر وضعیت</span><span className={`site-header-consultation-chevron${open ? " is-open" : ""}`} aria-hidden="true" />
    </button>
    {mounted && typeof document !== "undefined" ? createPortal(<div ref={panelRef} className="admin-status-menu-panel" data-open={open} aria-hidden={!open} style={{ top: position.top, left: position.left, width: position.width }}>
      <strong>وضعیت درخواست</strong>
      <div className="admin-status-options" role="radiogroup" aria-label="وضعیت جدید درخواست">
        {options.map((option) => <button key={option.value} type="button" className={`admin-status-option${currentStatus === option.value ? " is-current" : ""}`} aria-pressed={currentStatus === option.value} onClick={() => void changeStatus(option.value)} disabled={!open || pending}>
          <span className={`admin-status-badge admin-status-${option.tone}`}>{option.label}</span>{pending ? <small>در حال ذخیره…</small> : currentStatus === option.value ? <small>وضعیت فعلی</small> : null}
        </button>)}
      </div>
    </div>, document.body) : null}
  </span>;
}
