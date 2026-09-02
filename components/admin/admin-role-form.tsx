"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ADMIN_ROLE_LABELS, ADMIN_ROLES, type AdminRole } from "@/lib/admin/constants";

export function AdminRoleForm({ adminId, currentRole }: { adminId: string; currentRole: AdminRole }) {
  const router = useRouter();
  const [role, setRole] = useState<AdminRole>(currentRole);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason.trim()) {
      setError("دلیل تغییر نقش الزامی است.");
      return;
    }
    if (role === currentRole) {
      setError("نقش جدید را انتخاب کنید.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, reason: reason.trim() }),
      });
      const body = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !body.ok) {
        setError(body.message ?? "تغییر نقش انجام نشد.");
        return;
      }
      setReason("");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setPending(false);
    }
  }

  return <form className="admin-role-form" onSubmit={submit}>
    <label className="admin-form-field"><span>نقش جدید</span><select value={role} onChange={(event) => setRole(event.target.value as AdminRole)}>{ADMIN_ROLES.map((item) => <option key={item} value={item}>{ADMIN_ROLE_LABELS[item]}</option>)}</select></label>
    <label className="admin-form-field"><span>دلیل تغییر</span><input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} required /></label>
    {error ? <p className="admin-inline-error" role="alert">{error}</p> : null}
    <button type="submit" className="admin-button admin-button-secondary" disabled={pending}>{pending ? "در حال ذخیره…" : "تغییر نقش"}</button>
  </form>;
}
