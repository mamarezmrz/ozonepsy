"use client";

import Image from "next/image";
import Link from "next/link";
import { type ChangeEvent, type CSSProperties, useEffect, useRef, useState } from "react";
import { AboutPreconsultation } from "@/components/about-page";
import { ConsultationTestimonials } from "@/components/consultation-testimonials";
import type { PublicCoursePage } from "@/lib/public/catalog-types";
import type { PublicReview } from "@/lib/reviews";

const asset = (name: string) => `/figma-home/${name}`;
const collapsedLessonListHeight = 384;
const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

export function CourseDetailPage({ product, userEmail, hasCourseAccess, reviews = [], reviewProductSlug = null }: { product: PublicCoursePage; userEmail: string; hasCourseAccess: boolean; reviews?: readonly PublicReview[]; reviewProductSlug?: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const [canExpandLessons, setCanExpandLessons] = useState(false);
  const [lessonListHeight, setLessonListHeight] = useState<number | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoClosing, setVideoClosing] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("ویدئوی دوره");
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoVolume, setVideoVolume] = useState(1);
  const lessonListRef = useRef<HTMLDivElement>(null);
  const videoFrameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (videoCloseTimerRef.current) {
        clearTimeout(videoCloseTimerRef.current);
      }
    };
  }, []);

  const courseLessons = product.modules.flatMap((module) => module.lessons);

  useEffect(() => {
    const list = lessonListRef.current;

    if (!list) {
      return;
    }

    const measureLessons = () => {
      const needsExpansion = list.scrollHeight > collapsedLessonListHeight + 1;
      setCanExpandLessons(needsExpansion);

      if (!needsExpansion) {
        setExpanded(false);
        setLessonListHeight(list.scrollHeight);
      } else if (!expanded) {
        setLessonListHeight(collapsedLessonListHeight);
      }
    };

    measureLessons();
    const observer = new ResizeObserver(measureLessons);
    observer.observe(list);

    return () => observer.disconnect();
  }, [courseLessons.length, expanded]);

  const openVideo = (source: string, title: string) => {
    if (videoCloseTimerRef.current) {
      clearTimeout(videoCloseTimerRef.current);
      videoCloseTimerRef.current = null;
    }

    setVideoClosing(false);
    setVideoPlaying(false);
    setVideoSource(source);
    setVideoTitle(title);
    setVideoProgress(0);
    setVideoDuration(0);
    setVideoOpen(true);
  };

  const closeVideo = () => {
    if (videoClosing) {
      return;
    }

    setVideoClosing(true);
    videoCloseTimerRef.current = setTimeout(() => {
      if (document.fullscreenElement === videoFrameRef.current) {
        void document.exitFullscreen().catch(() => undefined);
      }
      setVideoOpen(false);
      setVideoClosing(false);
      videoCloseTimerRef.current = null;
    }, 220);
  };

  const toggleVideoFullscreen = async () => {
    const frame = videoFrameRef.current;

    if (!frame) {
      return;
    }

    try {
      if (document.fullscreenElement === frame) {
        await document.exitFullscreen();
      } else {
        await frame.requestFullscreen();
      }
    } catch {
      // Fullscreen can be denied by the browser or operating system.
    }
  };

  const toggleVideoPlayback = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  };

  const handleVideoSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const nextTime = Number(event.currentTarget.value);
    video.currentTime = nextTime;
    setVideoProgress(nextTime);
  };

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;

    if (video) {
      const duration = Number.isFinite(video.duration) ? video.duration : videoDuration;
      setVideoProgress(duration > 0 ? Math.min(video.currentTime, duration) : video.currentTime);
    }
  };

  const handleVideoEnded = () => {
    const video = videoRef.current;
    const duration = video && Number.isFinite(video.duration) ? video.duration : videoDuration;

    setVideoPlaying(false);
    if (duration > 0) {
      setVideoProgress(duration);
    }
  };

  const handleVideoLoadedMetadata = () => {
    const video = videoRef.current;

    if (video) {
      video.volume = videoVolume;
      video.muted = videoVolume === 0;
      setVideoDuration(Number.isFinite(video.duration) ? video.duration : 0);
    }
  };

  const handleVideoVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    const nextVolume = Number(event.currentTarget.value);

    setVideoVolume(nextVolume);
    if (video) {
      video.volume = nextVolume;
      video.muted = nextVolume === 0;
    }
  };

  const toggleVideoMute = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.muted || video.volume === 0) {
      const nextVolume = videoVolume || 0.6;
      video.volume = nextVolume;
      video.muted = false;
      setVideoVolume(nextVolume);
      return;
    }

    video.muted = true;
    setVideoVolume(0);
  };

  const videoProgressPercent = videoDuration > 0 ? Math.min(100, Math.max(0, (videoProgress / videoDuration) * 100)) : 0;
  const videoProgressStyle = { "--video-progress": `${videoProgressPercent}%` } as CSSProperties;
  const videoVolumeStyle = { "--video-volume": `${videoVolume * 100}%` } as CSSProperties;

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

  const previewLesson = courseLessons.find((lesson) => lesson.isPreview && lesson.mediaUrl);
  const previewVideo = product.demoVideoUrl ?? previewLesson?.mediaUrl ?? null;
  const previewTitle = product.demoVideoUrl ? "دموی دوره" : previewLesson?.title ?? "دموی دوره";

  return (
    <main className="course-detail-page">
      <div className="course-detail-inner">
        <Link href="/courses" className="course-detail-back focus-ring" aria-label="بازگشت به دوره‌ها">
          <span className="course-detail-back-chevron" aria-hidden="true" />
        </Link>

        <section className="course-detail-hero" aria-labelledby="course-detail-title">
          <div className="course-detail-copy">
            <h1 id="course-detail-title">{product.title}</h1>
            <p>{product.description}</p>
            <div className="course-detail-tags" aria-label="دسته‌بندی دوره">
              <span>مشاوره فردی</span>
              <span>مشاوره فردی</span>
              <span>گروه درمانی</span>
            </div>
            {hasCourseAccess ? null : (
              <div className="course-detail-purchase">
                <span className="course-detail-price">
                  <b>{new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(product.priceMinor / 100)}</b>
                  <small>({product.currency})</small>
                </span>
                <Link href={`/checkout/${product.id}`} className="course-detail-buy">خرید دوره</Link>
              </div>
            )}
          </div>
          <figure className="course-detail-image">
            <Image
              src={product.coverUrl ?? asset("image-20.png")}
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
            <p><strong>مدرس:</strong> {product.instructorName ?? "—"}</p>
            <p><strong>مدت دوره:</strong> {product.duration ?? "—"}</p>
          </div>

          <div className="course-detail-section">
            <h2>توضیحات</h2>
            <p>{product.description}</p>
          </div>

          <section className="course-detail-section course-detail-demo" aria-labelledby="course-demo-title">
            <h2 id="course-demo-title">دموی دوره</h2>
            <button type="button" className="course-demo-preview focus-ring" onClick={() => previewVideo && openVideo(previewVideo, previewTitle)} disabled={!previewVideo} aria-label="پخش دموی دوره">
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
              className={`course-lesson-list${canExpandLessons ? " is-collapsible" : ""}${expanded ? " is-expanded" : ""}`}
              style={{ height: lessonListHeight === null ? "auto" : `${lessonListHeight}px` }}
            >
              {courseLessons.length ? courseLessons.map((lesson) => {
                const canPlayLesson = Boolean(lesson.mediaUrl) && (lesson.isPreview || hasCourseAccess);

                return (
                  <button
                    key={lesson.id}
                    type="button"
                    className={`course-lesson-row${canPlayLesson ? " is-free" : " is-locked"}`}
                    disabled={!canPlayLesson}
                    onClick={() => canPlayLesson && lesson.mediaUrl && openVideo(lesson.mediaUrl, lesson.title)}
                    aria-label={canPlayLesson ? `پخش ${lesson.title}` : `${lesson.title} قفل است`}
                  >
                    <span className="course-lesson-icon" aria-hidden="true">
                      {canPlayLesson ? <PlayIcon /> : <LockIcon />}
                    </span>
                    <span className="course-lesson-duration">{formatLessonDuration(lesson.duration)}</span>
                    <span className="course-lesson-title">{lesson.title}</span>
                  </button>
                );
              }) : <p className="course-detail-empty">هنوز سرفصل منتشرشده‌ای برای این دوره ثبت نشده است.</p>}
            </div>
            {canExpandLessons ? <button
              type="button"
              className="course-detail-more focus-ring"
              aria-expanded={expanded}
              aria-controls="course-lesson-list"
              onClick={toggleLessons}
            >
              <span>{expanded ? "بستن سرفصل‌ها" : "مشاهده بیشتر"}</span>
              <span className={`course-detail-more-chevron${expanded ? " is-open" : ""}`} aria-hidden="true" />
            </button> : null}
          </section>
        </section>
      </div>

      <ConsultationTestimonials productSlug={reviewProductSlug ?? product.slug} reviews={reviews} />
      <AboutPreconsultation />

      {videoOpen ? (
        <div className={`course-video-modal${videoClosing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-labelledby="course-video-modal-title">
          <div className="course-video-modal-card">
            <button type="button" className="course-video-modal-close focus-ring" onClick={closeVideo} aria-label="بستن ویدئو">
              <span aria-hidden="true" />
            </button>
            <h2 id="course-video-modal-title" className="sr-only">{videoTitle}</h2>
            <div ref={videoFrameRef} className="course-video-frame">
              <video
                ref={videoRef}
                src={videoSource ?? undefined}
                poster={asset("image-21.png")}
                autoPlay
                disablePictureInPicture
                playsInline
                preload="metadata"
                onPlay={() => setVideoPlaying(true)}
                onPause={() => setVideoPlaying(false)}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
                onLoadedMetadata={handleVideoLoadedMetadata}
                onContextMenu={(event) => event.preventDefault()}
              />
              <Image className="course-video-watermark-logo" src="/ozone-logo.svg" alt="اُزون" width={82} height={82} />
              <span className="course-video-watermark-email">{userEmail}</span>
              <div className="course-video-controls" aria-label="کنترل‌های ویدئو" dir="ltr">
                <button
                  type="button"
                  className="course-video-control-button focus-ring"
                  onClick={toggleVideoPlayback}
                  aria-label={videoPlaying ? "توقف ویدئو" : "پخش ویدئو"}
                >
                  <span className={`course-video-control-icon ${videoPlaying ? "is-pause" : "is-play"}`} aria-hidden="true" />
                </button>
                <input
                  className="course-video-progress"
                  type="range"
                  min="0"
                  max={videoDuration || 0}
                  step="any"
                  value={Math.min(videoProgress, videoDuration || 0)}
                  onChange={handleVideoSeek}
                  style={videoProgressStyle}
                  aria-label="موقعیت ویدئو"
                />
                <span className="course-video-time" aria-label="زمان ویدئو">
                  {formatVideoTime(videoProgress)} / {formatVideoTime(videoDuration)}
                </span>
                <div className="course-video-volume">
                  <button
                    type="button"
                    className="course-video-control-button focus-ring"
                    onClick={toggleVideoMute}
                    aria-label={videoVolume === 0 ? "فعال کردن صدا" : "بی‌صدا کردن ویدئو"}
                  >
                    <VolumeIcon muted={videoVolume === 0} />
                  </button>
                  <input
                    className="course-video-volume-range"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={videoVolume}
                    onChange={handleVideoVolumeChange}
                    style={videoVolumeStyle}
                    aria-label="بلندی صدا"
                  />
                </div>
                <button
                  type="button"
                  className="course-video-fullscreen focus-ring"
                  onClick={toggleVideoFullscreen}
                  aria-label="نمایش ویدئو به صورت تمام‌صفحه"
                  title="تمام‌صفحه"
                >
                  <span className="course-video-fullscreen-icon" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function formatVideoTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "۰۰:۰۰";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const value = `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;

  return value.replace(/\d/g, (digit) => persianDigits[Number(digit)]);
}

function formatLessonDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`.replace(/\d/g, (digit) => persianDigits[Number(digit)]);
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

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 9V15H8L13 19V5L8 9H4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {muted ? (
        <path d="M16 9L21 14M21 9L16 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <>
          <path d="M16 8.5C17.3333 9.83333 17.3333 14.1667 16 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M18.5 6C21.8333 9.33333 21.8333 14.6667 18.5 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
