"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";

type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

type AppointmentStatusOption = {
  value: string;
  label: string;
  tone: StatusTone;
};

type AdminAppointmentStatusMenuProps = {
  appointmentId: string;
  currentStatus: string;
  options: AppointmentStatusOption[];
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

const menuWidth = 228;

export function AdminAppointmentStatusMenu({ appointmentId, currentStatus, options }: AdminAppointmentStatusMenuProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0, width: menuWidth });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(menuWidth, window.innerWidth - 32);
    const estimatedHeight = 280;
    const top = rect.bottom + 8 + estimatedHeight <= window.innerHeight ? rect.bottom + 8 : Math.max(16, rect.top - estimatedHeight - 8);
    const left = Math.min(Math.max(16, rect.right - width), window.innerWidth - width - 16);
    setPosition({ top, left, width });
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setPanelMounted(false), 180);
  }, []);

  useEffect(() => () => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!panelMounted) return;
    updatePosition();
    const handleViewportChange = () => updatePosition();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [panelMounted, updatePosition]);

  useEffect(() => {
    if (!panelMounted) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) closeMenu();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, panelMounted]);

  function openMenu() {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    updatePosition();
    setPanelMounted(true);
    window.requestAnimationFrame(() => setOpen(true));
  }

  async function changeStatus(nextStatus: string) {
    if (nextStatus === currentStatus || pendingStatus) {
      if (nextStatus === currentStatus) closeMenu();
      return;
    }

    setPendingStatus(nextStatus);
    try {
      const response = await fetch(`/api/admin/sessions/${appointmentId}/status`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus, reason: "تغییر وضعیت از جدول جلسات پنل مدیریت" }),
      });
      const body = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !body.ok) {
        dispatchAdminNotification(body.message ?? "تغییر وضعیت انجام نشد.", "error");
        return;
      }

      const option = options.find((item) => item.value === nextStatus);
      dispatchAdminNotification(`وضعیت جلسه به «${option?.label ?? "جدید"}» تغییر کرد.`);
      closeMenu();
      router.refresh();
    } catch {
      dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error");
    } finally {
      setPendingStatus(null);
    }
  }

  const panel = <div ref={panelRef} className="admin-status-menu-panel" data-open={open} aria-hidden={!open} style={{ top: position.top, left: position.left, width: position.width }}>
    <strong>تغییر وضعیت جلسه</strong>
    <div className="admin-status-options" role="radiogroup" aria-label="وضعیت جدید جلسه">
      {options.map((option) => <button key={option.value} type="button" className={`admin-status-option${currentStatus === option.value ? " is-current" : ""}`} aria-pressed={currentStatus === option.value} onClick={() => void changeStatus(option.value)} disabled={!open || pendingStatus !== null}>
        <span className={`admin-status-badge admin-status-${option.tone}`}>{option.label}</span>
        {pendingStatus === option.value ? <small>در حال ذخیره…</small> : currentStatus === option.value ? <small>وضعیت فعلی</small> : null}
      </button>)}
    </div>
  </div>;

  return <span ref={rootRef} className="admin-status-menu">
    <button ref={triggerRef} type="button" className="admin-status-menu-trigger" aria-expanded={open} aria-haspopup="true" onClick={() => { if (open) closeMenu(); else openMenu(); }}>
      <span>تغییر وضعیت</span>
      <span className={`site-header-consultation-chevron${open ? " is-open" : ""}`} aria-hidden="true" />
    </button>
    {panelMounted && typeof document !== "undefined" ? createPortal(panel, document.body) : null}
  </span>;
}
