"use client";

import { AdminMutationForm, AdminMutationPrepareError } from "@/components/admin/admin-mutation-form";
import { AdminCountrySelect, AdminLatinPasswordInput } from "@/components/admin/admin-user-fields";
import { AdminSpecialistProfileContent, type SpecialistProfileContentValues } from "@/components/admin/admin-specialist-profile-content";
import { AdminSpecialistLivePreview } from "@/components/admin/admin-specialist-live-preview";
import Image from "next/image";
import { useEffect, useState } from "react";

type Values = SpecialistProfileContentValues & { displayName?: string; specialty?: string | null; phone?: string | null; country?: string | null; email?: string | null; imageUrl?: string | null; profileMediaId?: string | null; bio?: string | null; accountActive?: boolean; hasAccount?: boolean };

export function AdminSpecialistForm({ action, method = "POST", values = {}, successRedirect, livePreview = false }: { action: string; method?: "POST" | "PATCH"; values?: Values; successRedirect?: string; livePreview?: boolean }) {
  const initialImage = values.profileMediaId ? `/api/admin/media/${values.profileMediaId}/preview` : values.imageUrl ?? "";
  const [previewValues, setPreviewValues] = useState<Values>({ ...values, imageUrl: initialImage });
  const [imagePreview, setImagePreview] = useState(initialImage);
  const accountFieldsVisible = method === "POST" || values.hasAccount === false;

  useEffect(() => () => {
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  function updatePreview(update: Partial<Values>) {
    setPreviewValues((current) => ({ ...current, ...update }));
  }

  function selectImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    updatePreview({ imageUrl: preview });
  }

  async function preparePayload(form: FormData) {
    const payload = Object.fromEntries(form.entries());
    const file = form.get("profileImage");
    delete payload.profileImage;
    if (!(file instanceof File) || file.size === 0) return payload;

    const uploadForm = new FormData();
    uploadForm.set("file", file);
    const response = await fetch("/api/admin/specialists/profile-image", { method: "POST", credentials: "same-origin", body: uploadForm });
    const body = await response.json() as { ok?: boolean; message?: string; data?: { id?: string } };
    if (!response.ok || !body.ok || !body.data?.id) throw new AdminMutationPrepareError(body.message ?? "بارگذاری تصویر متخصص انجام نشد.");
    return { ...payload, profileMediaId: body.data.id };
  }

  const formFields = <>
    <div className="admin-form-grid admin-specialist-form-grid">
      <div className="admin-specialist-form-row admin-specialist-form-row-primary">
        <label className="admin-form-field"><span>نام و نام خانوادگی</span><input name="displayName" defaultValue={values.displayName ?? ""} onChange={(event) => updatePreview({ displayName: event.target.value })} required /></label>
        <label className="admin-form-field"><span>ایمیل ورود</span><input name="email" type="email" defaultValue={values.email ?? ""} dir="ltr" autoComplete="email" required /></label>
        <label className="admin-form-field"><span>شماره تماس</span><input name="phone" defaultValue={values.phone ?? ""} dir="ltr" autoComplete="tel" /></label>
      </div>
      <div className="admin-specialist-form-row admin-specialist-form-row-secondary">
        <label className="admin-form-field"><span>تخصص</span><input name="specialty" defaultValue={values.specialty ?? ""} onChange={(event) => updatePreview({ specialty: event.target.value })} /></label>
        <label className="admin-form-field"><span>کشور</span><AdminCountrySelect name="country" defaultValue={values.country ?? ""} ariaLabel="کشور متخصص" /></label>
      </div>
      <div className="admin-form-field admin-form-field-full admin-specialist-image-field">
        <span>تصویر پروفایل</span>
        <div className="admin-specialist-image-upload-row">
          <label className="admin-specialist-image-picker">
            <span>{imagePreview ? "تغییر تصویر" : "انتخاب تصویر"}</span>
            <input name="profileImage" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} />
          </label>
          {imagePreview ? <Image className="admin-specialist-image-preview" src={imagePreview} alt="پیش‌نمایش تصویر متخصص" width={112} height={112} unoptimized /> : <span className="admin-specialist-image-empty">هنوز تصویری انتخاب نشده است.</span>}
        </div>
        <small>فرمت‌های مجاز: JPG، PNG و WEBP — حداکثر ۱۰ مگابایت</small>
        <input type="hidden" name="profileMediaId" value={previewValues.profileMediaId ?? values.profileMediaId ?? ""} />
      </div>
      <label className="admin-specialist-active-field"><input type="hidden" name="accountActive" value="false" /><input type="checkbox" name="accountActive" value="true" defaultChecked={values.accountActive !== false} /><span>حساب متخصص فعال باشد</span></label>
      {accountFieldsVisible ? <div className="admin-specialist-form-row admin-specialist-form-row-passwords">
        <label className="admin-form-field"><span>{method === "POST" ? "رمز اولیه" : "رمز اولیهٔ حساب"}</span><AdminLatinPasswordInput name="initialPassword" minLength={12} required /></label>
        <label className="admin-form-field"><span>تکرار رمز اولیه</span><AdminLatinPasswordInput name="initialPasswordConfirmation" minLength={12} required /></label>
      </div> : null}
    </div>
    <AdminSpecialistProfileContent values={previewValues} onChange={(content) => setPreviewValues((current) => ({ ...current, ...content }))} />
  </>;

  return <AdminMutationForm action={action} method={method} preparePayload={preparePayload} successRedirect={successRedirect} notification successMessage={method === "POST" ? "متخصص جدید اضافه شد." : "اطلاعات متخصص به‌روزرسانی شد."} className={livePreview ? "admin-form-stack admin-specialist-editor-form" : "admin-form-stack"}>
    {livePreview ? <div className="admin-specialist-editor-layout"><div className="admin-specialist-editor-fields">{formFields}</div><AdminSpecialistLivePreview values={previewValues} /></div> : formFields}
  </AdminMutationForm>;
}
