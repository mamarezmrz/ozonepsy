import Image from "next/image";
import Link from "next/link";
import { HomeFaq } from "@/components/home-interactive";
import { AboutPreconsultation } from "@/components/about-page";

const asset = (name: string) => `/figma-home/${name}`;

const individualOffers = [
  { title: "یک جلسه مشاوره", price: "49.9", unitPrice: "9.99", oldPrice: "", discount: "", productId: "individual-1" },
  { title: "۳ جلسه مشاوره", price: "104.8", unitPrice: "9.99", oldPrice: "149.9", discount: "۴۰٪ تخفیف", productId: "package-3" },
  { title: "۶ جلسه مشاوره", price: "179.9", unitPrice: "9.99", oldPrice: "247.8", discount: "۴۰٪ تخفیف", productId: "package-6" },
] as const;

const groupOffers = [
  { title: "عنوان جلسه", price: "104.8", unitPrice: "9.99", oldPrice: "", discount: "", productId: "group-therapy" },
  { title: "عنوان جلسه", price: "104.8", unitPrice: "9.99", oldPrice: "", discount: "", productId: "group-therapy" },
  { title: "عنوان جلسه", price: "179.9", unitPrice: "9.99", oldPrice: "247.8", discount: "۴۰٪ تخفیف", productId: "group-therapy" },
] as const;

const courseRows = [
  { image: "image-20.png", title: "دوره‌ی مهارت‌های زندگی", discount: "" },
  { image: "image-21.png", title: "دوره‌ی مهارت‌های زندگی", discount: "۳۰٪ تخفیف" },
  { image: "image-7.png", title: "دوره‌ی مهارت‌های زندگی", discount: "" },
  { image: "image-22.png", title: "دوره‌ی مهارت‌های زندگی", discount: "۳۰٪ تخفیف" },
] as const;

const packageDescription = [
  "امکان برگشت هزینه در صورت عدم رضایت",
  "امکان برگشت هزینه در صورت عدم رضایت",
  "امکان برگشت هزینه در صورت عدم رضایت",
];

export function PricingPage() {
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

          <PricingOfferGroup title="جلسات فردی" offers={individualOffers} />
          <PricingOfferGroup title="گروه درمانی" offers={groupOffers} />

          <section className="pricing-course-group" aria-labelledby="pricing-courses-title">
            <h3 id="pricing-courses-title">دوره‌ها</h3>
            <div className="pricing-course-list">
              {courseRows.map((course, index) => (
                <article className="pricing-course-row" key={`${course.image}-${index}`}>
                  <div className="pricing-course-row-image">
                    <Image src={asset(course.image)} alt={course.title} fill quality={100} sizes="(max-width: 560px) 100vw, 168px" />
                  </div>
                  <div className="pricing-course-row-content">
                    <div className="pricing-course-row-price">
                      <span dir="ltr">$179.9</span> <small>(USD)</small>
                    </div>
                    {course.discount && <span className="pricing-discount">{course.discount}</span>}
                    <h4>{course.title}</h4>
                    <div className="pricing-course-bottom">
                      <div className="pricing-course-row-actions">
                        <Link href="/checkout/life-skills" className="pricing-buy-button">خرید</Link>
                        <Link href="/courses/life-skills-course" className="pricing-details-link">جزئیات دوره</Link>
                      </div>
                      <ul className="pricing-course-points">
                        {packageDescription.map((item, itemIndex) => <li key={`${course.image}-${itemIndex}`}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>

      <section className="pricing-faq home-faq" aria-labelledby="pricing-faq-title">
        <div className="home-faq-inner">
          <h2 id="pricing-faq-title">سوالات متداول قیمت‌گذاری و خرید</h2>
          <HomeFaq />
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
  offers: readonly { title: string; price: string; unitPrice: string; oldPrice: string; discount: string; productId: string }[];
}) {
  return (
    <section className="pricing-offer-group" aria-labelledby={`pricing-${title}`}>
      <h3 id={`pricing-${title}`}>{title}</h3>
      <div className="pricing-offer-grid">
        {offers.map((offer, index) => (
          <article className="pricing-offer-card" key={`${title}-${offer.title}-${index}`}>
            <div className="pricing-offer-price-row">
              <div className="pricing-offer-price-stack">
                <div className="pricing-offer-old-price" dir="ltr">{offer.oldPrice && `$${offer.oldPrice}`}</div>
                <div className="pricing-offer-price" dir="ltr">${offer.price} <small>(USD)</small></div>
                <div className="pricing-offer-unit-price">
                  <span>هزینه هر جلسه</span>
                  <span dir="ltr">${offer.unitPrice} <small>(USD)</small></span>
                </div>
              </div>
              {offer.discount && <span className="pricing-discount">{offer.discount}</span>}
            </div>
            <h4>{offer.title}</h4>
            <ul>
              {packageDescription.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
            </ul>
            <Link href={`/checkout/${offer.productId}`} className="pricing-buy-button">خرید</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
