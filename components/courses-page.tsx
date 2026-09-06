import Image from "next/image";
import Link from "next/link";
import { HomeFaq, HomeTestimonials } from "@/components/home-interactive";
import { AboutPreconsultation } from "@/components/about-page";
import type { PublicContent } from "@/lib/public/content";
import type { PublicPurchaseProduct } from "@/lib/public/catalog-types";

const asset = (name: string) => `/figma-home/${name}`;

const courseIntro = "مشاوره فردی به هر آن چیزی که برای توسعه فردی، درمان اختلالات روانی و ارتقاء سلامت روان نیاز است، می‌پردازد. این مشاوره به صورت محرمانه بین شما و تراپیست مورد نظر انجام می‌شود و اولین گام برای قرار گرفتن در مسیر درست انتخاب مشاوره‌های تخصصی طبق مساله شماست.";
const courseIntroFollowUp = "ما در سیمیاروم شما را راهنمایی می‌کنیم تا بهترین مشاور را برای خود انتخاب کنید و همچنین از مشکلات احتمالی به وجود آمده در سلامت روان و پیشرفت فردی خود آگاهی بیشتری داشته باشید.";
const courseMore = "مشاوره فردی به هر آن چیزی که برای توسعه فردی، درمان اختلالات روانی و ارتقاء سلامت روان نیاز است، می‌پردازد. این مشاوره به صورت محرمانه بین شما و تراپیست مورد نظر انجام می‌شود و اولین گام برای قرار گرفتن در مسیر درست انتخاب مشاوره‌های تخصصی طبق مساله شماست.";

function CourseBenefit({ title, description }: { title: string; description: string }) {
  return (
    <article className="courses-benefit-card">
      <span className="courses-benefit-check" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M25.6668 12.9267V14C25.6654 16.5158 24.8507 18.9638 23.3444 20.9788C21.838 22.9938 19.7207 24.4679 17.3081 25.1812C14.8955 25.8945 12.317 25.8089 9.95704 24.937C7.59712 24.0652 5.58226 22.4538 4.21295 20.3433C2.84364 18.2327 2.19325 15.7361 2.35879 13.2257C2.52432 10.7153 3.4969 8.32572 5.13149 6.41326C6.76607 4.50079 8.97508 3.16795 11.429 2.61351C13.883 2.05907 16.4505 2.31273 18.7485 3.33667" stroke="#0F8B8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M25.6667 4.66675L14 16.3451L10.5 12.8451" stroke="#0F8B8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}

export function PsychologyCourseCatalog({ title = "دوره‌های اُزون", products }: { title?: string; products: readonly PublicPurchaseProduct[] }) {
  return (
    <section className="courses-catalog" aria-labelledby="courses-catalog-title">
      <div className="courses-catalog-inner">
        <h2 id="courses-catalog-title">{title}</h2>
        <div className="home-course-list">
          {products.length ? products.map((product, index) => (
            <article key={product.id} className="home-course-card">
              <div className="home-course-info">
                <div>
                  <h3>{product.title}</h3>
                  <div className="home-course-tags"><span className="home-course-tag">گروه درمانی</span><span className="home-course-tag">مشاوره فردی</span></div>
                  <p className="mt-4 text-sm leading-7 text-[#676b6b]">{product.description}</p>
                </div>
                <div className="home-course-footer">
                  <div className="home-course-actions"><Link href={`/checkout/${product.id}`} className="home-course-action home-course-action-primary">خرید</Link><Link href={`/courses/${product.slug}`} className="home-course-action home-course-action-secondary">جزئیات دوره</Link></div>
                  <span className="home-course-price"><span className="home-course-currency-symbol">$</span>{(product.priceMinor / 100).toFixed(2)} <small className="text-xs font-normal">({product.currency})</small></span>
                </div>
              </div>
              <div className="home-course-image"><Image src={asset(`image-${20 + (index % 3)}.png`)} alt={product.title} fill quality={100} sizes="(max-width: 560px) 304px, 160px" /></div>
            </article>
          )) : <p className="courses-empty-state">در حال حاضر دوره‌ی منتشرشده‌ای برای نمایش وجود ندارد.</p>}
        </div>
      </div>
    </section>
  );
}

export function CoursesPage({ content, products = [] }: { content?: PublicContent; products?: readonly PublicPurchaseProduct[] }) {
  return (
    <main className="courses-page">
      <div className="courses-page-inner">
        <figure className="courses-hero-image">
          <Image className="courses-hero-media" src={asset("image-7.png")} alt="جلسه گروهی روانشناسی" fill priority quality={100} sizes="(max-width: 900px) 100vw, 960px" />
          <Image className="courses-hero-logo" src="/ozone-logo.svg" alt="اُزون" width={72} height={72} loading="eager" />
        </figure>

        <section className="courses-intro" aria-labelledby="courses-title">
          <h1 id="courses-title">دوره‌های روانشناسی</h1>
          <div className="courses-copy">
            <p>{courseIntro}</p>
            <p>{courseIntroFollowUp}</p>
            <p>{courseIntro}</p>
            <p>{courseIntroFollowUp}</p>
          </div>
        </section>

        <section className="courses-more" aria-labelledby="courses-more-title">
          <h2 id="courses-more-title">توضیحات بیشتر</h2>
          <div className="courses-copy">
            <p>{courseMore}</p>
            <p>{courseMore}</p>
            <p>{courseMore}</p>
          </div>
        </section>

        <section className="courses-benefits" aria-labelledby="courses-benefits-title">
          <h2 id="courses-benefits-title">مزایای دوره‌های روانشناسی</h2>
          <div className="courses-benefit-grid">
            <CourseBenefit title="خودآموز و تمرین‌محور" description="با تمرین‌های کاربردی، آموخته‌ها را در زندگی روزمره به کار می‌گیرید." />
            <CourseBenefit title="رابطه‌محور و کاربردی" description="محتوای دوره برای ساختن رابطه‌های سالم و تصمیم‌های آگاهانه طراحی شده است." />
          </div>
        </section>
      </div>

      <PsychologyCourseCatalog products={products} />

      <section className="courses-testimonials home-testimonials" aria-labelledby="courses-testimonials-title">
        <div className="home-testimonial-heading"><h2 id="courses-testimonials-title">نظرات شما</h2><p>تجربه همراهان اُزون از مسیر مشاوره و گفت‌وگو.</p></div>
        <HomeTestimonials items={content?.testimonials} />
      </section>

      <section className="courses-faq home-faq" aria-labelledby="courses-faq-title">
        <div className="home-faq-inner">
          <h2 id="courses-faq-title">سوالات متداول دوره‌ها</h2>
          <HomeFaq items={content?.faqs} />
        </div>
      </section>

      <AboutPreconsultation />
    </main>
  );
}
