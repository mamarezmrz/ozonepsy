"use client";

import { useEffect, useState } from "react";
import type { AdminSessionView } from "@/lib/admin/session";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminNotificationHost } from "@/components/admin/admin-notification-host";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export function AdminShell({ session, children }: { session: AdminSessionView; children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const preventNumberWheelChange = (event: WheelEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.type === "number" && document.activeElement === target) event.preventDefault();
    };
    document.addEventListener("wheel", preventNumberWheelChange, { capture: true, passive: false });
    return () => document.removeEventListener("wheel", preventNumberWheelChange, true);
  }, []);

  return (
    <div className={`admin-shell${mobileNavOpen ? " is-mobile-nav-open" : ""}`} dir="rtl">
      <AdminNotificationHost />
      <AdminSidebar session={session} isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      {mobileNavOpen ? <button type="button" className="admin-nav-backdrop" aria-label="بستن منوی پنل مدیریت" onClick={() => setMobileNavOpen(false)} /> : null}
      <div className="admin-main">
        <AdminTopbar session={session} onOpenMenu={() => setMobileNavOpen(true)} />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
