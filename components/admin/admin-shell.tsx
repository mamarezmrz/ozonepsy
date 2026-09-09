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
