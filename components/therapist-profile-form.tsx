"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminCountrySelect } from "@/components/admin/admin-user-fields";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";
import type { TherapistSessionView } from "@/lib/auth/therapist";

type ProfileValues = TherapistSessionView["specialist"];

export function TherapistProfileForm({ values }: { values: ProfileValues }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch("/api/therapists/profile", {
        method: "PATCH",
        credentials: "same-origin",
        body: new FormData(event.currentTarget),
      });
      const body = await response.json() as { ok?: boolean; message?: string; error?: string };
      if (!response.ok || !body.ok) {
        dispatchAdminNotification(body.message ?? body.error ?? "ذخیره اطلاعات انجام نشد.", "error");
        return;
      }
      dispatchAdminNotification(body.message ?? "اطلاعات پروفایل برای بررسی مدیریت ارسال شد؛ پس از تأیید، تغییرات در پروفایل عمومی نمایش داده می‌شود.");
      router.refresh();
    } catch {
      dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error");
    } finally {
      setPending(false);
    }
  }

  return <form className="admin-form-stack therapist-specialist-form" onSubmit={submit} encType="multipart/form-data" noValidate>
    <div className="admin-form-grid therapist-profile-grid">
      <label className="admin-form-field"><span>نام و نام خانوادگی</span><input name="displayName" defaultValue={values.displayName} maxLength={200} required /></label>
      <label className="admin-form-field"><span>ایمیل</span><input name="email" type="email" defaultValue={values.email ?? ""} dir="ltr" maxLength={320} required /></label>
      <label className="admin-form-field"><span>تخصص</span><input name="specialty" defaultValue={values.specialty ?? ""} maxLength={200} /></label>
      <label className="admin-form-field"><span>شماره تماس</span><input name="phone" defaultValue={values.phone ?? ""} dir="ltr" maxLength={40} /></label>
      <label className="admin-form-field"><span>کشور</span><AdminCountrySelect name="country" defaultValue={values.country ?? ""} ariaLabel="کشور متخصص" /></label>
    </div>
    <div className="admin-form-actions"><button type="submit" className="admin-button admin-button-primary" disabled={pending}>{pending ? "در حال ذخیره…" : "ذخیره اطلاعات"}</button></div>
  </form>;
}
