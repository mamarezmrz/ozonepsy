import Image from "next/image";
import Link from "next/link";
import { AboutPreconsultation } from "@/components/about-page";
import { ConsultationTestimonials } from "@/components/consultation-testimonials";
import { HomeFaq } from "@/components/home-interactive";
import { groupTherapySessions } from "@/lib/group-therapy";
import type { PublicConsultationBenefits } from "@/lib/consultation-benefits";
import type { PublicConsultationCases } from "@/lib/individual-consultation-content";
import type { PublicReview } from "@/lib/reviews";

const asset = (name: string) => `/figma-home/${name}`;

const groupIntro = [
  `فشاری که اتم اکسیژن در آن شکل می‌گیرد، او را ناآرام و پرانرژی می‌سازد.
برای آرام کردن این آشوب، طبیعت راه‌های گوناگونی دارد: پیوند مونوکسید، دی‌اکسید، و به طور اساسی تراکسیدها.`,
  `اما یک راز بزرگ‌تر هم هست:
وقتی سه اتم اکسیژن در پیوندهای پی‌درپی و زنجیره‌ای کنار هم قرار می‌گیرند، چیزی تازه شکل می‌گیرد؛ «مولکول اُزون».
این مولکول حاصل یک برهم‌کنش دائمی و جمعی است؛ جایی که فشارها پخش می‌شوند و پایداری تازه‌ای پدید می‌آید.`,
  `ما انسان‌ها هم زیر فشارهای زندگی، همین نیاز را داریم.
گاهی تنها یک پیوند کافی نیست؛ ما به جمعی امن احتیاج داریم، جایی که چندین نفر با هم در تعامل و حمایت مداوم قرار بگیرند.
جلسه گروه‌درمانی درست مثل مولکول اُزون است:
چند نفر کنار هم، با حضور روانشناس خبره، پیوندی امن می‌سازند که فراتر از جمع تک‌تک‌شان است. همان‌طور که اُزون از کنار هم بودن سه اتم ناپایدار به پایداری می‌رسد، ما هم در گروه‌درمانی از جمع و پیوند امن با دیگران آرامش و استقامت تازه‌ای پیدا می‌کنیم.`,
] as const;

const groupBenefits = [
  ["تنها نیستی", "می‌فهمی دیگران هم احساساتی مثل تو درگیرن، حتی اونایی که فکر می‌کنی فقط مال تو هستن."],
  ["آینه‌ی انسانی", "با شنیدن تجربه‌ی دیگران، خودت را واضح‌تر می‌بینی."],
  ["تمرین ارتباط سالم", "یاد می‌گیری احساساتت را بدون اینکه دفاعی یا خجالت‌زده شوی، بیان کنی."],
  ["افزایش امید برای تغییر", "حس همراهی گروه، انگیزه‌ات را بیشتر می‌کند که در مسیر بمانی."],
  ["تنظیم احساسات", "یاد می‌گیری چطور خشم، غم، یا ترس را بشناسی و مدیریت کنی."],
  ["رشد اجتماعی", "اعتماد به‌نفست در جمع بالا می‌رود و مهارت ارتباطت قوی‌تر می‌شود."],
] as const;

const groupTherapyMeaning = [
  `تا حالا برایت پیش آمده وسط جمع لبخند بزنی، اما از درون خسته باشی؟
یا حرفی را هزار بار توی ذهنت مرور کنی، اما نتوانی جایی بازگویی کنی؟
یا اینکه انگار همه چیز سر جایش است، ولی چیزی سر جایش نیست؟
اینجا همان نقطه‌ای است که اُزون معنا پیدا می‌کند.`,
  `اُزون فقط برای روزهای سخت نیست؛ برای رشد کردن کنار دیگران است. در گروه‌درمانی، وقتی می‌بینی آدم‌های مختلف هم درگیر دغدغه‌هایی شبیه تو هستند؛ از تعارض در رابطه گرفته تا اعتماد، خشم یا مرزهای شخصی، شروع می‌کنی «خود» را از بیرون دیدن، و همین نقطه‌ی تغییر است.
در اُزون، تراپیست مثل رهبر یک گروه موسیقی است؛ صداها را هماهنگ می‌کند، مراقب ریتم جمع است و اجازه می‌دهد هرکس نت خودش را بنوازد؛ تا از دل این هم‌نوازی، معنا و آرامش تازه‌ای پیدا می‌کنیم.
گاهی پاسخ، نه در خلوت خودت، بلکه در آینه‌ی جمع پیدا می‌شود.
شاید اُزون همان حلقه‌ی گمشده‌ی درمان تو باشد.`,
] as const;

