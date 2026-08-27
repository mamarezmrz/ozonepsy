"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthModal, type AuthModalMode } from "@/components/auth-modal";
import { SiteNotification } from "@/components/site-notification";
import { consultationTopics } from "@/lib/consultation-topics";
import { groupTherapySessions } from "@/lib/group-therapy";
import { institutionProfiles } from "@/lib/institutions";
import { therapistProfiles } from "@/lib/therapists";
import type { SiteHeaderUser } from "@/types/site-header";

const consultationLinks = [
  ["مشاوره فردی", "/consultations/individual"],
  ["زوج و رابطه", "/consultations/couples"],
  ["کودک و نوجوان", "/consultations/teenagers"],
  ["گروه درمانی", "/group-therapy"],
] as const;

const navigationLinks = [
  ["دوره‌های روانشناسی", "/courses"],
  ["قیمت گذاری و خرید", "/pricing"],
  ["همکاران اُزون", "/partners"],
  ["صندوق حمایت", "/support-fund"],
  ["درباره ما", "/about"],
  ["تماس با ما", "/contact"],
] as const;

const breadcrumbLabels: Record<string, string> = {
  "/consultations": "حوزه‌های مشاوره",
  "/courses": "دوره‌های روانشناسی",
  "/group-therapy": "گروه درمانی",
  "/therapists": "مشاوران اُزون",
  "/pricing": "قیمت‌گذاری و خرید",
  "/support-fund": "صندوق حمایت",
  "/partners": "همکاران اُزون",
  "/about": "درباره ما",
  "/contact": "تماس با ما",
  "/free-session": "پیش‌مشاوره رایگان",
  "/login": "ورود",
  "/signup": "ثبت‌نام",
  "/dashboard": "داشبورد",
  "/admin": "مدیریت اُزون",
  "/payment/success": "پرداخت موفق",
  "/payment/failure": "پرداخت ناموفق",
  "/payment/return": "بازگشت از پرداخت",
};

function getBreadcrumbLabel(pathname: string) {
  if (breadcrumbLabels[pathname]) return breadcrumbLabels[pathname];
  if (pathname.startsWith("/consultations/")) {
    const category = pathname.split("/")[2];
    if (category === "individual" && pathname.split("/")[3]) {
      const slug = pathname.split("/")[3];
      return consultationTopics.find((topic) => topic.slug === slug)?.title ?? "جزئیات مشاوره فردی";
    }
    return category === "couples" ? "زوج و رابطه" : category === "teenagers" ? "کودک و نوجوان" : "مشاوره فردی";
  }
  if (pathname.startsWith("/courses/")) return "جزئیات دوره";
  if (pathname.startsWith("/group-therapy/")) {
    const slug = pathname.split("/")[2];
    return groupTherapySessions.find((session) => session.slug === slug)?.title ?? "جزئیات جلسه گروه‌درمانی";
  }
  if (pathname.startsWith("/therapists/")) {
    const slug = pathname.split("/")[2];
    return therapistProfiles.find((profile) => profile.slug === slug)?.name ?? "جزئیات مشاور";
  }
  if (pathname.startsWith("/institutes/")) {
    const slug = pathname.split("/")[2];
    return institutionProfiles.find((profile) => profile.slug === slug)?.name ?? "جزئیات موسسه";
  }
  if (pathname.startsWith("/checkout/")) return "تکمیل سفارش";
  if (pathname.startsWith("/dashboard/")) return "داشبورد";
  if (pathname.startsWith("/admin/")) return "مدیریت اُزون";
  return "صفحه";
}

