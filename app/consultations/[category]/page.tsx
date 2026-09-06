import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ConsultationCategoryPage } from "@/components/individual-consultation-page";
import { SiteFooter, SiteHeader } from "@/components/site-header-server";
import { getConsultationCategoryContent } from "@/lib/consultation-categories";
import { getPublicConsultationBenefits } from "@/lib/consultation-benefits";
import { getPublicConsultationCases } from "@/lib/individual-consultation-content";
import { createPageMetadata } from "@/lib/seo";
import { getPublishedReviewsForProductSlug } from "@/lib/reviews";

const categoryDescriptions: Record<string, string> = {
  individual: "مشاوره فردی آنلاین و محرمانه برای شناخت بهتر خود و عبور از چالش‌ها.",
  couples: "زوج‌درمانی و مشاوره رابطه برای گفت‌وگویی امن‌تر و ساختن رابطه‌ای پایدارتر.",
  teenagers: "مشاوره تخصصی کودک و نوجوان برای رشد، آرامش و ساختن پیوندهای امن.",
};

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const content = getConsultationCategoryContent(category);
  return content ? createPageMetadata(content.title, categoryDescriptions[category]) : createPageMetadata("صفحه پیدا نشد");
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const content = getConsultationCategoryContent(category);
  if (!content) notFound();
  const reviewProductSlug = content.slug === "individual" ? "individual-consultation" : content.slug === "teenagers" ? "teenagers" : content.slug === "couples" ? "couples" : null;
  const [reviews, dynamicBenefits, dynamicCases] = await Promise.all([
    reviewProductSlug ? getPublishedReviewsForProductSlug(reviewProductSlug) : Promise.resolve([]),
    getPublicConsultationBenefits(content.slug),
    getPublicConsultationCases(content.slug),
  ]);

  return <><SiteHeader /><ConsultationCategoryPage content={content} reviews={reviews} reviewProductSlug={reviewProductSlug} dynamicBenefits={dynamicBenefits} dynamicCases={dynamicCases} faqItems={content.faqItems} /><SiteFooter /></>;
}
