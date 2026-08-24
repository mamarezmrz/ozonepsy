import { notFound } from "next/navigation";
import { AboutPage } from "@/components/about-page";
import { ContactPage } from "@/components/contact-page";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { products } from "@/lib/data";
import { ProductCard, SectionTitle } from "@/components/ui";

const content: Record<string, { title: string; description: string }> = {
  consultations: { title: "حوزه‌های مشاوره", description: "از میان مسیرهای مختلف مشاوره، گزینه‌ای را پیدا کنید که به نیاز امروزتان نزدیک است." },
  courses: { title: "دوره‌های روانشناسی", description: "یادگیری مهارت‌هایی که در زندگی روزمره همراهتان می‌مانند." },
  "group-therapy": { title: "گروه‌درمانی آنلاین", description: "در یک فضای امن و همراه با آدم‌های هم‌مسیر رشد کنید." },
  therapists: { title: "مشاوران اُزون", description: "با متخصصانی آشنا شوید که برای شنیدن و همراهی آموزش دیده‌اند." },
  pricing: { title: "قیمت‌گذاری و خرید", description: "هر محصول مستقل خریداری می‌شود؛ بدون سبد خرید و پیچیدگی اضافه." },
  about: { title: "درباره اُزون", description: "اُزون جایی است برای گفت‌وگوی امن، رشد آگاهانه و دسترسی ساده به حمایت روانشناختی." },
  contact: { title: "تماس با ما", description: "برای پرسش‌های شما اینجا هستیم." },
  "free-session": { title: "پیش‌مشاوره رایگان", description: "قبل از شروع، چند دقیقه درباره نیازتان با ما صحبت کنید." },
};

function ContactForm() {
  return (
    <div className="mx-auto max-w-2xl rounded-[24px] bg-white p-8 shadow-sm">
      <p className="leading-9 text-[#676b6b]">برای شروع، فرم کوتاه زیر را تکمیل کنید تا همکاران ما با شما تماس بگیرند.</p>
      <form className="mt-6 grid gap-4">
        <input aria-label="نام" placeholder="نام و نام خانوادگی" className="focus-ring rounded-xl border border-[#d8e5e5] px-4 py-3" />
        <input aria-label="ایمیل" placeholder="آدرس ایمیل" type="email" className="focus-ring rounded-xl border border-[#d8e5e5] px-4 py-3" />
        <textarea aria-label="پیام" placeholder="پیام شما" rows={4} className="focus-ring rounded-xl border border-[#d8e5e5] px-4 py-3" />
        <button className="rounded-[20px] bg-[#eba983] px-5 py-3 font-bold">ارسال درخواست</button>
      </form>
    </div>
  );
}

export default async function ListingPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const page = content[section];
  if (!page) notFound();

  if (section === "about") {
    return <><SiteHeader /><AboutPage /><SiteFooter /></>;
  }
  if (section === "contact") {
    return <><SiteHeader /><ContactPage /><SiteFooter /></>;
  }

  const shown = section === "courses"
    ? products.filter((product) => product.kind === "course")
    : section === "group-therapy"
      ? products.filter((product) => product.kind === "group")
      : products;

  return (
    <>
      <SiteHeader />
      <main className="container-oz py-16">
        <SectionTitle eyebrow="اُزون" title={page.title} description={page.description} />
        {section === "contact" || section === "free-session"
          ? <ContactForm />
          : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{shown.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
      </main>
      <SiteFooter />
    </>
  );
}
