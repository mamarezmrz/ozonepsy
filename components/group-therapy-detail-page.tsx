"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { AboutPreconsultation } from "@/components/about-page";
import { HomeFaq } from "@/components/home-interactive";
import type { GroupTherapySession } from "@/lib/group-therapy";
import type { PublicContent } from "@/lib/public/content";

const asset = (name: string) => `/figma-home/${name}`;
const collapsedSessionListHeight = 320;

export function GroupTherapyDetailPage({ session, content }: { session: GroupTherapySession; content?: PublicContent }) {
  const [expanded, setExpanded] = useState(false);
  const [sessionListHeight, setSessionListHeight] = useState(collapsedSessionListHeight);
  const sessionListRef = useRef<HTMLDivElement>(null);

  const toggleSessions = () => {
    const list = sessionListRef.current;
    const nextExpanded = !expanded;

    if (!list) {
      setExpanded(nextExpanded);
      return;
    }

    setSessionListHeight(list.getBoundingClientRect().height);
    setExpanded(nextExpanded);

    requestAnimationFrame(() => {
      setSessionListHeight(nextExpanded ? list.scrollHeight : collapsedSessionListHeight);
    });
  };

  return (
    <main className="group-detail-page">
      <div className="group-detail-inner">
        <Link href="/group-therapy" className="group-detail-back focus-ring" aria-label="بازگشت به گروه درمانی">
          <span className="group-detail-back-chevron" aria-hidden="true" />
        </Link>

        <section className="group-detail-hero" aria-labelledby="group-detail-title">
          <div className="group-detail-copy">
            <h1 id="group-detail-title">{session.title}</h1>
            <p>{session.description}</p>
            <div className="group-detail-purchase">
              <span className="group-detail-price"><b>${session.price}</b><small>(USD)</small></span>
              <Link href="/checkout/group-therapy" className="group-detail-buy">خرید جلسه</Link>
            </div>
          </div>
          <figure className="group-detail-image">
            <Image src={asset(session.image)} alt={session.title} fill priority quality={100} sizes="(max-width: 900px) 100vw, 320px" />
          </figure>
        </section>

        <div className="group-detail-divider" />

        <section className="group-detail-content" aria-labelledby="group-detail-specs-title">
          <div className="group-detail-section">
            <h2 id="group-detail-specs-title">مشخصات</h2>
            <p><strong>مدرس:</strong> {session.mentor}</p>
            <p><strong>مدت دوره:</strong> {session.duration}</p>
          </div>

          <div className="group-detail-section">
            <h2>توضیحات</h2>
            <p>{session.detailDescription}</p>
          </div>

          <div className="group-detail-section group-detail-sessions" aria-labelledby="group-detail-sessions-title">
            <h2 id="group-detail-sessions-title">جلسات</h2>
            <div
              id="group-detail-session-list"
              ref={sessionListRef}
              className={`group-detail-session-list${expanded ? " is-expanded" : ""}`}
              style={{ height: `${sessionListHeight}px` }}
            >
              {session.sessions.map((item, index) => (
                <article key={`${session.slug}-${index}`} className="group-detail-session-row">
                  <h3>{item.title}</h3>
                  <time dateTime={`2026-${String(index + 1).padStart(2, "0")}-23`}>{item.date}</time>
                  <span>{item.time}</span>
                </article>
              ))}
            </div>
            <button type="button" className="group-detail-more focus-ring" aria-expanded={expanded} aria-controls="group-detail-session-list" onClick={toggleSessions}>
              <span>{expanded ? "بستن جلسات" : "مشاهده بیشتر"}</span>
              <span className={`group-detail-more-chevron${expanded ? " is-open" : ""}`} aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>

      <section className="group-detail-steps home-service-steps" aria-labelledby="group-detail-steps-title">
        <div className="home-service-steps-inner">
          <div className="home-service-steps-head"><h2 id="group-detail-steps-title">مراحل دریافت خدمات</h2></div>
          <div className="home-service-steps-list">
            {[
              ["۱", "درخواست مشاوره رایگان", "برای شروع کافیه توی سایت ثبت نام کنید و درخواست مشاوره خودتون رو ثبت کنید."],
              ["۲", "تعیین زمان جلسه", "بعد از ثبت نام همکاران با شما تماس می‌گیرن تا زمان جلسه پیش‌مشاوره رو با شما تنظیم کنن."],
              ["۳", "انتخاب مشاور و نوع جلسات", "بعد از این که همکاران اطلاعات لازم رو بهتون دادن در نهایت شما در صورت تمایل مشاور خودتون رو انتخاب می‌کنین."],
              ["۴", "برگزاری جلسات", "با مشخص شدن مشاور و زمان جلسه، طبق زمان‌بندی مشخص شده جلسه‌تون برگزار می‌شه."],
            ].map(([number, title, description]) => (
              <article key={number} className="home-service-step"><div className="home-service-step-marker">{number}</div><h3>{title}</h3><p>{description}</p></article>
            ))}
          </div>
          <Link href="/free-session" className="home-service-steps-link">پیش مشاوره رایگان</Link>
        </div>
      </section>

      <section className="group-detail-faq home-faq" aria-labelledby="group-detail-faq-title">
        <div className="home-faq-inner"><h2 id="group-detail-faq-title">سوالات متداول مربوط به {session.title}</h2><HomeFaq items={content?.faqs} /></div>
      </section>

      <AboutPreconsultation />
    </main>
  );
}
