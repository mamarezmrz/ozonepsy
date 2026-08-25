import Image from "next/image";
import Link from "next/link";
import { AboutPreconsultation } from "@/components/about-page";
import { ConsultationTestimonials } from "@/components/consultation-testimonials";
import { HomeFaq } from "@/components/home-interactive";
import { groupTherapySessions } from "@/lib/group-therapy";

const asset = (name: string) => `/figma-home/${name}`;

const groupIntro = [
  "فشاری که اتم اکسیژن در آن شکل می‌گیرد، او را ناآرام و پرانرژی می‌سازد. برای آرام کردن این آشوب، طبیعت راه‌های گوناگونی دارد: پیوند مونواکسید، دی‌اکسید و به‌طور اساسی‌تر اکسیدها.",
  "اما یک راز بزرگ‌تر هم هست: وقتی سه اتم اکسیژن در پیوندهای پی‌درپی و زنجیره‌ای کنار هم قرار می‌گیرند، چیزی تازه شکل می‌گیرد؛ «مولکول اُزون». این مولکول حاصل یک برهم‌کنش دائمی و جمعی است؛ جایی که فشارها پخش می‌شوند و پایداری تازه‌ای پدید می‌آید.",
  "ما انسان‌ها هم زیر فشارهای زندگی، همین نیاز را داریم. گاهی تنها یک پیوند کافی نیست؛ ما به جمعی امن احتیاج داریم، جایی که چندین نفر با هم در تعامل و حمایت مداوم قرار بگیرند.",
  "جلسه گروه‌درمانی درست مثل مولکول اُزون است؛ چند نفر کنار هم، با حضور روانشناس خبره، پیوندی امن می‌سازند که فراتر از جمع تک‌تک‌شان است. همان‌طور که اُزون از کنار هم بودن سه اتم ناپایدار به پایداری می‌رسد، ما هم در گروه‌درمانی از جمع و پیوند امن با دیگران آرامش و استقامت تازه‌ای پیدا می‌کنیم.",
] as const;

const groupBenefits = [
  ["راه‌های واقعی یاد می‌گیری", "از تجربه‌های گروه و مسیرهای مختلف، راه‌های عملی و واقعی برای روبه‌رو شدن با چالش‌ها پیدا می‌کنی."],
  ["خودت را بهتر می‌شناسی", "با شنیدن تجربه‌های دیگران، خودت را واضح‌تر می‌بینی و احساساتت را بهتر می‌شناسی."],
  ["امیدت به تغییر بیشتر می‌شود", "حس همراهی گروه، انگیزه‌ات را بیشتر می‌کند تا در مسیر رشد و تغییر بمانی."],
] as const;

const serviceSteps = [
  ["۱", "درخواست مشاوره رایگان", "برای شروع کافیه توی سایت ثبت نام کنید و درخواست مشاوره خودتون رو ثبت کنید."],
  ["۲", "تعیین زمان جلسه", "بعد از ثبت نام همکاران با شما تماس می‌گیرن تا زمان جلسه پیش‌مشاوره رو با شما تنظیم کنن."],
  ["۳", "انتخاب مشاور و نوع جلسات", "بعد از این که همکاران اطلاعات لازم رو بهتون دادن در نهایت شما در صورت تمایل مشاور خودتون رو انتخاب می‌کنین."],
  ["۴", "برگزاری جلسات", "با مشخص شدن مشاور و زمان جلسه، طبق زمان‌بندی مشخص شده جلسه‌تون برگزار می‌شه."],
] as const;

export function GroupTherapyPage() {
  return (
    <main className="group-therapy-page">
      <div className="group-therapy-page-inner">
        <figure className="courses-hero-image group-therapy-hero-image">
          <Image className="courses-hero-media" src={asset("image-7.png")} alt="جلسه گروه‌درمانی آنلاین" fill priority quality={100} sizes="(max-width: 900px) 100vw, 960px" />
          <Image className="courses-hero-logo" src="/ozone-logo.svg" alt="اُزون" width={72} height={72} />
        </figure>

        <section className="group-therapy-intro" aria-labelledby="group-therapy-title">
          <h1 id="group-therapy-title">گروه درمانی</h1>
          <div className="group-therapy-copy">
            {groupIntro.map((paragraph, index) => <p key={`group-intro-${index}`}>{paragraph}</p>)}
          </div>
        </section>

        <div className="group-therapy-atom" aria-hidden="true">
          <Image src="/icons/group-therapy-atom.svg" alt="" width={360} height={66} />
        </div>

        <section className="group-therapy-benefits" aria-labelledby="group-therapy-benefits-title">
          <h2 id="group-therapy-benefits-title">مزایای جلسات گروه درمانی</h2>
          <div className="group-therapy-benefit-grid">
            {groupBenefits.map(([title, description], index) => (
              <article key={`group-benefit-${index}`} className={`group-therapy-benefit-card${index === 2 ? " is-wide" : ""}`}>
                <span className="group-therapy-benefit-check" aria-hidden="true"><CheckIcon /></span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="group-therapy-sessions" aria-labelledby="group-therapy-sessions-title">
          <h2 id="group-therapy-sessions-title">انواع جلسات گروه درمانی</h2>
          <p>جلسات گروه‌درمانی برای موضوعات مختلف طراحی شده‌اند و در فضایی امن و همراه با دیگران برگزار می‌شوند.</p>
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

      <ConsultationTestimonials />

      <section className="group-therapy-faq home-faq" aria-labelledby="group-therapy-faq-title">
        <div className="home-faq-inner"><h2 id="group-therapy-faq-title">سوالات متداول گروه درمانی</h2><HomeFaq /></div>
      </section>

      <AboutPreconsultation />
    </main>
  );
}

function CheckIcon() {
  return <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25.6668 12.9267V14C25.6654 16.5158 24.8507 18.9638 23.3444 20.9788C21.838 22.9938 19.7207 24.4679 17.3081 25.1812C14.8955 25.8945 12.317 25.8089 9.95704 24.937C7.59712 24.0652 5.58226 22.4538 4.21295 20.3433C2.84364 18.2327 2.19325 15.7361 2.35879 13.2257C2.52432 10.7153 3.4969 8.32572 5.13149 6.41326C6.76607 4.50079 8.97508 3.16795 11.429 2.61351C13.883 2.05907 16.4505 2.31273 18.7485 3.33667" stroke="#0F8B8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M25.6667 4.66675L14 16.3451L10.5 12.8451" stroke="#0F8B8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
