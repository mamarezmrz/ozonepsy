"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AboutPreconsultation } from "@/components/about-page";
import { ConsultationTestimonials } from "@/components/consultation-testimonials";
import type { Product } from "@/lib/data";

const asset = (name: string) => `/figma-home/${name}`;
const collapsedLessonListHeight = 384;
const testVideoSource = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const lessons = [
  { title: "مقدمه", duration: "۰۰:۰۱:۴۶", free: true },
  { title: "جلسه ۱: مقدمه‌ای بر روانشناسی و سلامت روان", duration: "۰۰:۱۴:۴۶", free: false },
  { title: "جلسه ۲: شناخت و مدیریت استرس", duration: "۰۰:۱۴:۴۶", free: false },
  { title: "جلسه ۳: ارتباطات مؤثر و مهارت‌های اجتماعی", duration: "۰۰:۱۴:۴۶", free: false },
  { title: "جلسه ۴: خودآگاهی و رشد فردی", duration: "۰۰:۱۴:۴۶", free: false },
  { title: "جلسه ۵: تکنیک‌های حل مسئله", duration: "۰۰:۱۴:۴۶", free: false },
  { title: "جلسه ۶: کار با احساسات و هیجانات", duration: "۰۰:۱۴:۴۶", free: false },
  { title: "جلسه ۷: تقویت اعتماد به نفس", duration: "۰۰:۱۴:۴۶", free: false },
  { title: "جلسه ۸: مدیریت زمان و برنامه‌ریزی", duration: "۰۰:۱۴:۴۶", free: false },
  { title: "جلسه ۹: کار گروهی و همکاری", duration: "۰۰:۱۴:۴۶", free: false },
  { title: "جلسه ۱۰: جمع‌بندی و ارزیابی نهایی", duration: "۰۰:۱۴:۴۶", free: false },
] as const;

