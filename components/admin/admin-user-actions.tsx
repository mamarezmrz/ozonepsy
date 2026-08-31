"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";

export function AdminUserActions({ userId, status }: { userId: string; status: UserStatus }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<UserStatus | null>(null);
  const [reason, setReason] = useState("");
  const nextStatus: UserStatus = status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

  async function submit() {
    if (!confirming || !reason.trim()) return;
    setPending(true); setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: confirming, reason }) });
      const body = await response.json() as { message?: string };
      if (!response.ok) { setError(body.message ?? "تغییر وضعیت انجام نشد."); return; }
      setConfirming(null); setReason(""); router.refresh();
    } catch { setError("ارتباط با سرور برقرار نشد."); }
    finally { setPending(false); }
  }

  return <div className="admin-action-stack">
    <div className="admin-table-actions"><button type="button" className="admin-inline-action" onClick={() => { setConfirming(nextStatus); setReason(""); }} disabled={pending}>{status === "ACTIVE" ? "تعلیق کاربر" : "بازگردانی کاربر"}</button>{status !== "ARCHIVED" ? <button type="button" className="admin-inline-action admin-inline-action-danger" onClick={() => { setConfirming("ARCHIVED"); setReason(""); }} disabled={pending}>بایگانی</button> : null}</div>
    {confirming ? <div className="admin-confirm-panel" role="dialog" aria-label="تأیید تغییر وضعیت"><strong>{confirming === "SUSPENDED" ? "تعلیق کاربر" : confirming === "ARCHIVED" ? "بایگانی کاربر" : "بازگردانی کاربر"}</strong><label><span>دلیل</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="دلیل این عملیات را وارد کنید…" /></label><div className="admin-table-actions"><button type="button" className="admin-button admin-button-secondary" onClick={() => setConfirming(null)} disabled={pending}>انصراف</button><button type="button" className="admin-button admin-button-danger" onClick={submit} disabled={pending || !reason.trim()}>{pending ? "در حال ذخیره…" : "تأیید"}</button></div>{error ? <p className="admin-inline-error" role="alert">{error}</p> : null}</div> : null}
  </div>;
}
