"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";
import type { FaqPageKey } from "@/lib/public/faq-pages";

export function AdminFaqInitializeButton({ pageKey }: { pageKey: FaqPageKey }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function initialize() {
    setPending(true);
    try {
      const response = await fetch("/api/admin/content/faq", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ initializeDefaults: true, pageKey }) });
      const body = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !body.ok) {
        dispatchAdminNotification(body.message ?? "سوال‌های صفحه اضافه نشدند.", "error");
        return;
      }
      dispatchAdminNotification(body.message ?? "سوال‌های صفحه به پنل اضافه شدند.");
      router.refresh();
    } catch {
      dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error");
    } finally {
      setPending(false);
    }
  }

  return <button type="button" className="admin-button admin-button-secondary" onClick={() => void initialize()} disabled={pending}>{pending ? "در حال آماده‌سازی…" : "افزودن سوال‌های فعلی به پنل"}</button>;
}
