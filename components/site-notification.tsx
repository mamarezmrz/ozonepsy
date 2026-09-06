"use client";

import { useEffect } from "react";

type SiteNotificationProps = {
  message: string;
  tone?: "success" | "error";
  onDismiss: () => void;
};

export function SiteNotification({ message, tone = "success", onDismiss }: SiteNotificationProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 3000);
    return () => window.clearTimeout(timeout);
  }, [message, onDismiss]);

  return (
    <div className={`site-notification${tone === "error" ? " is-error" : ""}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