export function SiteHeader({
  initialUser = null,
  showBreadcrumb = true,
}: {
  initialUser?: SiteHeaderUser | null;
  showBreadcrumb?: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [consultationsOpen, setConsultationsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>("login");
  const [headerUser, setHeaderUser] = useState<SiteHeaderUser | null>(initialUser);
  const [notification, setNotification] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const consultationsRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = Boolean(headerUser);

  useEffect(() => {
    if (!consultationsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (consultationsRef.current && !consultationsRef.current.contains(event.target as Node)) {
        setConsultationsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [consultationsOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
    setConsultationsOpen(false);
  };

  const openAuthModal = () => {
    closeMenu();
    setAuthModalMode("login");
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="site-header sticky top-0 z-40 bg-[#fafcfc]/95 backdrop-blur">
      <div className="site-header-inner container-oz">
        <Link href="/" aria-label="اُزون" className="site-header-logo" onClick={closeMenu}>
          <Image src="/ozone-logo.svg" alt="اُزون" width={48} height={48} priority loading="eager" />
        </Link>

        <nav className={`site-header-nav${menuOpen ? " is-open" : ""}`} aria-label="منوی اصلی">
          <div className="site-header-nav-links">
            <div ref={consultationsRef} className="site-header-dropdown">
              <button
                type="button"
                className="site-header-dropdown-trigger focus-ring"
                aria-expanded={consultationsOpen}
                aria-controls="consultations-submenu"
                onClick={() => setConsultationsOpen((open) => !open)}
              >
                <span>حوزه‌های مشاوره</span>
                <span className={`site-header-consultation-chevron${consultationsOpen ? " is-open" : ""}`} aria-hidden="true" />
              </button>
              {consultationsOpen && (
                <div id="consultations-submenu" className="site-header-submenu">
                  {consultationLinks.map(([label, href]) => (
                    <Link key={href} href={href} className="site-header-submenu-link focus-ring" onClick={closeMenu}>
                      <span>{label}</span>
                      <Image src="/icons/chevron-down.svg" alt="" width={16} height={16} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {navigationLinks.map(([label, href]) => (
              <Link key={href} href={href} className="site-header-nav-link focus-ring" onClick={closeMenu}>
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="site-header-actions">
          {isAuthenticated ? (
            <Link href="/dashboard" className="site-header-login focus-ring" onClick={closeMenu}>
                {headerUser?.avatarUrl ? (
        <Image className="site-header-user-avatar" src={headerUser.avatarUrl} alt="" aria-hidden="true" width={32} height={32} loading="eager" />
                ) : (
                  <span className="site-header-user-icon" aria-hidden="true" />
                )}
                <span dir="rtl">{headerUser?.label ?? "حساب کاربری"}</span>
            </Link>
          ) : (
            <button type="button" className="site-header-login focus-ring" onClick={openAuthModal} aria-haspopup="dialog" aria-expanded={authModalOpen}>
              <span className="site-header-user-icon" aria-hidden="true" />
              <span dir="rtl">ورود / ثبت نام</span>
            </button>
          )}
          <button
            type="button"
            className="site-header-menu-toggle focus-ring"
            aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>
      </div>
      </header>
      {showBreadcrumb && pathname !== "/" && (
        <nav className="page-breadcrumb" aria-label="مسیر صفحه">
          <div className="page-breadcrumb-inner container-oz">
            <Link href="/">خانه</Link>
            <span aria-hidden="true">›</span>
            {pathname.startsWith("/group-therapy/") ? (
              <>
                <Link href="/group-therapy">گروه درمانی</Link>
                <span aria-hidden="true">›</span>
                <span aria-current="page">{getBreadcrumbLabel(pathname)}</span>
              </>
            ) : pathname.startsWith("/therapists/") ? (
              <>
                <Link href="/partners">مشاوران اُزون</Link>
                <span aria-hidden="true">›</span>
                <span aria-current="page">{getBreadcrumbLabel(pathname)}</span>
              </>
            ) : pathname.startsWith("/institutes/") ? (
              <>
                <Link href="/partners">همکاران اُزون</Link>
                <span aria-hidden="true">›</span>
                <span aria-current="page">{getBreadcrumbLabel(pathname)}</span>
              </>
            ) : pathname.startsWith("/consultations/individual/") ? (
              <>
                <Link href="/consultations/individual">مشاوره فردی</Link>
                <span aria-hidden="true">›</span>
                <span aria-current="page">{getBreadcrumbLabel(pathname)}</span>
              </>
            ) : <span aria-current="page">{getBreadcrumbLabel(pathname)}</span>}
          </div>
        </nav>
      )}
      <AuthModal
        key={authModalOpen ? authModalMode : "closed"}
        open={authModalOpen}
        mode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthModalMode}
        onNotification={(message, tone = "success", user) => {
          setNotification({ message, tone });
          if (tone === "success") {
            setHeaderUser(user ?? { label: "حساب کاربری", avatarUrl: null });
          }
        }}
      />
      {notification && <SiteNotification message={notification.message} tone={notification.tone} onDismiss={() => setNotification(null)} />}
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer-inner container-oz">
        <div className="home-footer-column home-footer-steps">
          <h3 className="home-footer-heading">مراحل دریافت خدمات</h3>
          <ol className="home-footer-step-list">
            <li>۱- ثبت درخواست جلسه پیش مشاوره رایگان</li>
            <li>۲- تماس از طرف ما برای مشخص کردن زمان جلسه</li>
            <li>۳- راهنمایی بر اساس شرایط شما و انتخاب درمانگر</li>
            <li>۴- انجام جلسات مشاوره با درمانگر انتخاب شده</li>
          </ol>
          <Link href="/free-session" className="home-footer-cta">پیش مشاوره رایگان</Link>
        </div>

        <div className="home-footer-column home-footer-contact">
          <h3 className="home-footer-heading">ارتباط با ما</h3>
          <dl className="home-footer-contact-list">
            <div><dt>شماره تماس</dt><dd dir="ltr">+۹۸ ۹۱۲ ۱۳۳ ۴۵۶۷</dd></div>
            <div><dt>ایمیل</dt><dd dir="ltr">support@ozonepsy.com</dd></div>
          </dl>
          <div className="home-footer-socials" aria-label="شبکه‌های اجتماعی">
            <a href="#whatsapp" className="home-footer-social focus-ring" aria-label="واتساپ"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12.9598 2.70305C12.3147 2.05492 11.5464 1.54103 10.6998 1.19131C9.85306 0.841584 8.94488 0.663031 8.02814 0.666053C4.18693 0.666053 1.05628 3.78105 1.05628 7.60303C1.05628 8.82803 1.3799 10.018 1.98492 11.068L1 14.666L4.69347 13.7C5.71357 14.253 6.8603 14.547 8.02814 14.547C11.8693 14.547 15 11.432 15 7.61004C15 5.75504 14.2754 4.01204 12.9598 2.70305ZM8.02814 13.371C6.98693 13.371 5.96683 13.091 5.07337 12.566L4.86231 12.44L2.66734 13.014L3.25126 10.886L3.11055 10.669C2.53194 9.74997 2.22477 8.68752 2.22412 7.60303C2.22412 4.42504 4.82714 1.83505 8.0211 1.83505C9.56884 1.83505 11.0251 2.43705 12.1156 3.52905C12.6556 4.06375 13.0836 4.69982 13.3746 5.40037C13.6657 6.10092 13.814 6.852 13.8111 7.61004C13.8251 10.788 11.2221 13.371 8.02814 13.371ZM11.208 9.05903C11.0322 8.97503 10.1739 8.55503 10.0191 8.49203C9.85729 8.43603 9.74472 8.40803 9.62512 8.57603C9.50553 8.75103 9.17487 9.14303 9.07638 9.25503C8.97789 9.37403 8.87236 9.38803 8.69648 9.29703C8.5206 9.21303 7.95779 9.02403 7.29648 8.43603C6.77588 7.97403 6.43116 7.40704 6.32563 7.23204C6.22714 7.05704 6.31156 6.96604 6.40301 6.87504C6.4804 6.79804 6.57889 6.67204 6.66332 6.57404C6.74774 6.47604 6.78291 6.39904 6.8392 6.28704C6.89548 6.16804 6.86734 6.07004 6.82513 5.98604C6.78291 5.90204 6.43116 5.04804 6.29045 4.69804C6.14975 4.36204 6.00201 4.40404 5.89648 4.39704H5.55879C5.4392 4.39704 5.25628 4.43904 5.09447 4.61404C4.9397 4.78904 4.48945 5.20904 4.48945 6.06304C4.48945 6.91704 5.11558 7.74304 5.2 7.85503C5.28442 7.97403 6.43116 9.72403 8.17588 10.473C8.59095 10.655 8.91457 10.76 9.16784 10.837C9.58291 10.97 9.96281 10.949 10.2653 10.907C10.603 10.858 11.2995 10.487 11.4402 10.081C11.5879 9.67503 11.5879 9.33203 11.5387 9.25503C11.4894 9.17803 11.3839 9.14303 11.208 9.05903Z" fill="white" /></svg></a>
            <a href="#telegram" className="home-footer-social focus-ring" aria-label="تلگرام"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M13.6 7.66602C13.6 9.15123 13.01 10.5756 11.9598 11.6258C10.9096 12.676 9.48521 13.266 8 13.266C6.51479 13.266 5.09041 12.676 4.0402 11.6258C2.99 10.5756 2.4 9.15123 2.4 7.66602C2.4 6.1808 2.99 4.75642 4.0402 3.70622C5.09041 2.65601 6.51479 2.06602 8 2.06602C9.48521 2.06602 10.9096 2.65601 11.9598 3.70622C13.01 4.75642 13.6 6.1808 13.6 7.66602ZM8 14.666C11.8661 14.666 15 11.5321 15 7.66602C15 3.79992 11.8661 0.666016 8 0.666016C4.1339 0.666016 1 3.79992 1 7.66602C1 11.5321 4.1339 14.666 8 14.666ZM8.2506 5.83342C7.5702 6.11668 6.20963 6.70305 4.1689 7.59252C3.8371 7.72412 3.6635 7.85292 3.6481 7.97892C3.6215 8.19172 3.8882 8.27572 4.2515 8.38982L4.4041 8.43882C4.7611 8.55502 5.2427 8.69082 5.4926 8.69642C5.7194 8.70108 5.97233 8.60775 6.2514 8.41642C8.1582 7.12842 9.1424 6.47765 9.204 6.46412C9.2481 6.45432 9.3083 6.44172 9.3489 6.47812C9.3902 6.51452 9.386 6.58312 9.3818 6.60202C9.3552 6.71472 8.308 7.68842 7.7662 8.19172C7.60567 8.34292 7.4463 8.49528 7.2881 8.64882C6.9563 8.96872 6.7071 9.20882 7.3021 9.60082C7.9048 9.99841 8.5131 10.3946 9.1011 10.8139C9.3909 11.0211 9.6513 11.2059 9.9733 11.1772C10.1602 11.1597 10.3534 10.984 10.4514 10.459C10.6838 9.22002 11.1395 6.53342 11.2445 5.42602C11.2506 5.33416 11.2466 5.24191 11.2326 5.15092C11.2243 5.07768 11.1889 5.01023 11.1332 4.96192C11.0492 4.89332 10.9197 4.87932 10.8623 4.88002C10.5991 4.88492 10.1952 5.02492 8.2513 5.83342" fill="white" /></svg></a>
            <a href="#instagram" className="home-footer-social focus-ring" aria-label="اینستاگرام"><svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M10.3998 2.6665H21.5998C25.8665 2.6665 29.3332 6.13317 29.3332 10.3998V21.5998C29.3332 23.6508 28.5184 25.6178 27.0681 27.0681C25.6178 28.5184 23.6508 29.3332 21.5998 29.3332H10.3998C6.13317 29.3332 2.6665 25.8665 2.6665 21.5998V10.3998C2.6665 8.34883 3.48126 6.38183 4.93154 4.93154C6.38183 3.48126 8.34883 2.6665 10.3998 2.6665ZM10.1332 5.33317C8.86013 5.33317 7.63923 5.83888 6.73906 6.73906C5.83888 7.63923 5.33317 8.86013 5.33317 10.1332V21.8665C5.33317 24.5198 7.47984 26.6665 10.1332 26.6665H21.8665C23.1395 26.6665 24.3604 26.1608 25.2606 25.2606C26.1608 24.3604 26.6665 23.1395 26.6665 21.8665V10.1332C26.6665 7.47984 24.5198 5.33317 21.8665 5.33317H10.1332ZM22.9998 7.33317C23.4419 7.33317 23.8658 7.50877 24.1783 7.82133C24.4909 8.13389 24.6665 8.55781 24.6665 8.99984C24.6665 9.44186 24.4909 9.86579 24.1783 10.1783C23.8658 10.4909 23.4419 10.6665 22.9998 10.6665C22.5578 10.6665 22.1339 10.4909 21.8213 10.1783C21.5088 9.86579 21.3332 9.44186 21.3332 8.99984C21.3332 8.55781 21.5088 8.13389 21.8213 7.82133C22.1339 7.50877 22.5578 7.33317 22.9998 7.33317ZM15.9998 9.33317C17.7679 9.33317 19.4636 10.0355 20.7139 11.2858C21.9641 12.536 22.6665 14.2317 22.6665 15.9998C22.6665 17.7679 21.9641 19.4636 20.7139 20.7139C19.4636 21.9641 17.7679 22.6665 15.9998 22.6665C14.2317 22.6665 12.536 21.9641 11.2858 20.7139C10.0355 20.7139 9.33317 17.7679 9.33317 15.9998C9.33317 14.2317 10.0355 12.536 11.2858 11.2858C12.536 10.0355 13.9216 10.6665 15.9998 10.6665Z" fill="currentColor" /></svg></a>
            <a href="#x" className="home-footer-social focus-ring" aria-label="ایکس"><svg width="16" height="16" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M21 1.24951H25.0895L16.1562 11.4857L26.6667 25.4171H18.4381L11.9886 16.9695L4.61714 25.4171H0.52381L10.0781 14.4647L0 1.25142H8.4381L14.259 8.97142L21 1.24951ZM19.5619 22.9638H21.8286L7.2 3.57523H4.76952L19.5619 22.9638Z" fill="currentColor" /></svg></a>
          </div>
        </div>

        <div className="home-footer-column home-footer-nav-column">
          <h3 className="home-footer-heading">حقوق و پشتیبانی</h3>
          <nav className="home-footer-links" aria-label="حقوق و پشتیبانی">
            <Link href="/terms">شرایط و قوانین</Link>
            <Link href="/privacy">حریم خصوصی و محرمانگی</Link>
            <Link href="/blog">وبلاگ</Link>
          </nav>
        </div>

        <div className="home-footer-column home-footer-nav-column">
          <h3 className="home-footer-heading">خدمات ما</h3>
          <nav className="home-footer-links" aria-label="خدمات ما">
            <Link href="/consultations/individual">مشاوره فردی</Link>
            <Link href="/consultations/couples">زوج و رابطه</Link>
            <Link href="/consultations/teenagers">کودک و نوجوان</Link>
            <Link href="/group-therapy">گروه درمانی</Link>
            <Link href="/courses">دوره‌های روانشناسی</Link>
          </nav>
        </div>

        <div className="home-footer-column home-footer-nav-column">
          <h3 className="home-footer-heading">دسترسی سریع</h3>
          <nav className="home-footer-links" aria-label="دسترسی سریع">
            <Link href="/">خانه</Link>
            <Link href="/partners">همکاران اُزون</Link>
            <Link href="/about">درباره ما</Link>
            <Link href="/contact">تماس با ما</Link>
          </nav>
        </div>
      </div>
      <div className="home-footer-bottom">© تمامی حقوق مادی و معنوی برای موسسه اُزون محفوظ است</div>
    </footer>
  );
}
