"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CourseOption = { id: string; title: string; slug: string; status: string };

export function AdminSpecialistCoursesForm({ specialistId, options, selectedIds }: { specialistId: string; options: CourseOption[]; selectedIds: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => new Set(selectedIds));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function submit() {
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/specialists/${specialistId}`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseIds: Array.from(selected) }),
      });
      const body = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !body.ok) { setError(body.message ?? "تخصیص دوره‌ها انجام نشد."); return; }
      setMessage(body.message ?? "تخصیص دوره‌ها ذخیره شد.");
      router.refresh();
    } catch { setError("ارتباط با سرور برقرار نشد."); }
    finally { setPending(false); }
  }

  return <div className="admin-specialist-courses-form">
    {options.length ? <div className="admin-option-list">{options.map((course) => <label key={course.id} className="admin-option-item"><input type="checkbox" checked={selected.has(course.id)} onChange={() => toggle(course.id)} /><span><strong>{course.title}</strong><small dir="ltr">{course.slug}</small></span></label>)}</div> : <p className="admin-table-empty">دوره‌ای برای تخصیص وجود ندارد.</p>}
    {error ? <p className="admin-inline-error" role="alert">{error}</p> : null}
    {message ? <p className="admin-inline-success" role="status">{message}</p> : null}
    <div className="admin-form-actions"><button type="button" className="admin-button admin-button-primary" onClick={submit} disabled={pending}>{pending ? "در حال ذخیره…" : "ذخیره تخصیص دوره‌ها"}</button></div>
  </div>;
}
