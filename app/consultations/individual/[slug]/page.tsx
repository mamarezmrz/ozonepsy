import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ConsultationTopicPage } from "@/components/consultation-topic-page";
import { SiteFooter, SiteHeader } from "@/components/site-header-server";
import { consultationTopicSlugAliases, consultationTopics, getConsultationTopic } from "@/lib/consultation-topics";
import { createPageMetadata } from "@/lib/seo";
import { getPublicContent } from "@/lib/public/content";

export function generateStaticParams() {
  return [...consultationTopics.map((topic) => topic.slug), ...Object.keys(consultationTopicSlugAliases)].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = getConsultationTopic(slug);
  return topic ? createPageMetadata(topic.title, topic.description) : createPageMetadata("مشاوره فردی");
}

export default async function IndividualTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = getConsultationTopic(slug);
  if (!topic) notFound();
  const publicContent = await getPublicContent();

  return (
    <>
      <SiteHeader />
      <ConsultationTopicPage topic={topic} content={publicContent} />
      <SiteFooter />
    </>
  );
}
