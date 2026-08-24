import Image from "next/image";
import Link from "next/link";

const asset = (name: string) => `/figma-home/${name}`;

const aboutParagraph = "مشاوره فردی به هر آن چیزی که برای توسعه فردی، درمان اختلالات روانی و ارتقاء سلامت روان نیاز است، می‌پردازد. این مشاوره به صورت محرمانه بین شما و تراپیست مورد نظر انجام می‌شود و اولین گام برای قرار گرفتن در مسیر درست انتخاب مشاوره‌های تخصصی طبق مساله شماست. ما در سیمیاروم شما را راهنمایی می‌کنیم تا بهترین مشاور را برای خود انتخاب کنید و همچنین از مشکلات احتمالی به وجود آمده در سلامت روان و پیشرفت فردی خود آگاهی بیشتری داشته باشید.";
const goalsParagraph = "مشاوره فردی به هر آن چیزی که برای توسعه فردی، درمان اختلالات روانی و ارتقاء سلامت روان نیاز است، می‌پردازد. این مشاوره به صورت محرمانه بین شما و تراپیست مورد نظر انجام می‌شود و اولین گام برای قرار گرفتن در مسیر درست انتخاب مشاوره‌های تخصصی طبق مساله شماست.";

function AboutText({ title, paragraphs, primary = false }: { title: string; paragraphs: string[]; primary?: boolean }) {
  return (
    <section className="about-copy-block">
      {primary ? <h1>{title}</h1> : <h2>{title}</h2>}
      <div className="about-copy">
        {paragraphs.map((paragraph, index) => <p key={`${title}-${index}`}>{paragraph}</p>)}
      </div>
    </section>
  );
}

export function AboutPreconsultation() {
  return (
    <section className="about-preconsultation" aria-labelledby="about-preconsultation-title">
      <div className="about-preconsultation-inner">
        <figure className="about-preconsultation-image">
          <Image src={asset("5dac2277462f6b310726942ed419287d1a9f89c3.png")} alt="مشاور اُزون" fill quality={100} sizes="(max-width: 900px) 100vw, 632px" />
        </figure>
        <div className="about-preconsultation-copy">
          <h2 id="about-preconsultation-title">رزرو پیش مشاوره رایگان</h2>
          <p>برای یک گفت‌وگوی کوتاه، بی‌تعهد و محرمانه:<br />رزرو ۱۰ دقیقه رایگان یا پیام در واتساپ/تماس<br />اگر مردد هستید، همین گفت‌وگوی کوتاه می‌تواند قدم اول مطمئن باشد.</p>
          <Link href="/free-session" className="about-preconsultation-cta">درخواست پیش مشاوره رایگان</Link>
        </div>
      </div>
    </section>
  );
}

export function AboutPage() {
  return (
    <main className="about-page">
      <div className="about-page-inner">
        <figure className="about-hero-image">
          <Image className="about-hero-media about-hero-media-grayscale" src={asset("499e86f0c53b300cccf38fd0b75a1187caae08d9.png")} alt="گفت‌وگوی گروهی و همراهی انسان‌ها" fill priority quality={100} sizes="(max-width: 900px) 100vw, 960px" />
          <Image className="about-hero-logo" src="/ozone-logo.svg" alt="اُزون" width={72} height={72} />
        </figure>

        <AboutText title="درباره ما" paragraphs={[aboutParagraph, aboutParagraph]} primary />

        <figure className="about-section-image">
          <Image className="about-section-media" src={asset("499e86f0c53b300cccf38fd0b75a1187caae08d9.png")} alt="همراهی و گفت‌وگوی گروهی" fill quality={100} sizes="(max-width: 700px) 100vw, 668px" />
        </figure>

        <AboutText title="اهداف ما" paragraphs={[goalsParagraph, goalsParagraph, goalsParagraph]} />

        <figure className="about-section-image">
          <Image className="about-section-media" src={asset("99190270ee890ab8be35ab5bb62882448e6bd10a.png")} alt="همکاری و رشد در کنار یکدیگر" fill quality={100} sizes="(max-width: 700px) 100vw, 668px" />
        </figure>

        <AboutText title="رویکرد اُزون" paragraphs={[goalsParagraph, goalsParagraph, goalsParagraph]} />
      </div>

      <AboutPreconsultation />
    </main>
  );
}
