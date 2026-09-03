"use client";

/* Avatar URLs may come from local or future object storage. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { ADMIN_ROLE_LABELS } from "@/lib/admin/constants";
import type { AdminSessionView } from "@/lib/admin/session";

const links = [
  { href: "/", label: "نمای کلی", permission: "dashboard.view" },
  { href: "/users", label: "کاربران", permission: "users.read" },
  { href: "/courses", label: "دوره‌ها", permission: "courses.read" },
  { href: "/specialists", label: "متخصصان", permission: "instructors.read" },
  { href: "/sessions", label: "جلسات", permission: "sessions.read" },
  { href: "/reviews", label: "نظرات", permission: "reviews.read" },
  { href: "/categories", label: "دسته‌بندی‌ها", permission: "categories.read" },
  { href: "/consultation-benefits", label: "مزایای مشاوره", permission: "content.read" },
  { href: "/consultation-issues", label: "مشکلات حوزه‌های مشاوره", permission: "content.read" },
  { href: "/audit-logs", label: "گزارش فعالیت", permission: "audit.read" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ session }: { session: AdminSessionView }) {
  const pathname = usePathname();
  const visibleLinks = links.filter((link) => session.permissions.includes(link.permission));
  const identity = session.displayName?.trim() || session.email;

  return (
    <aside className="admin-sidebar" aria-label="منوی پنل مدیریت">
      <div className="admin-sidebar-profile admin-identity" title={identity}>
        <span className="admin-identity-avatar" aria-hidden="true">
          {session.avatarUrl ? <img src={session.avatarUrl} alt="" /> : identity.slice(0, 1).toUpperCase()}
        </span>
        <span>
          <strong>{identity}</strong>
          <small>{session.roles.map((role) => ADMIN_ROLE_LABELS[role] ?? "ادمین").join("، ")}</small>
        </span>
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
            <span aria-hidden="true" className="admin-sidebar-arrow" />
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <AdminLogoutButton />
      </div>
    </aside>
  );
}
