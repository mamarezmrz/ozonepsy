"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function ScrollToTopButton() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const isDashboardPage = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  useEffect(() => {
    if (isDashboardPage) return;

    const handleScroll = () => setVisible(window.scrollY > 320);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDashboardPage]);

  if (isDashboardPage) return null;

  return (
    <button
      type="button"
      className={`scroll-to-top focus-ring${visible ? " is-visible" : ""}`}
      aria-label="بازگشت به ابتدای صفحه"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12L12 5L19 12M12 5V19" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    </button>
  );
}
