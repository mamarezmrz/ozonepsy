"use client";

import Image from "next/image";
import Link from "next/link";
import { AboutPreconsultation } from "@/components/about-page";
import { HomeFaq } from "@/components/home-interactive";
import type { PublicContent } from "@/lib/public/content";
import type { PublicGroupTherapyPage } from "@/lib/public/catalog-types";

const fallbackImage = "/figma-home/image-20.png";

export function GroupTherapyDetailPage({ product, content }: { product: PublicGroupTherapyPage; content?: PublicContent }) {
  const price = new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(product.priceMinor / 100);

  return (
    <main className="group-detail-page">
      <div className="group-detail-inner">
        <Link href="/group-therapy" className="group-detail-back focus-ring" aria-label="بازگشت به گروه درمانی">
          <span className="group-detail-back-chevron" aria-hidden="true" />
        </Link>

        <section className="group-detail-hero" aria-labelledby="group-detail-title">
          <div className="group-detail-copy">
            <h1 id="group-detail-title">{product.title}</h1>
            <p>{product.description}</p>
            <div className="group-detail-purchase">
              <span className="group-detail-price"><b>{price}</b><small>({product.currency})</small></span>
              <Link href={`/checkout/${product.id}`} className="group-detail-buy">خرید جلسه</Link>
            </div>
          </div>
          <figure className="group-detail-image">
            <Image src={product.coverUrl ?? fallbackImage} alt={product.title} fill priority sizes="(max-width: 900px) 100vw, 320px" />
          </figure>
        </section>

        <div className="group-detail-divider" />

        <section className="group-detail-content" aria-labelledby="group-detail-specs-title">
          <div className="group-detail-section">
            <h2 id="group-detail-specs-title">مشخصات</h2>
            {product.cohortLabel ? <p><strong>گروه:</strong> {product.cohortLabel}</p> : null}
            {product.capacity !== null ? <p><strong>ظرفیت:</strong> {product.capacity} نفر</p> : null}
            {!product.cohortLabel && product.capacity === null ? <p>مشخصات تکمیلی این محصول هنوز ثبت نشده است.</p> : null}
          </div>

          <div className="group-detail-section">
            <h2>توضیحات</h2>
            <p>{product.description}</p>
          </div>

          <div className="group-detail-section group-detail-sessions" aria-labelledby="group-detail-sessions-title">
            <h2 id="group-detail-sessions-title">برنامه و زمان‌بندی</h2>
            <p>{product.schedulePolicy?.trim() || "برنامه‌ی این گروه پس از ثبت درخواست و هماهنگی با تیم اُزون اعلام می‌شود."}</p>
          </div>
        </section>
      </div>

      <section className="group-detail-steps home-service-steps" aria-labelledby="group-detail-steps-title">
        <div className="home-service-steps-inner">
          <div className="home-service-steps-head"><h2 id="group-detail-steps-title">مراحل دریافت خدمات</h2></div>
          <div className="home-service-steps-list">
            {[
              ["۱", "درخواست مشاوره رایگان", "برای شروع کافیه توی سایت ثبت نام کنید و درخواست مشاوره خودتون رو ثبت کنید."],
              ["۲", "تعیین زمان جلسه", "بعد از ثبت نام همکاران با شما تماس می‌گیرن تا زمان جلسه پیش‌مشاوره رو با شما تنظیم کنن."],
              ["۳", "انتخاب مشاور و نوع جلسات", "بعد از این که همکاران اطلاعات لازم رو بهتون دادن در نهایت شما در صورت تمایل مشاور خودتون رو انتخاب می‌کنین."],
              ["۴", "برگزاری جلسات", "با مشخص شدن مشاور و زمان جلسه، طبق زمان‌بندی مشخص شده جلسه‌تون برگزار می‌شه."],
            ].map(([number, title, description]) => (
              <article key={number} className="home-service-step"><div className="home-service-step-marker">{number}</div><h3>{title}</h3><p>{description}</p></article>
            ))}
          </div>
          <Link href="/free-session" className="home-service-steps-link">پیش مشاوره رایگان</Link>
        </div>
      </section>

      <section className="group-detail-faq home-faq" aria-labelledby="group-detail-faq-title">
        <div className="home-faq-inner"><h2 id="group-detail-faq-title">سوالات متداول گروه درمانی</h2><HomeFaq items={content?.faqs} /></div>
      </section>

      <AboutPreconsultation />
    </main>
  );
}
