"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardIcon, type DashboardIconName } from "@/components/dashboard-icons";
import { DashboardLogout } from "@/components/dashboard-logout";

type DashboardMenuItem = readonly [string, string, DashboardIconName];

export function DashboardMobileMenu({
  items,
  activeHref,
}: {
  items: ReadonlyArray<DashboardMenuItem>;
  activeHref: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="user-dashboard-mobile-menu">
      <button
        type="button"
        className="user-dashboard-mobile-menu-toggle"
        aria-expanded={isOpen}
        aria-controls="user-dashboard-mobile-nav"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>منوی حساب کاربری</span>
        <span className={`user-dashboard-hamburger${isOpen ? " is-open" : ""}`} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </button>

      <nav
        id="user-dashboard-mobile-nav"
        className={`user-dashboard-mobile-nav${isOpen ? " is-open" : ""}`}
        aria-label="منوی حساب کاربری"
      >
        {items.map(([href, label, icon]) => (
          <Link
            key={href}
            href={href}
            className={`user-dashboard-nav-link${href === activeHref ? " is-active" : ""}`}
            onClick={() => setIsOpen(false)}
          >
            <DashboardIcon name={icon} active={href === activeHref} />
            {label}
          </Link>
        ))}
      </nav>

      {isOpen ? (
        <div className="user-dashboard-mobile-logout">
          <DashboardLogout />
        </div>
      ) : null}
    </div>
  );
}
