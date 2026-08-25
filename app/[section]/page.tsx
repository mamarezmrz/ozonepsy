import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AboutPage } from "@/components/about-page";
import { ContactPage } from "@/components/contact-page";
import { CoursesPage } from "@/components/courses-page";
import { FreeSessionPage } from "@/components/free-session-page";
import { GroupTherapyPage } from "@/components/group-therapy-page";
import { PricingPage } from "@/components/pricing-page";
import { PartnersPage } from "@/components/partners-page";
import { SupportFundPage } from "@/components/support-fund-page";
import { SiteFooter, SiteHeader } from "@/components/site-header-server";
import { products } from "@/lib/data";
import { ProductCard, SectionTitle } from "@/components/ui";
import { createPageMetadata } from "@/lib/seo";

const content: Record<string, { title: string; description: string }> = {
  consultations: { title: "حوزه‌های مشاوره", description: "از میان مسیرهای مختلف مشاوره، گزینه‌ای را پیدا کنید که به نیاز امروزتان نزدیک است." },
  courses: { title: "دوره‌های روانشناسی", description: "یادگیری مهارت‌هایی که در زندگی روزمره همراهتان می‌مانند." },
  "group-therapy": { title: "گروه‌درمانی آنلاین", description: "در یک فضای امن و همراه با آدم‌های هم‌مسیر رشد کنید." },
  therapists: { title: "مشاوران اُزون", description: "با متخصصانی آشنا شوید که برای شنیدن و همراهی آموزش دیده‌اند." },
  pricing: { title: "قیمت‌گذاری و خرید", description: "هر محصول مستقل خریداری می‌شود؛ بدون سبد خرید و پیچیدگی اضافه." },
  about: { title: "درباره اُزون", description: "اُزون جایی است برای گفت‌وگوی امن، رشد آگاهانه و دسترسی ساده به حمایت روانشناختی." },
  contact: { title: "تماس با ما", description: "برای پرسش‌های شما اینجا هستیم." },
  "support-fund": { title: "صندوق حمایت", description: "با همراهی شما، دسترسی به حمایت روانشناختی برای افراد بیشتری ممکن می‌شود." },
  partners: { title: "همکاران اُزون", description: "با موسسات و مشاوران حرفه‌ای همکار اُزون آشنا شوید." },
  "free-session": { title: "پیش‌مشاوره رایگان", description: "قبل از شروع، چند دقیقه درباره نیازتان با ما صحبت کنید." },
};

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  const page = content[section];
  return page ? createPageMetadata(page.title, page.description) : createPageMetadata("صفحه پیدا نشد");
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
  if (section === "support-fund") {
    return <><SiteHeader /><SupportFundPage /><SiteFooter /></>;
  }
  if (section === "free-session") {
    return <><SiteHeader /><FreeSessionPage /><SiteFooter /></>;
  }
  if (section === "pricing") {
    return <><SiteHeader /><PricingPage /><SiteFooter /></>;
  }
  if (section === "courses") {
    return <><SiteHeader /><CoursesPage /><SiteFooter /></>;
  }
  if (section === "group-therapy") {
    return <><SiteHeader /><GroupTherapyPage /><SiteFooter /></>;
  }
  if (section === "partners") {
    return <><SiteHeader /><PartnersPage /><SiteFooter /></>;
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{shown.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </main>
      <SiteFooter />
    </>
  );
}