const serviceSteps = [
  ["۱", "درخواست مشاوره رایگان", "برای شروع کافیه توی سایت ثبت نام کنید و درخواست مشاوره خودتون رو ثبت کنید."],
  ["۲", "تعیین زمان جلسه", "بعد از ثبت نام همکاران با شما تماس می‌گیرن تا زمان جلسه پیش‌مشاوره رو با شما تنظیم کنن."],
  ["۳", "انتخاب مشاور و نوع جلسات", "بعد از این که همکاران اطلاعات لازم رو بهتون دادن در نهایت شما در صورت تمایل مشاور خودتون رو انتخاب می‌کنین."],
  ["۴", "برگزاری جلسات", "با مشخص شدن مشاور و زمان جلسه، طبق زمان‌بندی مشخص شده جلسه‌تون برگزار می‌شه."],
] as const;

const groupFaqItems = [
  { question: "گروه‌درمانی دقیقاً چیه و چه فرقی با مشاوره فردی داره؟", answer: "پاسخ سوال" },
  { question: "چه چیزی باعث میشه گروه‌درمانی اثربخشی‌اش از جلسات فردی بیشتر باشه؟", answer: "پاسخ سوال" },
  { question: "اولین جلسه گروه‌درمانی چطور پیش میره؟", answer: "پاسخ سوال" },
  { question: "من می‌تونم فقط شنونده باشم یا لازمه حتماً حرف بزنم؟", answer: "پاسخ سوال" },
  { question: "میشه از هر جای دنیا به گروه‌درمانی آنلاین وصل شد؟", answer: "پاسخ سوال" },
  { question: "آیا گروه‌درمانی جایگزین مشاوره فردی میشه یا بهتره همزمان انجام بشه؟", answer: "پاسخ سوال" },
] as const;

