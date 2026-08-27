"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useState } from "react";
import { CustomSelect } from "@/components/custom-select";
import { countries } from "@/lib/countries";
import type { SiteHeaderUser } from "@/types/site-header";

export type AuthModalMode = "login" | "signup";

type AuthModalProps = {
  open: boolean;
  mode: AuthModalMode;
  onClose: () => void;
  onModeChange: (mode: AuthModalMode) => void;
  onNotification: (message: string, tone?: "success" | "error", user?: SiteHeaderUser) => void;
};

const countryOptions = countries.map((label) => ({ value: label, label }));

export function AuthModal({ open, mode, onClose, onModeChange, onNotification }: AuthModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [country, setCountry] = useState("");
  const [countryError, setCountryError] = useState(false);

  useEffect(() => {
    if (open) {
      let visibleFrame = 0;
      const mountFrame = window.requestAnimationFrame(() => {
        setMounted(true);
        visibleFrame = window.requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        window.cancelAnimationFrame(mountFrame);
        if (visibleFrame) window.cancelAnimationFrame(visibleFrame);
      };
    }

    const hideTimeout = window.setTimeout(() => setVisible(false), 0);
    const unmountTimeout = window.setTimeout(() => setMounted(false), 220);
    return () => {
      window.clearTimeout(hideTimeout);
      window.clearTimeout(unmountTimeout);
    };
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : previousOverflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted, open, onClose]);

  if (!mounted) return null;

  const isLogin = mode === "login";
  const passwordType = showPassword ? "text" : "password";
  const confirmationType = showConfirmation ? "text" : "password";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/auth/${isLogin ? "login" : "signup"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())),
      });
      const result = (await response.json()) as { message?: string; error?: string; user?: SiteHeaderUser };

      if (!response.ok) {
        const message = result.error ?? "اطلاعات واردشده را بررسی کنید.";
        if (isLogin && response.status === 401) {
          onNotification(message, "error");
          setErrorMessage("");
        } else {
          setErrorMessage(message);
        }
        return;
      }

      onClose();
      onNotification(result.message ?? (isLogin ? "ورود شما با موفقیت انجام شد." : "ثبت‌نام شما با موفقیت انجام شد."), "success", result.user);
    } catch {
      setErrorMessage("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`auth-modal${visible ? " is-visible" : ""}`} role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <section className={`auth-modal-card ${isLogin ? "is-login" : "is-signup"}`} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <button type="button" className="auth-modal-close focus-ring" aria-label="بستن مدال" onClick={onClose}>
          <span className="auth-modal-close-icon" aria-hidden="true" />
        </button>
        <Image className="auth-modal-logo" src="/ozone-logo.svg" alt="اُزون" width={96} height={96} loading="eager" />
        <div className="auth-modal-heading">
          <h2 id="auth-modal-title">{isLogin ? "ورود" : "ثبت نام"}</h2>
        </div>

        <form className="auth-modal-form" noValidate onSubmit={handleSubmit}>
            <label className="auth-modal-field">
              <span>ایمیل</span>
              <input required type="email" name="email" autoComplete="email" dir="ltr" />
            </label>

            {!isLogin && (
              <label className="auth-modal-field">
                <span>کشور خود را انتخاب کنید</span>
                <CustomSelect
                  options={countryOptions}
                  value={country}
                  onChange={(value) => {
                    setCountry(value);
                    setCountryError(false);
                  }}
                  placeholder=""
                  searchPlaceholder="جست‌وجوی کشور"
                  ariaLabel="کشور خود را انتخاب کنید"
                  invalid={countryError}
                />
                <input type="hidden" name="country" value={country} />
                <input type="hidden" name="requireCountry" value="true" />
              </label>
            )}

            <label className="auth-modal-field">
              <span>رمز ورود</span>
              <span className="auth-modal-input-wrap">
                <input required type={passwordType} name="password" autoComplete={isLogin ? "current-password" : "new-password"} />
                <button type="button" className="auth-modal-eye focus-ring" aria-label={showPassword ? "پنهان کردن رمز ورود" : "نمایش رمز ورود"} onClick={() => setShowPassword((show) => !show)}>
                  <span className={`auth-modal-eye-icon${showPassword ? " is-visible" : ""}`} aria-hidden="true">
                    <Image src="/icons/eye.svg" alt="" width={24} height={24} />
                    {!showPassword && <span className="auth-modal-eye-slash" />}
                  </span>
                </button>
              </span>
            </label>

            {!isLogin && (
              <label className="auth-modal-field">
                <span>تکرار رمز ورود</span>
                <span className="auth-modal-input-wrap">
                  <input required type={confirmationType} name="passwordConfirmation" autoComplete="new-password" />
                  <button type="button" className="auth-modal-eye focus-ring" aria-label={showConfirmation ? "پنهان کردن تکرار رمز ورود" : "نمایش تکرار رمز ورود"} onClick={() => setShowConfirmation((show) => !show)}>
                    <span className={`auth-modal-eye-icon${showConfirmation ? " is-visible" : ""}`} aria-hidden="true">
                      <Image src="/icons/eye.svg" alt="" width={24} height={24} />
                      {!showConfirmation && <span className="auth-modal-eye-slash" />}
                    </span>
                  </button>
                </span>
              </label>
            )}

            {isLogin && <button type="button" className="auth-modal-forgot" onClick={onClose}>فراموشی رمز ورود</button>}

            {errorMessage && <p className="auth-modal-error" role="alert">{errorMessage}</p>}

            <div className="auth-modal-bottom-row">
              <button type="submit" className="auth-modal-submit" disabled={isSubmitting}>
                {isSubmitting ? "لطفاً صبر کنید" : isLogin ? "وارد شدن" : "ثبت نام"}
              </button>
              <div className="auth-modal-switch">
                <span>{isLogin ? "قبلاً ثبت نام نکرده‌اید؟" : "قبلاً ثبت نام کرده‌اید؟"}</span>
                <button type="button" onClick={() => {
                  setCountry("");
                  setCountryError(false);
                  onModeChange(isLogin ? "signup" : "login");
                }}>
                  {isLogin ? "ثبت نام" : "وارد شدن"}
                </button>
              </div>
            </div>
          </form>
      </section>
    </div>
  );
}
