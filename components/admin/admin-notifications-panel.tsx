"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";

const LAST_SEEN_STORAGE_KEY = "ozone.admin.notifications.lastSeenAt";

type AdminNotification = {
  id: string;
  type: string;
  title: string;
  description: string;
  href: string | null;
  targetId: string | null;
  createdAt: string;
};

export function AdminNotificationsPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/notifications", { credentials: "same-origin", cache: "no-store" });
      const body = await response.json() as { ok?: boolean; data?: AdminNotification[] };
      if (!response.ok || !body.ok) return;
      const items = body.data ?? [];
      setNotifications(items);
      const lastSeenAt = window.localStorage.getItem(LAST_SEEN_STORAGE_KEY);
      const lastSeenTime = lastSeenAt ? Date.parse(lastSeenAt) : 0;
      setHasUnread(items.some((item) => Date.parse(item.createdAt) > lastSeenTime));
    } catch {
      // The notification center is supplementary; keep the panel usable if it is unavailable.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadNotifications(), 0);
    return () => window.clearTimeout(timer);
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void loadNotifications(), 0);
    return () => window.clearTimeout(timer);
  }, [loadNotifications, open]);

  useEffect(() => {
    const interval = window.setInterval(() => void loadNotifications(), 15000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void loadNotifications();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadNotifications]);

  function markNotificationsSeen() {
    try {
      window.localStorage.setItem(LAST_SEEN_STORAGE_KEY, new Date().toISOString());
    } catch {
      // Ignore storage restrictions; the in-memory state still updates for this visit.
    }
    setHasUnread(false);
  }

  function toggleNotifications() {
    if (!open) markNotificationsSeen();
    setOpen((value) => !value);
  }

  async function resolveTherapistProfileChange(notification: AdminNotification, action: "approve" | "reject") {
    if (notification.type !== "THERAPIST_PROFILE_CHANGE" || !notification.targetId || actingId) return;
    setActingId(notification.id);
    try {
      const response = await fetch(`/api/admin/specialists/${notification.targetId}/profile-approval`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !body.ok) {
        dispatchAdminNotification(body.message ?? "عملیات روی تغییرات متخصص انجام نشد.", "error");
        return;
      }
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      setOpen(false);
      router.refresh();
      dispatchAdminNotification(body.message ?? "عملیات انجام شد.");
    } catch {
      dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error");
    } finally {
      setActingId(null);
    }
  }

  return <>
    <button type="button" className="admin-notifications-trigger" aria-label="اعلان‌های پنل مدیریت" aria-expanded={open} onClick={toggleNotifications}>
      <span className="admin-notifications-bell" aria-hidden="true" />
      {hasUnread ? <span className="admin-notifications-unread" aria-label="اعلان خوانده‌نشده" /> : null}
    </button>
    {open ? <>
      <button type="button" className="admin-notifications-backdrop" aria-label="بستن اعلان‌ها" onClick={() => setOpen(false)} />
      <aside className="admin-notifications-drawer" aria-label="اعلان‌های پنل مدیریت">
        <header className="admin-notifications-drawer-header"><div><span className="admin-eyebrow">مرکز اطلاع‌رسانی</span><h2>اعلان‌ها</h2></div><button type="button" className="admin-notifications-close" aria-label="بستن اعلان‌ها" onClick={() => setOpen(false)}>×</button></header>
        <div className="admin-notifications-list">
          {loading ? <p className="admin-notifications-empty">در حال بارگذاری…</p> : notifications.length ? notifications.map((notification) => {
            const isProfileChange = notification.type === "THERAPIST_PROFILE_CHANGE" && Boolean(notification.targetId);
            const content = <article className="admin-notification-item"><div className="admin-notification-item-dot" aria-hidden="true" /><div><h3>{notification.title}</h3><p>{notification.description}</p><time dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString("fa-IR-u-ca-gregory", { dateStyle: "medium", timeStyle: "short" })}</time>{isProfileChange ? <div className="admin-notification-actions"><Link href={notification.href ?? `/admin/specialists/${notification.targetId}`} className="admin-notification-details-link" onClick={() => setOpen(false)}>مشاهده متخصص</Link><button type="button" className="admin-notification-approve" onClick={(event) => { event.stopPropagation(); void resolveTherapistProfileChange(notification, "approve"); }} disabled={actingId !== null}>تأیید</button><button type="button" className="admin-notification-reject" onClick={(event) => { event.stopPropagation(); void resolveTherapistProfileChange(notification, "reject"); }} disabled={actingId !== null}>رد</button></div> : null}</div></article>;
            return <div key={notification.id}>{content}</div>;
          }) : <p className="admin-notifications-empty">اعلان جدیدی وجود ندارد.</p>}
        </div>
      </aside>
    </> : null}
  </>;
}
