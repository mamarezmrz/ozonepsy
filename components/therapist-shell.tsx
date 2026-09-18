"use client";

import { useEffect, useState } from "react";
import type { TherapistSessionView } from "@/lib/auth/therapist";
import { AdminNotificationHost } from "@/components/admin/admin-notification-host";
import { TherapistSidebar } from "@/components/therapist-sidebar";
import { TherapistTopbar } from "@/components/therapist-topbar";

export function TherapistShell({ therapist, children }: { therapist: TherapistSessionView; children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [mobileNavOpen]);

  useEffect(() => {
    const preventNumberWheelChange = (event: WheelEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.type === "number" && document.activeElement === target) event.preventDefault();
    };
    document.addEventListener("wheel", preventNumberWheelChange, { capture: true, passive: false });
    return () => document.removeEventListener("wheel", preventNumberWheelChange, true);
  }, []);

  return <div className={`admin-shell therapist-shell${mobileNavOpen ? " is-mobile-nav-open" : ""}`} dir="rtl">
    <AdminNotificationHost />
    <TherapistSidebar therapist={therapist} isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    {mobileNavOpen ? <button type="button" className="admin-nav-backdrop" aria-label="بستن منوی پنل متخصص" onClick={() => setMobileNavOpen(false)} /> : null}
    <div className="admin-main">
      <TherapistTopbar onOpenMenu={() => setMobileNavOpen(true)} />
      <main className="admin-content">{children}</main>
    </div>
  </div>;
}
