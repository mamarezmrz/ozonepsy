"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { TherapistSessionView } from "@/lib/auth/therapist";
import { TherapistLogoutButton } from "@/components/therapist-logout-button";

const links = [
  { href: "/therapist-panel", label: "نمای کلی" },
  { href: "/therapist-panel/clients", label: "مراجعان من" },
  { href: "/therapist-panel/sessions", label: "جلسات من" },
  { href: "/therapist-panel/services", label: "خدمات من" },
  { href: "/therapist-panel/reviews", label: "بازخوردها" },
  { href: "/therapist-panel/profile", label: "پروفایل و تنظیمات" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/therapist-panel" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function TherapistSidebar({ therapist, isOpen = false, onClose }: { therapist: TherapistSessionView; isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  return <aside id="admin-sidebar" className={`admin-sidebar${isOpen ? " is-open" : ""}`} aria-label="منوی پنل متخصص">
    <button type="button" className="admin-sidebar-close" aria-label="بستن منوی پنل متخصص" onClick={onClose}>×</button>
    <div className="admin-sidebar-profile admin-identity" title={therapist.specialist.displayName}>
      <span className="admin-identity-avatar" aria-hidden="true">{therapist.specialist.displayName.slice(0, 1)}</span>
      <span><strong>{therapist.specialist.displayName}</strong><small>متخصص اُزون</small></span>
    </div>
    <nav className="admin-sidebar-nav">
      {links.map((link) => <Link key={link.href} href={link.href} className={`admin-sidebar-link${isActive(pathname, link.href) ? " is-active" : ""}`} aria-current={isActive(pathname, link.href) ? "page" : undefined} onClick={onClose}><span>{link.label}</span><span aria-hidden="true" className="admin-sidebar-arrow" /></Link>)}
    </nav>
    <div className="admin-sidebar-footer"><TherapistLogoutButton /></div>
  </aside>;
}
