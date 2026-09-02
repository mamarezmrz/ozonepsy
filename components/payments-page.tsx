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
  orientation = "vertical",
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  ariaLabel?: string;
  ariaControls?: string;
  orientation?: "vertical" | "horizontal";
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

    const visibleSize = orientation === "vertical" ? element.clientHeight : element.clientWidth;
    const contentSize = orientation === "vertical" ? element.scrollHeight : element.scrollWidth;
    const scrollRange = Math.max(0, contentSize - visibleSize);
    const canScroll = scrollRange > 1;
    const trackSize = orientation === "vertical" ? track.clientHeight : track.clientWidth;
    const scrollPosition = orientation === "vertical" ? element.scrollTop : Math.abs(element.scrollLeft);

    setIsScrollable(canScroll);
    setScrollMetrics({ max: scrollRange, top: scrollPosition });

    if (!canScroll) {
      setThumb({ height: trackSize, offset: 0 });
      return;
    }

    const thumbHeight = Math.max(36, Math.round((visibleSize / contentSize) * trackSize));
    const thumbRange = Math.max(0, trackSize - thumbHeight);
    const offset = orientation === "horizontal"
      ? Math.round((1 - scrollPosition / scrollRange) * thumbRange)
      : Math.round((scrollPosition / scrollRange) * thumbRange);

    setThumb({ height: thumbHeight, offset });
  }, [orientation, scrollRef]);

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
    const clickPosition = orientation === "vertical" ? event.clientY - bounds.top : event.clientX - bounds.left;
    const trackLength = orientation === "vertical" ? bounds.height : bounds.width;
    const scrollRange = orientation === "vertical" ? element.scrollHeight - element.clientHeight : element.scrollWidth - element.clientWidth;
    const nextPosition = Math.max(0, Math.min(scrollRange, orientation === "horizontal" ? (1 - clickPosition / trackLength) * scrollRange : (clickPosition / trackLength) * scrollRange));
    if (orientation === "vertical") {
      element.scrollTop = nextPosition;
    } else {
      element.scrollLeft = -nextPosition;
    }
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
      startY: orientation === "vertical" ? event.clientY : event.clientX,
      startScrollTop: orientation === "vertical" ? element.scrollTop : Math.abs(element.scrollLeft),
    };
  };

  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const element = scrollRef.current;
    const track = trackRef.current;
    const dragState = dragRef.current;

    if (!element || !track || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const scrollRange = orientation === "vertical" ? element.scrollHeight - element.clientHeight : element.scrollWidth - element.clientWidth;
    const trackLength = orientation === "vertical" ? track.clientHeight : track.clientWidth;
    const pointerPosition = orientation === "vertical" ? event.clientY : event.clientX;
    const thumbRange = Math.max(1, trackLength - thumb.height);
    const scrollDelta = ((pointerPosition - dragState.startY) / thumbRange) * scrollRange;
    const nextPosition = Math.max(0, Math.min(scrollRange, orientation === "horizontal" ? dragState.startScrollTop - scrollDelta : dragState.startScrollTop + scrollDelta));

    if (orientation === "vertical") {
      element.scrollTop = nextPosition;
    } else {
      element.scrollLeft = -nextPosition;
    }
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

    const amount = event.key === "PageUp" || event.key === "PageDown" ? (orientation === "vertical" ? element.clientHeight : element.clientWidth) : 80;
    const scrollPosition = orientation === "vertical" ? element.scrollTop : Math.abs(element.scrollLeft);
    const setPosition = (position: number) => {
      if (orientation === "vertical") element.scrollTop = position;
      else element.scrollLeft = -position;
    };
    if (orientation === "vertical" && (event.key === "ArrowUp" || event.key === "PageUp")) {
      setPosition(scrollPosition - amount);
      event.preventDefault();
    }
    if (orientation === "vertical" && (event.key === "ArrowDown" || event.key === "PageDown")) {
      setPosition(scrollPosition + amount);
      event.preventDefault();
    }
    if (orientation === "horizontal" && (event.key === "ArrowLeft" || event.key === "PageUp")) {
      setPosition(scrollPosition + amount);
      event.preventDefault();
    }
    if (orientation === "horizontal" && (event.key === "ArrowRight" || event.key === "PageDown")) {
      setPosition(scrollPosition - amount);
      event.preventDefault();
    }
    if (event.key === "Home") {
      setPosition(orientation === "horizontal" ? element.scrollWidth - element.clientWidth : 0);
      event.preventDefault();
    }
    if (event.key === "End") {
      setPosition(orientation === "vertical" ? element.scrollHeight : 0);
      event.preventDefault();
    }
  };

  return (
    <div
      ref={trackRef}
      className={`dashboard-payments-page-scrollbar${orientation === "horizontal" ? " is-horizontal" : ""}`}
      role="scrollbar"
      aria-label={ariaLabel}
      aria-controls={ariaControls}
      aria-orientation={orientation}
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
          style={orientation === "vertical" ? { height: `${thumb.height}px`, transform: `translateY(${thumb.offset}px)` } : { width: `${thumb.height}px`, transform: `translateX(${thumb.offset}px)` }}
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