export function CourseDetailPage({ product, userEmail }: { product: Product; userEmail: string }) {
  const [expanded, setExpanded] = useState(false);
  const [lessonListHeight, setLessonListHeight] = useState(collapsedLessonListHeight);
  const [videoOpen, setVideoOpen] = useState(false);
  const lessonListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!videoOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [videoOpen]);

  const toggleLessons = () => {
    const list = lessonListRef.current;
    const nextExpanded = !expanded;

    if (!list) {
      setExpanded(nextExpanded);
      return;
    }

    setLessonListHeight(list.getBoundingClientRect().height);
    setExpanded(nextExpanded);

    requestAnimationFrame(() => {
      setLessonListHeight(nextExpanded ? list.scrollHeight : collapsedLessonListHeight);
    });
  };

  return (
    <main className="course-detail-page">
      <div className="course-detail-inner">
        <Link href="/courses" className="course-detail-back focus-ring" aria-label="بازگشت به دوره‌ها">
          <span className="course-detail-back-chevron" aria-hidden="true" />
        </Link>

        <section className="course-detail-hero" aria-labelledby="course-detail-title">
          <div className="course-detail-copy">
            <h1 id="course-detail-title">{product.title}</h1>
            <p>توضیح کوتاه مربوط به دوره</p>
            <div className="course-detail-tags" aria-label="دسته‌بندی دوره">
              <span>مشاوره فردی</span>
              <span>مشاوره فردی</span>
              <span>گروه درمانی</span>
            </div>
            <div className="course-detail-purchase">
              <span className="course-detail-price">
                <b>${product.price === 179 ? "179.9" : product.price.toFixed(1)}</b>
                <small>(USD)</small>
              </span>
              <Link href={`/checkout/${product.id}`} className="course-detail-buy">خرید دوره</Link>
            </div>
          </div>
          <figure className="course-detail-image">
            <Image
              src={asset("image-20.png")}
              alt={product.title}
              fill
              priority
              loading="eager"
              quality={100}
              sizes="(max-width: 900px) 100vw, 320px"
            />
          </figure>
        </section>

        <div className="course-detail-divider" />

        <section className="course-detail-content" aria-labelledby="course-detail-specs-title">
          <div className="course-detail-section">
            <h2 id="course-detail-specs-title">مشخصات</h2>
            <p><strong>مدرس:</strong> دکتر رضا مولودی</p>
            <p><strong>مدت دوره:</strong> دسترسی مادام‌العمر</p>
          </div>

          <div className="course-detail-section">
            <h2>توضیحات</h2>
            <p>
              {product.description} در این دوره، شرکت‌کنندگان با مفاهیمی چون مدیریت استرس، ارتباطات مؤثر و خودآگاهی آشنا می‌شوند.
              همچنین تکنیک‌های حل مسئله و کار با هیجانات به آن‌ها کمک می‌کند تا اعتماد به نفس خود را تقویت کرده و زمان خود را به بهترین شکل مدیریت کنند.
            </p>
          </div>

          <section className="course-detail-section course-detail-demo" aria-labelledby="course-demo-title">
            <h2 id="course-demo-title">دموی دوره</h2>
            <button type="button" className="course-demo-preview focus-ring" onClick={() => setVideoOpen(true)} aria-label="پخش دموی دوره">
              <Image
                src={asset("image-21.png")}
                alt="پیش‌نمایش دموی دوره"
                fill
                quality={100}
                sizes="(max-width: 900px) 100vw, 900px"
              />
              <span className="course-demo-overlay" aria-hidden="true" />
              <span className="course-demo-play" aria-hidden="true"><span /></span>
            </button>
          </section>

          <section className="course-detail-section course-detail-outline" aria-labelledby="course-outline-title">
            <h2 id="course-outline-title">سرفصل‌ها</h2>
            <div
              id="course-lesson-list"
              ref={lessonListRef}
              className={`course-lesson-list${expanded ? " is-expanded" : ""}`}
              style={{ height: `${lessonListHeight}px` }}
            >
              {lessons.map((lesson, index) => (
                <button
                  key={`course-lesson-${index}`}
                  type="button"
                  className={`course-lesson-row${lesson.free ? " is-free" : " is-locked"}`}
                  disabled={!lesson.free}
                  onClick={() => lesson.free && setVideoOpen(true)}
                  aria-label={lesson.free ? `پخش ${lesson.title}` : `${lesson.title} قفل است`}
                >
                  <span className="course-lesson-icon" aria-hidden="true">
                    {lesson.free ? <PlayIcon /> : <LockIcon />}
                  </span>
                  <span className="course-lesson-title">{lesson.title}</span>
                  <span className="course-lesson-duration">{lesson.duration}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="course-detail-more focus-ring"
              aria-expanded={expanded}
              aria-controls="course-lesson-list"
              onClick={toggleLessons}
            >
              <span>{expanded ? "بستن سرفصل‌ها" : "مشاهده بیشتر"}</span>
              <span className={`course-detail-more-chevron${expanded ? " is-open" : ""}`} aria-hidden="true" />
            </button>
          </section>
        </section>
      </div>

      <ConsultationTestimonials />
      <AboutPreconsultation />

      {videoOpen ? (
        <div className="course-video-modal" role="dialog" aria-modal="true" aria-labelledby="course-video-modal-title">
          <div className="course-video-modal-card">
            <button type="button" className="course-video-modal-close focus-ring" onClick={() => setVideoOpen(false)} aria-label="بستن ویدئو">
              <span aria-hidden="true" />
            </button>
            <h2 id="course-video-modal-title" className="sr-only">دموی دوره</h2>
            <div className="course-video-frame">
              <video
                src={testVideoSource}
                poster={asset("image-21.png")}
                autoPlay
                controls
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                playsInline
                preload="metadata"
                onContextMenu={(event) => event.preventDefault()}
              />
              <Image className="course-video-watermark-logo" src="/ozone-logo.svg" alt="اُزون" width={82} height={82} />
              <span className="course-video-watermark-email">{userEmail}</span>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M5 3L19 12L5 21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
