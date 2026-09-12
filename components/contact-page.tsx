import Image from "next/image";
import { HomeFaq } from "@/components/home-interactive";
import { AboutPreconsultation } from "@/components/about-page";
import type { PublicContent } from "@/lib/public/content";

const asset = (name: string) => `/figma-home/${name}`;

const socialLinks = [
  ["واتساپ", "whatsapp"],
  ["تلگرام", "telegram"],
  ["اینستاگرام", "instagram"],
  ["ایکس (توییتر)", "x"],
] as const;

type SocialType = (typeof socialLinks)[number][1];

function ContactSocialIcon({ type }: { type: SocialType }) {
  if (type === "whatsapp") {
    return <svg className="contact-social-inline" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12.9598 2.70305C12.3147 2.05492 11.5464 1.54103 10.6998 1.19131C9.85306 0.841584 8.94488 0.663031 8.02814 0.666053C4.18693 0.666053 1.05628 3.78105 1.05628 7.60303C1.05628 8.82803 1.3799 10.018 1.98492 11.068L1 14.666L4.69347 13.7C5.71357 14.253 6.8603 14.547 8.02814 14.547C11.8693 14.547 15 11.432 15 7.61004C15 5.75504 14.2754 4.01204 12.9598 2.70305ZM8.02814 13.371C6.98693 13.371 5.96683 13.091 5.07337 12.566L4.86231 12.44L2.66734 13.014L3.25126 10.886L3.11055 10.669C2.53194 9.74997 2.22477 8.68752 2.22412 7.60303C2.22412 4.42504 4.82714 1.83505 8.0211 1.83505C9.56884 1.83505 11.0251 2.43705 12.1156 3.52905C12.6556 4.06375 13.0836 4.69982 13.3746 5.40037C13.6657 6.10092 13.814 6.852 13.8111 7.61004C13.8251 10.788 11.2221 13.371 8.02814 13.371ZM11.208 9.05903C11.0322 8.97503 10.1739 8.55503 10.0191 8.49203C9.85729 8.43603 9.74472 8.40803 9.62512 8.57603C9.50553 8.75103 9.17487 9.14303 9.07638 9.25503C8.97789 9.37403 8.87236 9.38803 8.69648 9.29703C8.5206 9.21303 7.95779 9.02403 7.29648 8.43603C6.77588 7.97403 6.43116 7.40704 6.32563 7.23204C6.22714 7.05704 6.31156 6.96604 6.40301 6.87504C6.4804 6.79804 6.57889 6.67204 6.66332 6.57404C6.74774 6.47604 6.78291 6.39904 6.8392 6.28704C6.89548 6.16804 6.86734 6.07004 6.82513 5.98604C6.78291 5.90204 6.43116 5.04804 6.29045 4.69804C6.14975 4.36204 6.00201 4.40404 5.89648 4.39704H5.55879C5.4392 4.39704 5.25628 4.43904 5.09447 4.61404C4.9397 4.78904 4.48945 5.20904 4.48945 6.06304C4.48945 6.91704 5.11558 7.74304 5.2 7.85503C5.28442 7.97403 6.43116 9.72403 8.17588 10.473C8.59095 10.655 8.91457 10.76 9.16784 10.837C9.58291 10.97 9.96281 10.949 10.2653 10.907C10.603 10.858 11.2995 10.487 11.4402 10.081C11.5879 9.67503 11.5879 9.33203 11.5387 9.25503C11.4894 9.17803 11.3839 9.14303 11.208 9.05903Z" fill="#3B4040" /></svg>;
  }

  return <span className={`contact-social-icon is-${type}`} aria-hidden="true" />;
}

export function ContactPage({ content }: { content?: PublicContent }) {
  return (
    <main className="contact-page">
      <div className="contact-page-inner">
        <figure className="contact-hero-image">
          <Image className="contact-hero-media" src={asset("27b6de804ab70c53e8528b81270e5add64484aab.jpg")} alt="همکاران اُزون آماده پاسخ‌گویی هستند" fill priority quality={100} sizes="(max-width: 900px) 100vw, 960px" />
          <Image className="contact-hero-logo" src="/ozone-logo.svg" alt="اُزون" width={72} height={72} loading="eager" />
        </figure>

        <section className="contact-details" aria-labelledby="contact-title">
          <h1 id="contact-title">تماس با ما</h1>
          <div className="contact-details-grid">
            <dl className="contact-info-list">
              <div><dt>شماره تماس</dt><dd dir="ltr">+۹۸ ۹۱۲ ۱۳۳ ۴۵۶۷</dd></div>
              <div><dt>ایمیل</dt><dd dir="ltr">support@ozonepsy.com</dd></div>
            </dl>
            <div className="contact-social-area">
              <div className="contact-social-row">
                <span>ارسال پیام</span>
                <div className="contact-social-list">
                  {socialLinks.slice(0, 2).map(([label, type]) => <a key={type} href={`#${type}`} className="contact-social-button"><ContactSocialIcon type={type} /><span>{label}</span></a>)}
                </div>
              </div>
              <div className="contact-social-row">
                <span>شبکه‌های اجتماعی</span>
                <div className="contact-social-list">
                  {socialLinks.slice(2).map(([label, type]) => <a key={type} href={`#${type}`} className="contact-social-button"><ContactSocialIcon type={type} /><span>{label}</span></a>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="contact-form-section" aria-labelledby="contact-form-title">
          <div className="contact-divider" />
          <h2 id="contact-form-title">با ما در ارتباط باشید</h2>
          <p>کارشناسان ما در اولین فرصت به شما پاسخ خواهند داد.</p>
          <form className="contact-form">
            <label htmlFor="contact-name">نام</label>
            <input id="contact-name" name="name" autoComplete="name" />
            <label htmlFor="contact-email">ایمیل</label>
            <input id="contact-email" name="email" type="email" autoComplete="email" />
            <label htmlFor="contact-message">متن پیام</label>
            <textarea id="contact-message" name="message" rows={4} />
            <button type="submit">ارسال پیام</button>
          </form>
        </section>
      </div>

      {content?.faqs?.length ? <section className="contact-faq home-faq" aria-labelledby="contact-faq-title">
        <div className="home-faq-inner">
          <h2 id="contact-faq-title">سوالات متداول</h2>
          <HomeFaq items={content?.faqs} />
        </div>
      </section> : null}

      <AboutPreconsultation />
    </main>
  );
}
