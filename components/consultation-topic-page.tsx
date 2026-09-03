import Image from "next/image";
import Link from "next/link";
import { AboutPreconsultation } from "@/components/about-page";
import { HomeFaq } from "@/components/home-interactive";
import { type ConsultationTopic } from "@/lib/consultation-topics";
import type { PublicContent } from "@/lib/public/content";

const serviceSteps = [
  ["۱", "درخواست مشاوره رایگان", "برای شروع کافیه توی سایت ثبت نام کنید و درخواست مشاوره خودتون رو ثبت کنید."],
  ["۲", "تعیین زمان جلسه", "بعد از ثبت نام همکاران ما با شما تماس می‌گیرن تا زمان جلسه پیش‌مشاوره رو با شما تنظیم کنن."],
  ["۳", "انتخاب مشاور و نوع جلسه", "بعد از این که همکاران اطلاعات لازم رو بهتون دادن در نهایت شما در صورت تمایل مشاور خودتون رو انتخاب می‌کنین."],
  ["۴", "برگزاری جلسه", "با مشخص شدن مشاور و زمان جلسه، طبق زمان‌بندی مشخص شده جلسه‌تون برگزار می‌شه."],
] as const;

export function ConsultationTopicPage({ topic, content }: { topic: ConsultationTopic; content?: PublicContent }) {
  const faqTopicTitle = topic.title.replace(/\s*\([^()]*\)\s*$/, "");
  const approachParagraphs = topic.approachParagraphs;
  const hasApproachParagraphs = Array.isArray(approachParagraphs) ? approachParagraphs.length > 0 : Boolean(approachParagraphs?.trim());
  const isUploadedHero = topic.image.startsWith("/api/media/");

  return (
    <main className="consultation-topic-page">
      <div className="consultation-topic-inner">
        <section className="consultation-topic-heading" aria-labelledby="consultation-topic-title">
          <h1 id="consultation-topic-title">{topic.title}</h1>
          <p>{topic.description}</p>
          {topic.introList ? <ul className="consultation-topic-intro-list">{topic.introList.map((item, index) => <li key={`intro-${index}`}>{item}</li>)}</ul> : null}
        </section>

        {topic.image ? <figure className={`consultation-topic-hero${isUploadedHero ? " consultation-topic-hero-uploaded" : ""}`} aria-label={topic.title}>
          {topic.showHeroBranding !== false ? <><div className="consultation-topic-circles" aria-hidden="true" /><Image className="consultation-topic-logo" src="/ozone-logo.svg" alt="اُزون" width={124} height={124} loading="eager" /></> : null}
          <Image className={`consultation-topic-person consultation-topic-person-${topic.imageMode ?? "normal"}`} src={topic.image.startsWith("/") ? topic.image : `/figma-home/${topic.image}`} alt="" fill priority quality={100} sizes="(max-width: 900px) 100vw, 960px" />
        </figure> : null}

        <div className="consultation-topic-content">
          <TopicSection title={topic.signsTitle ?? "نشانه‌های رایج (چند علامت کافی است)"}>
            <ul>{topic.signs.map((item, index) => <li key={`sign-${index}`}>{item}</li>)}</ul>
            {topic.signsNote ? <p className="consultation-topic-note">{topic.signsNote}</p> : null}
          </TopicSection>
          <TopicSection title="چرا پیش می‌آید؟"><p>{topic.why}</p></TopicSection>
          <TopicSection title={topic.whenToGetHelpTitle ?? "چه زمانی لازم است کمک بگیریم؟"}><ul>{topic.whenToGetHelp.map((item, index) => <li key={`help-${index}`}>{item}</li>)}</ul></TopicSection>
          <TopicSection title="چه کارهایی معمولاً کمک می‌کند؟"><TopicParagraphs content={topic.whatHelps} /></TopicSection>
          {hasApproachParagraphs ? (
            <TopicSection title={topic.approachTitle ?? "اُزون: چطور کنار شما می‌ایستیم"}><TopicParagraphs content={approachParagraphs ?? ""} /></TopicSection>
          ) : (
            <TopicSection title={topic.approachTitle ?? "اُزون: چطور کنار شما می‌ایستیم"}><ul>{topic.approach.map((item, index) => <li key={`approach-${index}`}>{item}</li>)}</ul></TopicSection>
          )}
          {topic.hideShortQuestions ? null : <TopicSection title="پرسش‌های کوتاه"><TopicParagraphs content={topic.shortQuestions} /></TopicSection>}
        </div>
      </div>

      <section className="consultation-topic-steps home-service-steps" aria-labelledby="consultation-topic-steps-title">
        <div className="home-service-steps-inner">
          <div className="home-service-steps-head"><h2 id="consultation-topic-steps-title">مراحل دریافت خدمات</h2></div>
          <div className="home-service-steps-list">{serviceSteps.map(([number, title, description]) => <article key={number} className="home-service-step"><div className="home-service-step-marker">{number}</div><h3>{title}</h3><p>{description}</p></article>)}</div>
          <Link href="/free-session" className="home-service-steps-link">پیش مشاوره رایگان</Link>
        </div>
      </section>

      <section className="consultation-topic-faq home-faq" aria-labelledby="consultation-topic-faq-title">
        <div className="home-faq-inner"><h2 id="consultation-topic-faq-title">سوالات متداول مربوط به {faqTopicTitle}</h2><HomeFaq items={content?.faqs} /></div>
      </section>

      <AboutPreconsultation />
    </main>
  );
}

function TopicSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="consultation-topic-section"><h2>{title}</h2><div className="consultation-topic-section-body">{children}</div></section>;
}

function TopicParagraphs({ content }: { content: string | string[] }) {
  const paragraphs = Array.isArray(content) ? content : [content];
  return <>{paragraphs.map((paragraph, index) => <p key={`paragraph-${index}`}>{paragraph}</p>)}</>;
}
