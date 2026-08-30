"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import type { AdminSessionView } from "@/lib/admin/session";

const links = [
  { href: "/", label: "نمای کلی", permission: "dashboard.view" },
  { href: "/users", label: "کاربران", permission: "users.read" },
  { href: "/products", label: "محصولات", permission: "products.read" },
  { href: "/sessions", label: "جلسات", permission: "sessions.read" },
  { href: "/audit-logs", label: "گزارش فعالیت", permission: "audit.read" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ session }: { session: AdminSessionView }) {
  const pathname = usePathname();
  const visibleLinks = links.filter((link) => session.permissions.includes(link.permission));

  return (
    <aside className="admin-sidebar" aria-label="منوی پنل مدیریت">
      <div className="admin-sidebar-brand">
        <Link href="/" className="admin-brand-mark" aria-label="اُزون">
          اُزون<span>.</span>
        </Link>
        <span className="admin-brand-caption">پنل مدیریت</span>
      </div>

      <nav className="admin-sidebar-nav">
        {visibleLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`admin-sidebar-link${isActive(pathname, link.href) ? " is-active" : ""}`}
            aria-current={isActive(pathname, link.href) ? "page" : undefined}
          >
            <span>{link.label}</span>
            <span aria-hidden="true" className="admin-sidebar-arrow">←</span>
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-role-list" aria-label="نقش‌های شما">
          {session.roles.map((role) => <span key={role}>{role}</span>)}
        </div>
        <AdminLogoutButton />
      </div>
    </aside>
  );
}