export function GroupTherapyPage({ reviews = [], dynamicBenefits, dynamicCases }: { reviews?: readonly PublicReview[]; dynamicBenefits?: PublicConsultationBenefits | null; dynamicCases?: PublicConsultationCases | null }) {
  const benefits = dynamicBenefits ?? {
    enabled: true,
    items: groupBenefits.map(([title, description], index) => ({ id: `legacy-${index}`, title, description, sortOrder: index })),
  };
  const cases = dynamicCases ?? { enabled: false, title: "گروه درمانی برای چه موضوعاتی مناسب است؟", description: "", items: [] };

  return (
    <main className="group-therapy-page">
      <div className="group-therapy-page-inner">
        <figure className="courses-hero-image group-therapy-hero-image">
          <Image className="courses-hero-media" src={asset("image-7.png")} alt="جلسه گروه‌درمانی آنلاین" fill priority quality={100} sizes="(max-width: 900px) 100vw, 960px" />
          <Image className="courses-hero-logo" src="/ozone-logo.svg" alt="اُزون" width={72} height={72} loading="eager" />
        </figure>

        <section className="group-therapy-intro" aria-labelledby="group-therapy-title">
          <h1 id="group-therapy-title">اُزون - گروه درمانی</h1>
          <h2>چرا نام گروه‌درمانی ما «اُزون» است؟</h2>
          <div className="group-therapy-copy">
            {groupIntro.map((paragraph, index) => <p key={`group-intro-${index}`}>{paragraph}</p>)}
          </div>
        </section>

        <div className="group-therapy-atom" aria-hidden="true">
          <Image src="/icons/group-therapy-atom.svg" alt="" width={360} height={66} />
        </div>

        <section className="group-therapy-meaning" aria-labelledby="group-therapy-meaning-title">
          <h2 id="group-therapy-meaning-title">آیا اُزون همان حلقه‌ی گمشده‌ی درمان توست؟</h2>
          <div className="group-therapy-meaning-copy">
            {groupTherapyMeaning.map((paragraph, index) => <p key={`group-meaning-${index}`}>{paragraph}</p>)}
          </div>
        </section>

        {benefits.enabled && benefits.items.length > 0 ? (
          <section className="group-therapy-benefits" aria-labelledby="group-therapy-benefits-title">
            <h2 id="group-therapy-benefits-title">مزایای جلسات گروه درمانی</h2>
            <div className="group-therapy-benefit-grid">
              {benefits.items.map(({ id, title, description }) => (
                <article key={id} className="group-therapy-benefit-card">
                  <div className="group-therapy-benefit-head"><span className="group-therapy-benefit-check" aria-hidden="true"><CheckIcon /></span><h3>{title}</h3></div>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {cases.enabled && cases.items.length > 0 ? (
          <section className="consultation-cases group-therapy-cases" aria-labelledby="group-therapy-cases-title">
            <h2 id="group-therapy-cases-title">{cases.title}</h2>
            {cases.description ? <p>{cases.description}</p> : null}
            <div className="consultation-case-grid">{cases.items.map(({ id, title, href }) => <Link key={id} href={href} className="consultation-case-card"><span>{title}</span><span className="consultation-case-arrow" aria-hidden="true" /></Link>)}</div>
          </section>
        ) : null}

        <section className="group-therapy-sessions" aria-labelledby="group-therapy-sessions-title">
          <h2 id="group-therapy-sessions-title">انواع جلسات گروه درمانی</h2>
          <p>مشاوره فردی به هر آن چیزی که برای توسعه فردی، درمان اختلالات روانی و ارتقاء سلامت روان نیاز است، می‌پردازد. این مشاوره به صورت محرمانه بین شما و تراپیست مورد نظر انجام می‌شود.</p>
          <div className="group-therapy-session-grid">
            {groupTherapySessions.map((session) => (
              <article key={session.slug} className="group-therapy-session-card">
                <div className="group-therapy-session-image">
                  <Image src={asset(session.image)} alt={session.title} fill quality={100} sizes="(max-width: 560px) 100vw, 280px" />
                </div>
                <div className="group-therapy-session-card-body">
                  <h3>{session.title}</h3>
                  <p>{session.description}</p>
                  <Link href={`/group-therapy/${session.slug}`} className="group-therapy-session-link">مشاهده جزئیات<span aria-hidden="true" /></Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="group-therapy-steps home-service-steps" aria-labelledby="group-therapy-steps-title">
        <div className="home-service-steps-inner">
          <div className="home-service-steps-head"><h2 id="group-therapy-steps-title">مراحل دریافت خدمات</h2></div>
          <div className="home-service-steps-list">
            {serviceSteps.map(([number, title, description]) => <article key={number} className="home-service-step"><div className="home-service-step-marker">{number}</div><h3>{title}</h3><p>{description}</p></article>)}
          </div>
          <Link href="/free-session" className="home-service-steps-link">پیش مشاوره رایگان</Link>
        </div>
      </section>

      <ConsultationTestimonials productSlug="group-therapy" reviews={reviews} />

      <section className="group-therapy-faq home-faq" aria-labelledby="group-therapy-faq-title">
        <div className="home-faq-inner"><h2 id="group-therapy-faq-title">سوالات متداول گروه درمانی</h2><HomeFaq items={groupFaqItems} /></div>
      </section>

      <AboutPreconsultation />
    </main>
  );
}

function CheckIcon() {
  return <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25.6668 12.9267V14C25.6654 16.5158 24.8507 18.9638 23.3444 20.9788C21.838 22.9938 19.7207 24.4679 17.3081 25.1812C14.8955 25.8945 12.317 25.8089 9.95704 24.937C7.59712 24.0652 5.58226 22.4538 4.21295 20.3433C2.84364 18.2327 2.19325 15.7361 2.35879 13.2257C2.52432 10.7153 3.4969 8.32572 5.13149 6.41326C6.76607 4.50079 8.97508 3.16795 11.429 2.61351C13.883 2.05907 16.4505 2.31273 18.7485 3.33667" stroke="#0F8B8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M25.6667 4.66675L14 16.3451L10.5 12.8451" stroke="#0F8B8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
