"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AdminCountrySelect } from "@/components/admin/admin-user-fields";
import { AdminSpecialistProfileContent } from "@/components/admin/admin-specialist-profile-content";
import { AdminSpecialistLivePreview } from "@/components/admin/admin-specialist-live-preview";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";
import type { TherapistSessionView } from "@/lib/auth/therapist";

type ProfileValues = TherapistSessionView["specialist"];

function profileImage(values: ProfileValues) {
  return values.profileMediaId ? `/api/media/${values.profileMediaId}` : values.imageUrl || "/ozone-logo.svg";
}

export function TherapistProfileForm({ values }: { values: ProfileValues }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const initialImage = profileImage(values);
  const [previewValues, setPreviewValues] = useState<ProfileValues>({ ...values, imageUrl: initialImage });
  const [imagePreview, setImagePreview] = useState(initialImage);

  useEffect(() => () => {
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setPreviewValues((current) => ({ ...current, imageUrl: preview }));
  }

  function updatePreview(update: Partial<ProfileValues>) {
    setPreviewValues((current) => ({ ...current, ...update }));
  }

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
      dispatchAdminNotification(body.message ?? "اطلاعات پروفایل ذخیره شد.");
      router.refresh();
    } catch {
      dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error");
    } finally {
      setPending(false);
    }
  }

  return <form className="admin-form-stack therapist-specialist-form" onSubmit={submit} encType="multipart/form-data" noValidate>
    <div className="admin-specialist-editor-layout">
      <div className="admin-specialist-editor-fields">
        <div className="admin-form-grid therapist-profile-grid">
      <label className="admin-form-field"><span>نام و نام خانوادگی</span><input name="displayName" defaultValue={values.displayName} onChange={(event) => updatePreview({ displayName: event.target.value })} maxLength={200} required /></label>
      <label className="admin-form-field"><span>ایمیل</span><input name="email" type="email" defaultValue={values.email ?? ""} dir="ltr" maxLength={320} required /></label>
      <label className="admin-form-field"><span>تخصص</span><input name="specialty" defaultValue={values.specialty ?? ""} onChange={(event) => updatePreview({ specialty: event.target.value })} maxLength={200} /></label>
      <label className="admin-form-field"><span>شماره تماس</span><input name="phone" defaultValue={values.phone ?? ""} dir="ltr" maxLength={40} /></label>
      <label className="admin-form-field"><span>کشور</span><AdminCountrySelect name="country" defaultValue={values.country ?? ""} ariaLabel="کشور متخصص" /></label>
      <label className="admin-form-field"><span>شناسه صفحه عمومی</span><input name="slug" defaultValue={values.slug} dir="ltr" readOnly aria-readonly="true" /></label>
      <label className="admin-form-field admin-form-field-full"><span>معرفی کوتاه</span><textarea name="bio" defaultValue={values.bio ?? ""} onChange={(event) => updatePreview({ bio: event.target.value })} maxLength={10000} rows={6} /></label>
      <div className="admin-form-field admin-form-field-full therapist-profile-image-field">
        <span>تصویر پروفایل</span>
        <div className="therapist-profile-image-upload-row">
          <label className="therapist-profile-image-picker">
            <span>انتخاب تصویر</span>
            <input name="profileImage" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} />
          </label>
          <Image className="therapist-profile-image-preview" src={imagePreview} alt="پیش‌نمایش تصویر پروفایل" width={112} height={112} unoptimized />
        </div>
        <small>فرمت‌های مجاز: JPG، PNG و WEBP — حداکثر ۱۰ مگابایت</small>
      </div>
    </div>

        <AdminSpecialistProfileContent values={{ profileSections: previewValues.profileSections }} onChange={(next) => updatePreview({ profileSections: next.profileSections ?? [] })} />
        <div className="admin-form-actions"><button type="submit" className="admin-button admin-button-primary" disabled={pending}>{pending ? "در حال ذخیره…" : "ذخیره اطلاعات"}</button></div>
      </div>
      <AdminSpecialistLivePreview values={previewValues} />
    </div>
  </form>;
}
