import Image from "next/image";
import Link from "next/link";

const asset = (name: string) => `/figma-home/${name}`;

const aboutIntro = `حتی قوی‌ترین آدم‌ها هم یک روز در سکوت خودشان فرو می‌ریزند.
نه از ضعف، بلکه از خستگی سال‌ها «خودم درستش می‌کنم» گفتن.
ما این لحظه را خوب می‌شناسیم. آن نقطه‌ای که با تمام توان تلاش کردی اوضاع را درست کنی، ولی دوباره برگشتی به همان
بن‌بست‌های تکراری؛ خستگی، دل‌گیری، یا آن حس همیشگی «باز کجای کار اشتباه شد؟».
ما هم آن‌جا بودیم. همان‌جا که فقط دلت یک راهنمای واقعی می‌خواست، نه قضاوت، نه نصیحت، فقط یه نفر که بلد باشد بشنود و راه را نشان دهد.`;

const ozoneBeginning = [
  `ما جمعی از روان‌شناسان و درمانگرانیم با بالای ۲۰ سال سابقه، که در همه این سال‌ها در جلسات فرددرمانی و گروه‌درمانی کنار آدم‌ها نشستیم؛ صدای ترس‌ها،
اشک‌ها و امیدهایشان را شنیدیم. اما همیشه چیزی کم بود: «دسترسی».`,
  "می‌خواستیم گرمای یک جمع درمانی را به خانه‌ی فارسی‌زبانان سراسر دنیا هم برسانیم.",
];

const ozoneHere = [
  `مرکزی که روان‌درمانی را از اتاق‌های بسته بیرون کشیده و وارد زندگی روزمره کرده است.
ما اولین ساختار گروه‌درمانی فارسی‌زبان را ساختیم تا هرکس، از هر جای دنیا، بتواند در جمعی امن و زنده رشد کند.
اینجا، تری فقط گفت‌وگو با روانشناس نیست؛ گفت‌وگو با انسان‌ها هم هست، با کسانی که می‌فهمند، چون خودشان هم از همان راه گذشته‌اند. چون
فرددرمانی و گروه‌درمانی، هر دو مسیرهای نجات‌بخش‌اند؛ اما وقتی در کنار هم قرار می‌گیرند، معجزه می‌کنند.`,
  `در طبیعت، هر سه اتم اکسیژن ناپایدار یک «مولکول اُزون» را می‌سازند،
اما این مولکول ها، کنار هم، لایه‌ای محافظ تشکیل می‌دهند برای زمین؛ «لایه اُزون».
جلسات ما هم همین‌طورند:
صدها جلسه‌ی روان‌درمانی،
که کنار هم لایه‌ای حمایتی برای همه می‌سازند؛ لایه ای که در آن از نو نفس می‌کشند.`,
];

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
          <Image className="about-hero-logo" src="/ozone-logo.svg" alt="اُزون" width={72} height={72} loading="eager" />
        </figure>

        <AboutText title="درباره ما" paragraphs={[aboutIntro]} primary />

        <figure className="about-section-image">
          <Image className="about-section-media" src={asset("499e86f0c53b300cccf38fd0b75a1187caae08d9.png")} alt="همراهی و گفت‌وگوی گروهی" fill quality={100} sizes="(max-width: 700px) 100vw, 668px" />
        </figure>

        <section className="about-copy-block about-origin-block">
          <h2 className="about-origin-title">اُزون از همین نقطه شروع شد؛ از دل پرسشی ساده اما عمیق:</h2>
          <div className="about-copy">
            <ul>
              <li>چرا روان‌درمانی باید فقط برای عده‌ای خاص باشد؟</li>
              <li>چرا فهمیدن خود، شنیده شدن، و رشد کردن، نباید به اندازه‌ی نفس کشیدن در دسترس همه باشد؟</li>
            </ul>
            {ozoneBeginning.map((paragraph, index) => <p key={`ozone-beginning-${index}`}>{paragraph}</p>)}
          </div>
        </section>

        <figure className="about-section-image">
          <Image className="about-section-media" src={asset("99190270ee890ab8be35ab5bb62882448e6bd10a.png")} alt="همکاری و رشد در کنار یکدیگر" fill quality={100} sizes="(max-width: 700px) 100vw, 668px" />
        </figure>

        <AboutText title="اینجا اُزون است؛" paragraphs={ozoneHere} />
      </div>

      <AboutPreconsultation />
    </main>
  );
}
