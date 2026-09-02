"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SiteNotification } from "@/components/site-notification";
import type { PublicReview } from "@/lib/reviews";

const initialVisibleCount = 4;
const MODAL_TRANSITION_MS = 220;

type ConsultationTestimonialsProps = {
  productSlug?: string | null;
  reviews?: readonly PublicReview[];
};

export function ConsultationTestimonials({ productSlug = null, reviews = [] }: ConsultationTestimonialsProps) {
  const [expanded, setExpanded] = useState(false);
  const [isModalRendered, setIsModalRendered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewBody, setReviewBody] = useState("");
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeReviewModal = useCallback((force = false) => {
    if (isSubmitting && !force) return;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsModalOpen(false);
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsModalRendered(false);
      setSubmitError(null);
      closeTimerRef.current = null;
    }, MODAL_TRANSITION_MS);
  }, [clearCloseTimer, isSubmitting]);

  const openReviewModal = useCallback(() => {
    if (!productSlug) return;
    clearCloseTimer();
    setSubmitError(null);
    setIsModalRendered(true);
    animationFrameRef.current = window.requestAnimationFrame(() => {
      setIsModalOpen(true);
      animationFrameRef.current = null;
    });
  }, [clearCloseTimer, productSlug]);

  useEffect(() => {
    if (!isModalRendered) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeReviewModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [closeReviewModal, isModalRendered]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
      if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, [clearCloseTimer]);

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productSlug || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productSlug, body: reviewBody, website }),
      });
      const result = await response.json() as { ok?: boolean; error?: string; message?: string };
      if (!response.ok || !result.ok) {
        setSubmitError(result.error ?? "ثبت نظر انجام نشد.");
        return;
      }

      setReviewBody("");
      setWebsite("");
      closeReviewModal(true);
      setNotification(result.message ?? "نظر شما ثبت شد و پس از تأیید منتشر می‌شود.");
    } catch {
      setSubmitError("ارتباط با سرور برقرار نشد.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleReviews = expanded ? reviews : reviews.slice(0, initialVisibleCount);
  const hiddenCount = Math.max(reviews.length - initialVisibleCount, 0);

  return (
    <>
      {notification ? <SiteNotification message={notification} tone="success" onDismiss={() => setNotification(null)} /> : null}
      <section className="consultation-testimonials" aria-labelledby="consultation-testimonials-title">
        <div className="consultation-testimonials-inner">
          <div className="consultation-testimonials-heading">
            <h2 id="consultation-testimonials-title">نظرات شما</h2>
            <p>تجربه همراهان اُزون از مسیر مشاوره و گفت‌وگو.</p>
          </div>

          {reviews.length > 0 ? (
            <div className="consultation-testimonials-list">
              {visibleReviews.slice(0, initialVisibleCount).map((review) => <TestimonialCard key={review.id} review={review} />)}
              <div className={`consultation-testimonials-extra${expanded ? " is-open" : ""}`} aria-hidden={!expanded}>
                {visibleReviews.slice(initialVisibleCount).map((review) => <TestimonialCard key={review.id} review={review} />)}
              </div>
            </div>
          ) : (
            <p className="consultation-testimonials-empty">هنوز نظری برای این صفحه ثبت نشده است.</p>
          )}

          <div className={`consultation-testimonials-actions${!hiddenCount ? " is-solo" : ""}`}>
            {hiddenCount > 0 ? (
              <button type="button" className="consultation-testimonials-toggle" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>
                <span>{expanded ? "بستن نظرات" : `مشاهده ${toPersianDigits(hiddenCount)} نظر دیگر`}</span>
                <span className={`consultation-testimonials-chevron${expanded ? " is-open" : ""}`} aria-hidden="true" />
              </button>
            ) : null}
            {productSlug ? <button type="button" className="consultation-new-review" onClick={openReviewModal}>ثبت نظر جدید</button> : null}
          </div>
        </div>
      </section>

      {isModalRendered ? (
        <div
          className={`consultation-review-modal-backdrop${isModalOpen ? " is-open" : ""}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeReviewModal();
          }}
          aria-hidden={!isModalOpen}
        >
          <section className="consultation-review-modal" role="dialog" aria-modal="true" aria-labelledby="consultation-review-title" onMouseDown={(event) => event.stopPropagation()}>
            <button ref={closeButtonRef} type="button" className="consultation-review-modal-close" aria-label="بستن" onClick={() => closeReviewModal()}>
              <span aria-hidden="true">×</span>
            </button>
            <h2 id="consultation-review-title">ثبت نظر</h2>
            <form onSubmit={submitReview}>
              <label htmlFor="consultation-review-body">متن نظر</label>
              <textarea
                id="consultation-review-body"
                name="body"
                value={reviewBody}
                onChange={(event) => setReviewBody(event.target.value)}
                minLength={10}
                maxLength={2000}
                required
                placeholder="تجربه‌تان را با ما و همراهان اُزون به اشتراک بگذارید."
              />
              <label className="consultation-review-honeypot" htmlFor="consultation-review-website">وب‌سایت</label>
              <input id="consultation-review-website" className="consultation-review-honeypot" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" />
              {submitError ? <p className="consultation-review-error" role="alert">{submitError}</p> : null}
              <button type="submit" className="consultation-review-submit" disabled={isSubmitting}>{isSubmitting ? "در حال ثبت…" : "ثبت نظر"}</button>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function TestimonialCard({ review }: { review: PublicReview }) {
  return (
    <article className="consultation-testimonial-card">
      <div className="consultation-testimonial-top">
        {review.avatarUrl ? <Image className="consultation-testimonial-avatar consultation-testimonial-avatar-image" src={review.avatarUrl} alt={`تصویر پروفایل ${review.name}`} width={48} height={48} unoptimized /> : <span className="consultation-testimonial-avatar" aria-hidden="true">{review.name.slice(0, 1)}</span>}
        <span>{review.name}</span>
      </div>
      <p>{review.body}</p>
    </article>
  );
}

function toPersianDigits(value: number) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}
