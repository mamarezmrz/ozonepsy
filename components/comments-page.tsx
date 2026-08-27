"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PaymentsScrollbar } from "@/components/payments-page";

type CommentStatus = "PENDING" | "PUBLISHED" | "REJECTED";

type UserComment = {
  id: string;
  body: string;
  status: CommentStatus;
  pageTitle: string;
  pageHref: string;
  date: string;
};

const MODAL_TRANSITION_MS = 220;

function CommentStatus({ status }: { status: CommentStatus }) {
  if (status === "REJECTED") {
    return (
      <span className="dashboard-comments-status is-rejected">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
          <circle cx="8.00065" cy="7.99967" r="6.66667" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 5.33301V7.99967" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 10.667H8.00667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>رد شده</span>
      </span>
    );
  }

  return <span className={`dashboard-comments-status is-${status.toLowerCase()}`}>{status === "PENDING" ? "در حال بررسی" : "منتشر شده"}</span>;
}

function DeleteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
      <path d="M2.5 5H4.16667H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.8327 5.00033V16.667C15.8327 17.109 15.6571 17.5329 15.3445 17.8455C15.032 18.1581 14.608 18.3337 14.166 18.3337H5.83268C5.39065 18.3337 4.96673 18.1581 4.65417 17.8455C4.34161 17.5329 4.16602 17.109 4.16602 16.667V5.00033M6.66602 5.00033V3.33366C6.66602 2.89163 6.84161 2.46771 7.15417 2.15515C7.46673 1.84259 7.89065 1.66699 8.33268 1.66699H11.666C12.108 1.66699 12.532 1.84259 12.8445 2.15515C13.1571 2.46771 13.3327 2.89163 13.3327 3.33366V5.00033" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.33398 9.16699V14.167" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.666 9.16699V14.167" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CommentsPage() {
  const [comments, setComments] = useState<UserComment[]>([]);
  const [isModalRendered, setIsModalRendered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<UserComment | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeDeleteModal = useCallback((restoreFocus = true) => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsModalOpen(false);
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsModalRendered(false);
      setCommentToDelete(null);
      if (restoreFocus) triggerRef.current?.focus();
      closeTimerRef.current = null;
    }, MODAL_TRANSITION_MS);
  }, [clearCloseTimer]);

  const openDeleteModal = useCallback((comment: UserComment, trigger: HTMLButtonElement) => {
    clearCloseTimer();
    triggerRef.current = trigger;
    setCommentToDelete(comment);
    setIsModalRendered(true);
    animationFrameRef.current = window.requestAnimationFrame(() => {
      setIsModalOpen(true);
      animationFrameRef.current = null;
    });
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!isModalRendered) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDeleteModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => cancelRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [closeDeleteModal, isModalRendered]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
      if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, [clearCloseTimer]);

  const confirmDelete = () => {
    if (!commentToDelete) return;
    setComments((current) => current.filter((comment) => comment.id !== commentToDelete.id));
    closeDeleteModal(false);
  };

  return (
    <>
      <div className="user-dashboard-content dashboard-payments-page-content dashboard-comments-page-content">
        <section className="user-dashboard-panel dashboard-payments-page-panel dashboard-comments-page-panel">
          <header className="user-dashboard-panel-heading">
            <h2>نظرات من</h2>
          </header>

          {comments.length > 0 ? (
            <div className="dashboard-payments-page-scroll-shell">
              <div id="dashboard-comments-table" ref={tableRef} className="dashboard-payments-page-table" role="table" aria-label="فهرست نظرات من" tabIndex={0}>
                <div className="dashboard-payments-page-row dashboard-comments-page-row is-header" role="row">
                  <span role="columnheader">متن نظر</span>
                  <span role="columnheader">وضعیت</span>
                  <span role="columnheader">صفحه‌ی مربوطه</span>
                  <span role="columnheader">تاریخ</span>
                  <span role="columnheader" aria-label="حذف" />
                </div>

                <div className="dashboard-payments-page-table-body">
                  {comments.map((comment) => (
                    <div className="dashboard-payments-page-row dashboard-comments-page-row" role="row" key={comment.id}>
                      <span role="cell" className="dashboard-comments-body">{comment.body}</span>
                      <span role="cell"><CommentStatus status={comment.status} /></span>
                      <span role="cell"><Link className="dashboard-comments-page-link" href={comment.pageHref}>{comment.pageTitle}</Link></span>
                      <span role="cell" className="dashboard-payments-page-date" dir="ltr">{comment.date}</span>
                      <span role="cell" className="dashboard-comments-delete-cell">
                        <button
                          type="button"
                          className="dashboard-comments-delete-button"
                          aria-label={`حذف نظر درباره ${comment.pageTitle}`}
                          onClick={(event) => openDeleteModal(comment, event.currentTarget)}
                        >
                          <DeleteIcon />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <PaymentsScrollbar scrollRef={tableRef} ariaLabel="پیمایش نظرات من" ariaControls="dashboard-comments-table" />
            </div>
          ) : (
            <p className="dashboard-payments-page-empty">هنوز نظری ثبت نکرده‌اید.</p>
          )}
        </section>
      </div>

      {isModalRendered ? (
        <div
          className={`dashboard-logout-modal-backdrop${isModalOpen ? " is-open" : ""}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDeleteModal();
          }}
          aria-hidden={!isModalOpen}
        >
          <section
            className="dashboard-logout-modal dashboard-comment-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="comment-delete-title"
            aria-describedby="comment-delete-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="dashboard-logout-modal-close" aria-label="بستن" onClick={() => closeDeleteModal()}>
              <span aria-hidden="true">×</span>
            </button>
            <h2 id="comment-delete-title">حذف نظر</h2>
            <p id="comment-delete-description">آیا از حذف این نظر مطمئن هستید؟</p>
            <div className="dashboard-logout-modal-actions">
              <button type="button" className="dashboard-logout-confirm" onClick={confirmDelete}>حذف</button>
              <button ref={cancelRef} type="button" className="dashboard-logout-cancel" onClick={() => closeDeleteModal()}>لغو</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
