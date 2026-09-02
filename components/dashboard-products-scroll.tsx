"use client";

import { useRef, type ReactNode } from "react";
import { PaymentsScrollbar } from "@/components/payments-page";

export function DashboardProductsScroll({
  listId,
  ariaLabel,
  orientation = "vertical",
  className,
  children,
}: {
  listId: string;
  ariaLabel: string;
  orientation?: "vertical" | "horizontal";
  className: string;
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className={`user-dashboard-products-scroll-shell${orientation === "horizontal" ? " is-horizontal" : ""}`}>
      <div id={listId} ref={scrollRef} className={className}>
        {children}
      </div>
      <PaymentsScrollbar scrollRef={scrollRef} ariaLabel={ariaLabel} ariaControls={listId} orientation={orientation} />
    </div>
  );
}
