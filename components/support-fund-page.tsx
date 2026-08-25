"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { HomeFaq } from "@/components/home-interactive";
import { SiteNotification } from "@/components/site-notification";
import { formatPersianNumber } from "@/lib/format";

const asset = (name: string) => `/figma-home/${name}`;

const supportedCountries = [
  { file: "flags/australia.svg", label: "استرالیا" },
  { file: "flags/austria.svg", label: "اتریش" },
  { file: "flags/canada.svg", label: "کانادا" },
  { file: "flags/england.svg", label: "انگلستان" },
  { file: "flags/france.svg", label: "فرانسه" },
  { file: "flags/germany.svg", label: "آلمان" },
  { file: "flags/italy.svg", label: "ایتالیا" },
  { file: "flags/netherlands.svg", label: "هلند" },
  { file: "flags/spain.svg", label: "اسپانیا" },
  { file: "flags/sweden.svg", label: "سوئد" },
  { file: "flags/switzerland.svg", label: "سوئیس" },
  { file: "flags/usa.svg", label: "آمریکا" },
] as const;

export function SupportFundPage() {
  return (
    <main className="support-fund-page">
      <div className="support-fund-page-inner">
        <figure className="support-fund-hero-image">
          <Image
            className="support-fund-hero-media"
            src={asset("cd976b041a01a7ad47fb775b4c66ddce3201e1b5.jpg")}
            alt="دست‌هایی که نماد همراهی و حمایت هستند"
            fill
            priority
            quality={100}
            sizes="(max-width: 900px) 100vw, 960px"
          />
          <Image className="support-fund-hero-logo" src="/ozone-logo.svg" alt="اُزون" width={72} height={72} />
        </figure>

        <section className="support-fund-intro" aria-labelledby="support-fund-title">
          <h1 id="support-fund-title">صندوق حمایت</h1>
          <p>ما در موسسه اُزون در راستای مسئولیت اجتماعی خود، صندوق حمایت ایجاد کرده‌ایم. هدف از ایجاد این صندوق حمایت از افرادی است که توان استفاده از خدمات سلامت روان را ندارند.</p>
        </section>

        <section className="support-fund-total" aria-labelledby="support-fund-total-title">
          <h2 id="support-fund-total-title">مجموع کمک‌های جمع‌آوری شده</h2>
          <div className="support-fund-total-value"><strong>{formatPersianNumber(2345)}</strong><span>دلار</span></div>
        </section>

        <SupportFundForm />

        <section className="support-fund-countries" aria-labelledby="support-fund-countries-title">
          <h2 id="support-fund-countries-title">حمایت شما</h2>
          <p>توضیح درباره‌ی این که مبالغ دریافت شده تاکنون چگونه به افراد نیازمند پرداخت شده و چه تأثیری ایجاد شده است.</p>
          <div className="support-fund-country-list">
            {supportedCountries.map(({ file, label }) => (
              <span key={label} className="support-fund-country" title={label}>
                <Image src={asset(file)} alt={label} width={80} height={80} />
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className="support-fund-faq home-faq" aria-labelledby="support-fund-faq-title">
        <div className="home-faq-inner">
          <h2 id="support-fund-faq-title">سوالات متداول صندوق حمایتی</h2>
          <HomeFaq />
        </div>
      </section>
    </main>
  );
}

function SupportFundForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotification(null);
    setIsSubmitting(true);

    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/support-fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorName: form.get("donorName"), amount: form.get("amount") }),
      });
      const result = await response.json() as { message?: string; error?: string };

      if (!response.ok) {
        setNotification({ message: result.error ?? "اطلاعات واردشده را بررسی کنید.", tone: "error" });
        return;
      }

      setNotification({ message: result.message ?? "درخواست حمایت شما ثبت شد.", tone: "success" });
      event.currentTarget.reset();
    } catch {
      setNotification({ message: "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.", tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {notification && (
        <SiteNotification
          message={notification.message}
          tone={notification.tone}
          onDismiss={() => setNotification(null)}
        />
      )}
      <section className="support-fund-form-section" aria-labelledby="support-fund-form-title">
        <h2 id="support-fund-form-title">فرم حمایت</h2>
        <form className="support-fund-form" noValidate onSubmit={handleSubmit}>
          <label htmlFor="support-donor-name">نام <span>(اختیاری)</span></label>
          <input id="support-donor-name" name="donorName" autoComplete="name" />
          <label htmlFor="support-amount">مبلغ حمایت خود را وارد کنید</label>
          <div className="support-fund-amount-field">
            <span aria-hidden="true">$</span>
            <input id="support-amount" name="amount" type="number" inputMode="decimal" min="1" max="1000000" step="0.01" required dir="ltr" />
          </div>
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? "لطفاً صبر کنید" : "ثبت مبلغ حمایت"}</button>
        </form>
      </section>
    </>
  );
}
