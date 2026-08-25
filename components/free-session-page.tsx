"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { CustomSelect } from "@/components/custom-select";
import { HomeFaq, HomeTestimonials } from "@/components/home-interactive";
import { SiteNotification } from "@/components/site-notification";
import { countries } from "@/lib/countries";

const asset = (name: string) => `/figma-home/${name}`;
const countryOptions = countries.map((label) => ({ value: label, label }));

export function FreeSessionPage() {
  return (
    <main className="free-session-page">
      <div className="free-session-page-inner">
        <figure className="free-session-hero-image">
          <Image
            className="free-session-hero-media"
            src={asset("5dac2277462f6b310726942ed419287d1a9f89c3.png")}
            alt="مشاور اُزون آماده گفت‌وگو با شماست"
            fill
            priority
            quality={100}
            sizes="(max-width: 900px) 100vw, 960px"
          />
          <Image className="free-session-hero-logo" src="/ozone-logo.svg" alt="اُزون" width={72} height={72} />
        </figure>

        <section className="free-session-reservation" aria-labelledby="free-session-title">
          <div className="free-session-copy">
            <h1 id="free-session-title">رزرو پیش مشاوره رایگان</h1>
            <p>
              برای یک گفت‌وگوی کوتاه، بی‌تعهد و محرمانه:<br />
              رزرو ۱۰ دقیقه رایگان یا پیام در واتساپ/تماس<br />
              اگر مردد هستید، همین گفت‌وگوی کوتاه می‌تواند قدم اول مطمئن باشد.
            </p>
          </div>
          <FreeSessionForm />
        </section>
      </div>

      <section className="free-session-testimonials home-testimonials" aria-labelledby="free-session-testimonials-title">
        <div className="home-testimonial-heading">
          <h2 id="free-session-testimonials-title">تجربیات دیگران از این جلسه</h2>
          <p>شما می‌توانید با مشاوری که خودتون انتخاب کردید جلسه‌تون رو برگزار کنید و یا بر اساس پیشنهادات همکاران ما یکی از مشاوران پیشنهاد شده رو انتخاب کنید.</p>
        </div>
        <HomeTestimonials />
      </section>

      <section className="free-session-faq home-faq" aria-labelledby="free-session-faq-title">
        <div className="home-faq-inner">
          <h2 id="free-session-faq-title">سوالات متداول پیش مشاوره رایگان</h2>
          <HomeFaq />
        </div>
      </section>
    </main>
  );
}

function FreeSessionForm() {
  const [country, setCountry] = useState("");
  const [countryError, setCountryError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotification(null);
    setCountryError(false);

    const form = new FormData(event.currentTarget);
    const selectedCountry = String(form.get("country") ?? "");
    if (!selectedCountry) {
      setCountryError(true);
      setNotification({ message: "لطفاً کشور خود را انتخاب کنید.", tone: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/preconsultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: selectedCountry,
          phone: form.get("phone"),
          message: form.get("message"),
        }),
      });
      const result = await response.json() as { message?: string; error?: string };

      if (!response.ok) {
        setNotification({ message: result.error ?? "اطلاعات واردشده را بررسی کنید.", tone: "error" });
        return;
      }

      setNotification({ message: result.message ?? "درخواست شما با موفقیت ثبت شد.", tone: "success" });
      event.currentTarget.reset();
      setCountry("");
    } catch {
      setNotification({ message: "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.", tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="free-session-form-slot">
      {notification && (
        <SiteNotification
          message={notification.message}
          tone={notification.tone}
          onDismiss={() => setNotification(null)}
        />
      )}
      <form className="free-session-form" noValidate onSubmit={handleSubmit}>
        <label htmlFor="free-session-country">کشور خود را انتخاب کنید</label>
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
        <input type="hidden" id="free-session-country" name="country" value={country} />

        <label htmlFor="free-session-phone">شماره تماس</label>
        <input id="free-session-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" required />

        <label htmlFor="free-session-message">توضیح مختصری در مورد دلیل مراجعه‌تان بنویسید</label>
        <textarea id="free-session-message" name="message" rows={4} />

        <button type="submit" disabled={isSubmitting}>{isSubmitting ? "لطفاً صبر کنید" : "ثبت درخواست"}</button>
      </form>
    </div>
  );
}
