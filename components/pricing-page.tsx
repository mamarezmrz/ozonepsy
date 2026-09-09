import Image from "next/image";
import Link from "next/link";
import { HomeFaq } from "@/components/home-interactive";
import { AboutPreconsultation } from "@/components/about-page";
import { CourseDescription } from "@/components/course-description";
import type { PublicContent } from "@/lib/public/content";
import type { PublicPurchaseProduct } from "@/lib/public/catalog-types";

const asset = (name: string) => `/figma-home/${name}`;

export function PricingPage({ content, products = [] }: { content?: PublicContent; products?: readonly PublicPurchaseProduct[] }) {
  const individualProducts = products.filter((product) => product.kind === "consultation" || product.kind === "package");
  const groupProducts = products.filter((product) => product.kind === "group");
  const courseProducts = products.filter((product) => product.kind === "course");
  return (
    <main className="pricing-page">
      <div className="pricing-page-inner">
        <header className="pricing-heading">
          <h1>قیمت‌گذاری و خرید</h1>
          <p>برای پرداخت هزینه‌ی جلسات شما می‌توانید به اختیار خود یکی از پکیج‌های موجود را خریداری کنید.</p>
        </header>

        <PricingFreeSessionCard />

        <section className="pricing-products" aria-labelledby="pricing-products-title">
          <h2 id="pricing-products-title">همه‌ی پکیج‌ها</h2>
          <p>تعداد جلسات خریداری شده در پروفایل کاربری شما ثبت شده و برای جلسات بعدی قابل استفاده خواهد بود.</p>

          <PricingOfferGroup title="جلسات فردی" offers={individualProducts} />
          <PricingOfferGroup title="گروه درمانی" offers={groupProducts} />

          <section className="pricing-course-group" aria-labelledby="pricing-courses-title">
            <h3 id="pricing-courses-title">دوره‌ها</h3>
            <div className="pricing-course-list">
              {courseProducts.length ? courseProducts.map((course, index) => (
                <article className="pricing-course-row" key={course.id}>
                  <div className="pricing-course-row-image">
                    <Image src={asset(`image-${20 + (index % 3)}.png`)} alt={course.title} fill quality={100} sizes="(max-width: 560px) 100vw, 168px" />
                  </div>
                  <div className="pricing-course-row-content">
                    <div className="pricing-course-row-heading">
                      <h4>{course.title}</h4>
                      <div className="pricing-course-row-price">
                        <span dir="ltr">${(course.priceMinor / 100).toFixed(2)}</span> <small>({course.currency})</small>
                      </div>
                    </div>
                    <div className="pricing-course-bottom">
                      <CourseDescription description={course.description} clamp className="pricing-course-points" />
                      <div className="pricing-course-row-actions">
                        <Link href={`/checkout/${course.id}`} className="pricing-buy-button">خرید</Link>
                        <Link href={`/courses/${course.slug}`} className="pricing-details-link">جزئیات دوره</Link>
                      </div>
                    </div>
                  </div>
                </article>
              )) : <p className="pricing-empty-state">دوره‌ی منتشرشده‌ای برای نمایش وجود ندارد.</p>}
            </div>
          </section>
        </section>
      </div>

      <section className="pricing-faq home-faq" aria-labelledby="pricing-faq-title">
        <div className="home-faq-inner">
          <h2 id="pricing-faq-title">سوالات متداول قیمت‌گذاری و خرید</h2>
          <HomeFaq items={content?.faqs} />
        </div>
      </section>

      <AboutPreconsultation />
    </main>
  );
}

function PricingFreeSessionCard() {
  return (
    <article className="pricing-free-session-card">
      <div className="pricing-free-session-image">
        <Image
          src={asset("5dac2277462f6b310726942ed419287d1a9f89c3.png")}
          alt="مشاور پیش‌مشاوره رایگان"
          fill
          sizes="(max-width: 560px) 100vw, 200px"
          quality={100}
        />
      </div>
      <div className="pricing-free-session-content">
        <div className="pricing-free-session-price" dir="ltr">$0.0 <small>(USD)</small></div>
        <h2>جلسه پیش مشاوره رایگان</h2>
        <p>قبل از انتخاب پکیج، می‌توانید در یک گفت‌وگوی کوتاه با همکاران ما درباره مسیر مناسب خود صحبت کنید.</p>
        <Link href="/free-session" className="pricing-free-session-button">پیش مشاوره رایگان</Link>
      </div>
    </article>
  );
}

function PricingOfferGroup({
  title,
  offers,
}: {
  title: string;
  offers: readonly PublicPurchaseProduct[];
}) {
  return (
    <section className="pricing-offer-group" aria-labelledby={`pricing-${title}`}>
      <h3 id={`pricing-${title}`}>{title}</h3>
      <div className="pricing-offer-grid">
          {offers.length ? offers.map((offer) => (
          <article className="pricing-offer-card" key={`${title}-${offer.id}`}>
            <div className="pricing-offer-price-row">
              <div className="pricing-offer-price-stack">
                <div className="pricing-offer-old-price" dir="ltr" />
                <div className="pricing-offer-price" dir="ltr">${(offer.priceMinor / 100).toFixed(2)} <small>({offer.currency})</small></div>
                <div className="pricing-offer-unit-price">
                  <span>هزینه هر جلسه</span>
                  <span dir="ltr">{offer.sessions ? `$${(offer.priceMinor / offer.sessions / 100).toFixed(2)}` : "—"} <small>{offer.sessions ? `(${offer.currency})` : ""}</small></span>
                </div>
              </div>
            </div>
            <h4>{offer.title}</h4>
            <p className="pricing-offer-description">{offer.description}</p>
            <Link href={`/checkout/${offer.id}`} className="pricing-buy-button">خرید</Link>
          </article>
        )) : <p className="pricing-empty-state">محصول منتشرشده‌ای برای نمایش وجود ندارد.</p>}
      </div>
    </section>
  );
}
