"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminActionButton({ action, label, method = "POST", variant = "secondary", confirm, reasonRequired = false, body }: { action: string; label: string; method?: "POST" | "PATCH" | "DELETE"; variant?: "primary" | "secondary" | "danger"; confirm?: string; reasonRequired?: boolean; body?: Record<string, unknown> }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function click() {
    if (confirm && !window.confirm(confirm)) return;
    const reason = reasonRequired ? window.prompt("دلیل این تغییر را وارد کنید:")?.trim() : undefined;
    if (reasonRequired && !reason) return;
    setPending(true); setError(null);
    try {
      const response = await fetch(action, { method, credentials: "same-origin", headers: { "content-type": "application/json" }, body: method === "DELETE" ? undefined : JSON.stringify({ ...body, ...(reason ? { reason } : {}) }) });
      const responseBody = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !responseBody.ok) { setError(responseBody.message ?? "عملیات انجام نشد."); return; }
      router.refresh();
    } catch { setError("ارتباط با سرور برقرار نشد."); } finally { setPending(false); }
  }
  return <span className="admin-action-control"><button type="button" className={`admin-button admin-button-${variant}`} onClick={click} disabled={pending}>{pending ? "در حال انجام…" : label}</button>{error ? <small className="admin-inline-error" role="alert">{error}</small> : null}</span>;
}
