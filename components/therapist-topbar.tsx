"use client";

import { usePathname } from "next/navigation";

const titles: Array<[string, string]> = [
  ["/therapist-panel/clients", "مراجعان من"],
  ["/therapist-panel/sessions", "جلسات من"],
  ["/therapist-panel/payouts", "پرداخت‌های من"],
  ["/therapist-panel/profile", "پروفایل و تنظیمات"],
];

export function TherapistTopbar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const pathname = usePathname();
  const title = titles.find(([href]) => pathname === href || pathname.startsWith(`${href}/`))?.[1] ?? "نمای کلی";
  return <header className="admin-topbar">
    <div className="admin-topbar-heading">
      <button type="button" className="admin-mobile-menu-toggle" aria-label="باز کردن منوی پنل متخصص" aria-controls="admin-sidebar" onClick={onOpenMenu}><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /></button>
      <span className="admin-topbar-title">{title}</span>
    </div>
    <div className="admin-topbar-actions"><span className="therapist-topbar-badge">پنل متخصص</span></div>
  </header>;
}
