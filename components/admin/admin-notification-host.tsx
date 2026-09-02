"use client";

import { useEffect, useState } from "react";
import { SiteNotification } from "@/components/site-notification";

type AdminNotification = {
  message: string;
  tone: "success" | "error";
};

export function AdminNotificationHost() {
  const [notification, setNotification] = useState<AdminNotification | null>(null);

  useEffect(() => {
    const handleNotification = (event: Event) => {
      const detail = (event as CustomEvent<AdminNotification>).detail;
      if (!detail?.message) return;
      setNotification({ message: detail.message, tone: detail.tone ?? "success" });
    };

    window.addEventListener("admin-notification", handleNotification);
    return () => window.removeEventListener("admin-notification", handleNotification);
  }, []);

  return notification ? <SiteNotification message={notification.message} tone={notification.tone} onDismiss={() => setNotification(null)} /> : null;
}
