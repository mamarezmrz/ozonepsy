"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MODAL_TRANSITION_MS = 220;

export function DashboardLogout() {
  const [isRendered, setIsRendered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeModal = useCallback(() => {
    if (pending) return;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsOpen(false);
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsRendered(false);
      triggerRef.current?.focus();
      closeTimerRef.current = null;
    }, MODAL_TRANSITION_MS);
  }, [clearCloseTimer, pending]);

  const openModal = useCallback(() => {
    clearCloseTimer();
    setError(null);
    setIsRendered(true);
    animationFrameRef.current = window.requestAnimationFrame(() => {
      setIsOpen(true);
      animationFrameRef.current = null;
    });
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!isRendered) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => cancelRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [closeModal, isRendered]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [clearCloseTimer]);

  async function logout() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout request failed");

      router.push("/");
      router.refresh();
    } catch {
      setPending(false);
      setError("خروج انجام نشد. دوباره تلاش کنید.");
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="user-dashboard-logout"
        onClick={openModal}
        disabled={pending}
      >
        <span>خروج</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="#FF4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 17L21 12L16 7" stroke="#FF4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12H9" stroke="#FF4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isRendered ? (
        <div
          className={`dashboard-logout-modal-backdrop${isOpen ? " is-open" : ""}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
          aria-hidden={!isOpen}
        >
          <section
            className="dashboard-logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-logout-title"
            aria-describedby="dashboard-logout-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="dashboard-logout-modal-close"
              aria-label="بستن"
              onClick={closeModal}
              disabled={pending}
            >
              <span aria-hidden="true">×</span>
            </button>

            <h2 id="dashboard-logout-title">خروج از حساب کاربری</h2>
            <p id="dashboard-logout-description">شما در حال خروج از حساب کاربری هستید</p>

            {error ? <p className="dashboard-logout-modal-error" role="alert">{error}</p> : null}

            <div className="dashboard-logout-modal-actions">
              <button
                type="button"
                className="dashboard-logout-confirm"
                onClick={logout}
                disabled={pending}
              >
                {pending ? "در حال خروج..." : "خروج"}
              </button>
              <button
                ref={cancelRef}
                type="button"
                className="dashboard-logout-cancel"
                onClick={closeModal}
                disabled={pending}
              >
                لغو
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
