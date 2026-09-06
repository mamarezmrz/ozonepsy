import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ConsultationTopicPage } from "@/components/consultation-topic-page";
import { SiteFooter, SiteHeader } from "@/components/site-header-server";
import { createPageMetadata } from "@/lib/seo";
import { getPublicContent } from "@/lib/public/content";
import { getPublicConsultationTopic, type ConsultationCasesPageKey } from "@/lib/individual-consultation-content";

const pageKeys = new Set<ConsultationCasesPageKey>(["individual", "couples", "teenagers", "group-therapy"]);

function getPageKey(category: string) {
  return pageKeys.has(category as ConsultationCasesPageKey) ? category as ConsultationCasesPageKey : null;
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const pageKey = getPageKey(category);
  if (!pageKey) return createPageMetadata("صفحه پیدا نشد");
  const stored = await getPublicConsultationTopic(slug, pageKey);
  return stored.topic ? createPageMetadata(stored.topic.title, stored.topic.description) : createPageMetadata("صفحه پیدا نشد");
}

export default async function ConsultationTopicByCategoryPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const pageKey = getPageKey(category);
  if (!pageKey) notFound();
  const stored = await getPublicConsultationTopic(slug, pageKey);
  if (!stored.topic) notFound();
  const publicContent = await getPublicContent();

  return (
    <>
      <SiteHeader />
      <ConsultationTopicPage topic={stored.topic} content={publicContent} />
      <SiteFooter />
    </>
  );
}
