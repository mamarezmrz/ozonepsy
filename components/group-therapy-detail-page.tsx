"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AboutPreconsultation } from "@/components/about-page";
import { HomeFaq } from "@/components/home-interactive";
import type { PublicContent } from "@/lib/public/content";
import type { PublicGroupTherapyPage } from "@/lib/public/catalog-types";

const fallbackImage = "/figma-home/image-20.png";
const collapsedSessionListHeight = 384;

function formatSessionDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
}

function formatSessionTime(value: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function GroupTherapyDetailPage({ product, content }: { product: PublicGroupTherapyPage; content?: PublicContent }) {
  const [expanded, setExpanded] = useState(false);
  const [canExpandSessions, setCanExpandSessions] = useState(false);
  const [sessionListHeight, setSessionListHeight] = useState<number | null>(null);
  const sessionListRef = useRef<HTMLDivElement>(null);
  const price = new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(product.priceMinor / 100);

  useEffect(() => {
    const list = sessionListRef.current;
    if (!list) return;

    const measureSessions = () => {
      const needsExpansion = list.scrollHeight > collapsedSessionListHeight + 1;
      setCanExpandSessions(needsExpansion);
      if (!needsExpansion) {
        setExpanded(false);
        setSessionListHeight(list.scrollHeight);
      } else {
        setSessionListHeight(expanded ? list.scrollHeight : collapsedSessionListHeight);
      }
    };

    measureSessions();
    const observer = new ResizeObserver(measureSessions);
    observer.observe(list);
    return () => observer.disconnect();
  }, [product.groupSessions.length, expanded]);

  return (
    <main className="group-detail-page">
      <div className="group-detail-inner">
        <Link href="/group-therapy" className="group-detail-back focus-ring" aria-label="بازگشت به گروه درمانی">
          <span className="group-detail-back-chevron" aria-hidden="true" />
        </Link>

        <section className="group-detail-hero" aria-labelledby="group-detail-title">
          <div className="group-detail-copy">
            <h1 id="group-detail-title">{product.title}</h1>
            <p>{product.description}</p>
            <div className="group-detail-purchase">
              <span className="group-detail-price"><b>{price}</b><small>({product.currency})</small></span>
              <Link href={`/checkout/${product.id}`} className="group-detail-buy">خرید جلسه</Link>
            </div>
          </div>
          <figure className="group-detail-image">
            <Image src={product.coverUrl ?? fallbackImage} alt={product.title} fill priority sizes="(max-width: 900px) 100vw, 320px" />
          </figure>
        </section>

        <div className="group-detail-divider" />

        <section className="group-detail-content" aria-labelledby="group-detail-specs-title">
          <div className="group-detail-section">
            <h2 id="group-detail-specs-title">مشخصات</h2>
            <p><strong>مدرس:</strong> {product.instructorName ?? "—"}</p>
            <p><strong>مدت دوره:</strong> {product.duration ?? "—"}</p>
          </div>

          <div className="group-detail-section">
            <h2>توضیحات</h2>
            <p>{product.description}</p>
          </div>

          <div className="group-detail-section group-detail-sessions" aria-labelledby="group-detail-sessions-title">
            <h2 id="group-detail-sessions-title">جلسات</h2>
            <div
              id="group-session-list"
              ref={sessionListRef}
              className={`course-lesson-list group-therapy-session-list${canExpandSessions ? " is-collapsible" : ""}${expanded ? " is-expanded" : ""}`}
              style={{ height: sessionListHeight === null ? "auto" : `${sessionListHeight}px` }}
            >
              {product.groupSessions.length ? product.groupSessions.map((session) => (
                <div className="group-therapy-session-row" key={session.id}>
                  <span className="group-therapy-session-title">{session.title}</span>
                  <time className="group-therapy-session-date" dateTime={session.startsAt}>{formatSessionDate(session.startsAt)}</time>
                  <time className="group-therapy-session-time" dateTime={session.startsAt}>{formatSessionTime(session.startsAt)}</time>
                </div>
              )) : <p className="course-detail-empty">هنوز جلسه‌ای برای این گروه ثبت نشده است.</p>}
            </div>
            {canExpandSessions ? <button type="button" className="course-detail-more focus-ring" aria-expanded={expanded} aria-controls="group-session-list" onClick={() => setExpanded((current) => !current)}><span>{expanded ? "بستن جلسات" : "مشاهده بیشتر"}</span><span className={`course-detail-more-chevron${expanded ? " is-open" : ""}`} aria-hidden="true" /></button> : null}
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
        <div className="home-faq-inner"><h2 id="group-detail-faq-title">سوالات متداول گروه درمانی</h2><HomeFaq items={content?.faqs} /></div>
      </section>

      <AboutPreconsultation />
    </main>
  );
}
