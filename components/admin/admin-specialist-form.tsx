"use client";

import { AdminMutationForm } from "@/components/admin/admin-mutation-form";

type Values = { slug?: string; displayName?: string; specialty?: string | null; bio?: string | null; imageUrl?: string | null; userId?: string | null };

export function AdminSpecialistForm({ action, method = "POST", values = {}, successRedirect }: { action: string; method?: "POST" | "PATCH"; values?: Values; successRedirect?: string }) {
  return <AdminMutationForm action={action} method={method} successRedirect={successRedirect}>
    <div className="admin-form-grid">
      <label className="admin-form-field"><span>نام نمایشی</span><input name="displayName" defaultValue={values.displayName ?? ""} required /></label>
      <label className="admin-form-field"><span>Slug</span><input name="slug" dir="ltr" defaultValue={values.slug ?? ""} required /></label>
      <label className="admin-form-field"><span>تخصص</span><input name="specialty" defaultValue={values.specialty ?? ""} /></label>
      <label className="admin-form-field"><span>شناسه کاربر مرتبط (اختیاری)</span><input name="userId" dir="ltr" defaultValue={values.userId ?? ""} placeholder="UUID" /></label>
    </div>
    <label className="admin-form-field"><span>معرفی</span><textarea name="bio" rows={6} defaultValue={values.bio ?? ""} /></label>
    <label className="admin-form-field"><span>آدرس تصویر (اختیاری)</span><input name="imageUrl" dir="ltr" defaultValue={values.imageUrl ?? ""} /></label>
  </AdminMutationForm>;
}
