"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomSelect } from "@/components/custom-select";
import { SiteNotification } from "@/components/site-notification";
import { countries } from "@/lib/countries";
import { toPersianDigits } from "@/lib/format";
import type { UserProfileData } from "@/lib/profile";

const countryOptions = countries.map((label) => ({ value: label, label }));

type ProfileFormState = Omit<UserProfileData, "avatarUrl">;
type NotificationState = { message: string; tone: "success" | "error" } | null;

function formStateFromProfile(profile: UserProfileData): ProfileFormState {
  return {
    email: profile.email,
    displayName: profile.displayName,
    phone: profile.phone,
    country: profile.country,
  };
}

export function UserProfilePage({ profile: initialProfile }: { profile: UserProfileData }) {
  const router = useRouter();
  const [savedProfile, setSavedProfile] = useState(initialProfile);
  const [form, setForm] = useState(() => formStateFromProfile(initialProfile));
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialProfile.avatarUrl);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationState>(null);
  const previewUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dismissNotification = useCallback(() => setNotification(null), []);

  const replacePreview = useCallback((next: string | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = next?.startsWith("blob:") ? next : null;
    setAvatarPreview(next);
  }, []);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const updateField = (field: keyof ProfileFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setNotification({ message: "فرمت تصویر باید JPG، PNG یا WebP باشد.", tone: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotification({ message: "حجم تصویر نباید بیشتر از ۵ مگابایت باشد.", tone: "error" });
      return;
    }

    setPendingAvatar(file);
    setRemoveAvatar(false);
    replacePreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setPendingAvatar(null);
    setRemoveAvatar(true);
    replacePreview(null);
  };

  const handleCancel = () => {
    setForm(formStateFromProfile(savedProfile));
    setPendingAvatar(null);
    setRemoveAvatar(false);
    replacePreview(savedProfile.avatarUrl);
    setNotification(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    const payload = new FormData();
    payload.set("displayName", form.displayName);
    payload.set("phone", form.phone);
    payload.set("country", form.country);
    payload.set("removeAvatar", String(removeAvatar));
    if (pendingAvatar) payload.set("avatar", pendingAvatar);

    try {
      const response = await fetch("/api/profile", { method: "PUT", body: payload });
      const result = await response.json() as { ok?: boolean; message?: string; error?: string; profile?: UserProfileData };
      if (!response.ok || !result.ok || !result.profile) {
        setNotification({ message: result.error ?? "ذخیره تغییرات امکان‌پذیر نیست.", tone: "error" });
        return;
      }

      setSavedProfile(result.profile);
      setForm(formStateFromProfile(result.profile));
      setPendingAvatar(null);
      setRemoveAvatar(false);
      replacePreview(result.profile.avatarUrl);
      setNotification({ message: result.message ?? "تغییرات پروفایل با موفقیت ذخیره شد.", tone: "success" });
      router.refresh();
    } catch {
      setNotification({ message: "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.", tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canRemoveAvatar = Boolean(avatarPreview) || Boolean(savedProfile.avatarUrl);

  return (
    <div className="user-dashboard-content">
      <section className="user-dashboard-panel user-dashboard-profile-panel">
        <h1>مشخصات من</h1>
        <form className="user-profile-form" onSubmit={handleSubmit}>
          <div className="user-profile-avatar-block">
            {avatarPreview ? (
              <Image className="user-profile-avatar" src={avatarPreview} alt="تصویر پروفایل" width={128} height={128} unoptimized />
            ) : (
              <span className="user-profile-avatar-placeholder" aria-label="تصویر پروفایل انتخاب نشده" />
            )}
            <div className="user-profile-avatar-actions">
              <button type="button" onClick={() => fileInputRef.current?.click()}>آپلود تصویر</button>
              {canRemoveAvatar && <button type="button" className="is-danger" onClick={handleRemoveAvatar}>حذف تصویر</button>}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} hidden />
            </div>
          </div>

          <label className="user-profile-field user-profile-name-field">
            <span>نام و نام خانوادگی</span>
            <input value={form.displayName} onChange={(event) => updateField("displayName", event.target.value)} maxLength={200} autoComplete="name" />
          </label>

          <div className="user-profile-email-field user-profile-email-row">
            <label className="user-profile-field">
              <span>ایمیل</span>
              <input value={form.email} readOnly dir="ltr" autoComplete="email" />
            </label>
            <Link className="user-profile-recovery-link" href="/forgot-password">بازیابی رمز ورود</Link>
          </div>

          <label className="user-profile-field user-profile-phone-field">
            <span>شماره تلفن</span>
            <input value={toPersianDigits(form.phone)} onChange={(event) => updateField("phone", toPersianDigits(event.target.value))} maxLength={40} inputMode="tel" dir="ltr" autoComplete="tel" />
          </label>

          <label className="user-profile-field user-profile-country-field">
            <span>کشور</span>
            <CustomSelect options={countryOptions} value={form.country} onChange={(value) => updateField("country", value)} placeholder="" searchPlaceholder="جست‌وجوی کشور" ariaLabel="کشور" />
          </label>

          <div className="user-profile-actions">
            <button type="submit" className="user-profile-save-button" disabled={isSubmitting}>{isSubmitting ? "در حال ذخیره" : "ذخیره تغییرات"}</button>
            <button type="button" className="user-profile-cancel-button" onClick={handleCancel} disabled={isSubmitting}>انصراف</button>
          </div>
        </form>
      </section>
      {notification && <SiteNotification message={notification.message} tone={notification.tone} onDismiss={dismissNotification} />}
    </div>
  );
}
