import Image from "next/image";
import Link from "next/link";
import { HomeFaq } from "@/components/home-interactive";
import { AboutPreconsultation } from "@/components/about-page";
import { ConsultationTestimonials } from "@/components/consultation-testimonials";
import { type ConsultationCategoryContent, consultationCategoryContent } from "@/lib/consultation-categories";
import type { PublicConsultationBenefits } from "@/lib/consultation-benefits";
import type { PublicConsultationCases } from "@/lib/individual-consultation-content";
import type { PublicReview } from "@/lib/reviews";

const asset = (name: string) => `/figma-home/${name}`;

const serviceSteps = [
  ["۱", "درخواست مشاوره رایگان", "برای شروع کافیه توی سایت ثبت نام کنید و درخواست مشاوره خودتون رو ثبت کنید."],
  ["۲", "تعیین زمان جلسه", "بعد از ثبت نام همکاران ما با شما تماس می‌گیرن تا زمان جلسه پیش‌مشاوره رو با شما تنظیم کنن."],
  ["۳", "انتخاب مشاور و نوع جلسه", "بعد از این که همکاران اطلاعات لازم رو بهتون دادن در نهایت شما در صورت تمایل مشاور خودتون رو انتخاب می‌کنین."],
  ["۴", "برگزاری جلسه", "با مشخص شدن مشاور و زمان جلسه، طبق زمان‌بندی مشخص شده جلسه‌تون برگزار می‌شه."],
] as const;

export function ConsultationCategoryPage({ content, reviews = [], reviewProductSlug = null, dynamicBenefits, dynamicCases }: { content: ConsultationCategoryContent; reviews?: readonly PublicReview[]; reviewProductSlug?: string | null; dynamicBenefits?: PublicConsultationBenefits | null; dynamicCases?: PublicConsultationCases | null }) {
  const benefits = dynamicBenefits ?? {
    enabled: true,
    items: content.benefits.map(([title, description], index) => ({ id: `legacy-${index}`, title, description, sortOrder: index })),
  };
  const cases = dynamicCases ?? { enabled: true, title: content.casesTitle, description: content.casesDescription, items: content.cases.map((item, index) => ({ id: `legacy-${index}`, title: item.title, slug: item.href.split("/").pop() ?? "", href: item.href, sortOrder: index })) };

  return (
    <main className={`consultation-page consultation-page-${content.slug}`}>
      <div className="consultation-page-inner">
        <figure className="consultation-hero-image">
          <Image className="consultation-hero-media" src={asset(content.heroImage ?? "76e3e1af9940b43bd5e8f2804cf3de35eec93210.jpg")} alt={content.heroAlt} fill priority quality={100} sizes="(max-width: 900px) 100vw, 960px" />
          <Image className="consultation-hero-logo" src="/ozone-logo.svg" alt="اُزون" width={72} height={72} loading="eager" />
        </figure>

        <section className="consultation-intro" aria-labelledby="consultation-title">
          <h1 id="consultation-title">{content.title}</h1>
          {content.subtitle ? <h2>{content.subtitle}</h2> : null}
          <div className="consultation-copy">{content.introParagraphs.map((paragraph, index) => <p key={`intro-${index}`}>{paragraph}</p>)}</div>
        </section>

        <section className="consultation-more" aria-labelledby="consultation-more-title">
          <h2 id="consultation-more-title">{content.moreTitle}</h2>
          <div className="consultation-copy">{content.moreParagraphs.map((paragraph, index) => <p key={`more-${index}`}>{paragraph}</p>)}</div>
        </section>

        {benefits.enabled && benefits.items.length > 0 ? (
          <section className="consultation-benefits" aria-labelledby="consultation-benefits-title">
            <h2 id="consultation-benefits-title">{content.benefitsTitle}</h2>
            <div className="consultation-benefit-grid">{benefits.items.map(({ id, title, description }) => <article key={id} className="consultation-benefit-card"><div className="consultation-benefit-head"><span className="consultation-check" aria-hidden="true"><CheckIcon /></span><h3>{title}</h3></div><p>{description}</p></article>)}</div>
          </section>
        ) : null}

        {cases.enabled && cases.items.length > 0 ? (
          <section className="consultation-cases" aria-labelledby="consultation-cases-title">
            <h2 id="consultation-cases-title">{cases.title}</h2>
            <p>{cases.description}</p>
            <div className="consultation-case-grid">{cases.items.map(({ id, title, href }) => <Link key={id} href={href} className="consultation-case-card"><span>{title}</span><span className="consultation-case-arrow" aria-hidden="true" /></Link>)}</div>
          </section>
        ) : null}
      </div>

      <section className="consultation-steps home-service-steps" aria-labelledby="consultation-steps-title">
        <div className="home-service-steps-inner">
          <div className="home-service-steps-head"><h2 id="consultation-steps-title">مراحل دریافت خدمات</h2></div>
          <div className="home-service-steps-list">{serviceSteps.map(([number, title, description]) => <article key={number} className="home-service-step"><div className="home-service-step-marker">{number}</div><h3>{title}</h3><p>{description}</p></article>)}</div>
          <Link href="/free-session" className="home-service-steps-link">پیش مشاوره رایگان</Link>
        </div>
      </section>

      <ConsultationTestimonials productSlug={reviewProductSlug} reviews={reviews} />

      <section className="consultation-faq home-faq" aria-labelledby="consultation-faq-title">
        <div className="home-faq-inner"><h2 id="consultation-faq-title">{content.faqTitle}</h2><HomeFaq items={content.faqItems} /></div>
      </section>

      <AboutPreconsultation />
    </main>
  );
}

export function IndividualConsultationPage() {
  return <ConsultationCategoryPage content={consultationCategoryContent.individual} reviewProductSlug="individual-consultation" />;
}

function CheckIcon() {
  return <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25.6668 12.9267V14C25.6654 16.5158 24.8507 18.9638 23.3444 20.9788C21.838 22.9938 19.7207 24.4679 17.3081 25.1812C14.8955 25.8945 12.317 25.8089 9.95704 24.937C7.59712 24.0652 5.58226 22.4538 4.21295 20.3433C2.84364 18.2327 2.19325 15.7361 2.35879 13.2257C2.52432 10.7153 3.4969 8.32572 5.13149 6.41326C6.76607 4.50079 8.97508 3.16795 11.429 2.61351C13.883 2.05907 16.4505 2.31273 18.7485 3.33667" stroke="#0F8B8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M25.6667 4.66675L14 16.3451L10.5 12.8451" stroke="#0F8B8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
