"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import type { DashboardPayment } from "@/lib/dashboard";

type ScrollbarState = {
  height: number;
  offset: number;
};

type ScrollMetrics = {
  max: number;
  top: number;
};

export function PaymentsScrollbar({
  scrollRef,
  ariaLabel = "پیمایش پرداخت‌ها",
  ariaControls = "dashboard-payments-table",
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  ariaLabel?: string;
  ariaControls?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startY: number; startScrollTop: number; pointerId: number } | null>(null);
  const [thumb, setThumb] = useState<ScrollbarState>({ height: 36, offset: 0 });
  const [isScrollable, setIsScrollable] = useState(false);
  const [scrollMetrics, setScrollMetrics] = useState<ScrollMetrics>({ max: 0, top: 0 });

  const updateScrollbar = useCallback(() => {
    const element = scrollRef.current;
    const track = trackRef.current;

    if (!element || !track) {
      return;
    }

    const visibleHeight = element.clientHeight;
    const contentHeight = element.scrollHeight;
    const scrollRange = Math.max(0, contentHeight - visibleHeight);
    const canScroll = scrollRange > 1;

    setIsScrollable(canScroll);
    setScrollMetrics({ max: scrollRange, top: element.scrollTop });

    if (!canScroll) {
      setThumb({ height: track.clientHeight, offset: 0 });
      return;
    }

    const thumbHeight = Math.max(36, Math.round((visibleHeight / contentHeight) * track.clientHeight));
    const thumbRange = Math.max(0, track.clientHeight - thumbHeight);
    const offset = Math.round((element.scrollTop / scrollRange) * thumbRange);

    setThumb({ height: thumbHeight, offset });
  }, [scrollRef]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const frame = window.requestAnimationFrame(updateScrollbar);
    const handleScroll = () => updateScrollbar();
    const resizeObserver = new ResizeObserver(updateScrollbar);

    element.addEventListener("scroll", handleScroll, { passive: true });
    resizeObserver.observe(element);
    window.addEventListener("resize", updateScrollbar);

    return () => {
      window.cancelAnimationFrame(frame);
      element.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollbar);
    };
  }, [scrollRef, updateScrollbar]);

  const scrollByTrackPosition = (event: PointerEvent<HTMLDivElement>) => {
    const element = scrollRef.current;
    const track = trackRef.current;

    if (!element || !track || event.target !== event.currentTarget || !isScrollable) {
      return;
    }

    const bounds = track.getBoundingClientRect();
    const clickRatio = (event.clientY - bounds.top) / bounds.height;
    element.scrollTop = Math.max(0, Math.min(element.scrollHeight - element.clientHeight, clickRatio * element.scrollHeight));
  };

  const startDragging = (event: PointerEvent<HTMLDivElement>) => {
    const element = scrollRef.current;
    if (!element || !isScrollable) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollTop: element.scrollTop,
    };
  };

  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const element = scrollRef.current;
    const track = trackRef.current;
    const dragState = dragRef.current;

    if (!element || !track || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const scrollRange = element.scrollHeight - element.clientHeight;
    const thumbRange = Math.max(1, track.clientHeight - thumb.height);
    const scrollDelta = ((event.clientY - dragState.startY) / thumbRange) * scrollRange;

    element.scrollTop = Math.max(0, Math.min(scrollRange, dragState.startScrollTop + scrollDelta));
  };

  const stopDragging = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const amount = event.key === "PageUp" || event.key === "PageDown" ? element.clientHeight : 80;
    if (event.key === "ArrowUp" || event.key === "PageUp") {
      element.scrollTop -= amount;
      event.preventDefault();
    }
    if (event.key === "ArrowDown" || event.key === "PageDown") {
      element.scrollTop += amount;
      event.preventDefault();
    }
    if (event.key === "Home") {
      element.scrollTop = 0;
      event.preventDefault();
    }
    if (event.key === "End") {
      element.scrollTop = element.scrollHeight;
      event.preventDefault();
    }
  };

  return (
    <div
      ref={trackRef}
      className="dashboard-payments-page-scrollbar"
      role="scrollbar"
      aria-label={ariaLabel}
      aria-controls={ariaControls}
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={scrollMetrics.max}
      aria-valuenow={scrollMetrics.top}
      tabIndex={isScrollable ? 0 : -1}
      onPointerDown={scrollByTrackPosition}
      onKeyDown={handleKeyboard}
    >
      {isScrollable ? (
        <span
          className="dashboard-payments-page-scrollbar-thumb"
          style={{ height: `${thumb.height}px`, transform: `translateY(${thumb.offset}px)` }}
          onPointerDown={startDragging}
          onPointerMove={drag}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        />
      ) : null}
    </div>
  );
}

export function PaymentsPage({ payments }: { payments: DashboardPayment[] }) {
  const tableRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="user-dashboard-content dashboard-payments-page-content">
      <section className="user-dashboard-panel dashboard-payments-page-panel">
        <header className="user-dashboard-panel-heading">
          <h2>پرداخت‌ها</h2>
        </header>

        {payments.length > 0 ? (
          <div className="dashboard-payments-page-scroll-shell">
            <div id="dashboard-payments-table" ref={tableRef} className="dashboard-payments-page-table" role="table" aria-label="فهرست پرداخت‌ها" tabIndex={0}>
              <div className="dashboard-payments-page-row is-header" role="row">
                <span role="columnheader">شماره تراکنش</span>
                <span role="columnheader">درگاه پرداخت</span>
                <span role="columnheader">مبلغ پرداخت شده</span>
                <span role="columnheader">تاریخ تراکنش</span>
                <span role="columnheader">جزئیات خرید</span>
              </div>

              <div className="dashboard-payments-page-table-body">
                {payments.map((payment) => (
                  <div className="dashboard-payments-page-row" role="row" key={payment.id}>
                    <span role="cell">{payment.orderNumber}</span>
                    <span role="cell">{payment.provider}</span>
                    <span role="cell">{payment.amount}</span>
                    <span role="cell" className="dashboard-payments-page-date" dir="ltr">{payment.date}</span>
                    <span role="cell">{payment.productTitle}</span>
                  </div>
                ))}
              </div>
            </div>

            <PaymentsScrollbar scrollRef={tableRef} ariaControls="dashboard-payments-table" />
          </div>
        ) : (
          <p className="dashboard-payments-page-empty">تا کنون پرداختی نداشته‌اید.</p>
        )}
      </section>
    </div>
  );
}
