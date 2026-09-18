"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";

const options = [{ value: "COMPLETED", label: "برگزارشده" }, { value: "CANCELED", label: "لغوشده" }, { value: "NO_SHOW", label: "عدم حضور" }] as const;

export function TherapistSessionStatusMenu({ appointmentId, disabled = false }: { appointmentId: string; disabled?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function change(event: React.ChangeEvent<HTMLSelectElement>) {
    const status = event.target.value;
    if (!status) return;
    setPending(true);
    try {
      const response = await fetch(`/api/therapists/sessions/${appointmentId}/status`, { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
      const body = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !body.ok) { dispatchAdminNotification(body.message ?? "تغییر وضعیت انجام نشد.", "error"); return; }
      dispatchAdminNotification(body.message ?? "وضعیت جلسه تغییر کرد.");
      router.refresh();
    } catch { dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error"); }
    finally { setPending(false); }
  }
  return <select className="therapist-status-select" aria-label="تغییر وضعیت جلسه" defaultValue="" disabled={disabled || pending} onChange={change}><option value="">تغییر وضعیت</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
}
