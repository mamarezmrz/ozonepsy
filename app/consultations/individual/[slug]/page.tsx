import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ConsultationTopicPage } from "@/components/consultation-topic-page";
import { SiteFooter, SiteHeader } from "@/components/site-header-server";
import { getConsultationTopic } from "@/lib/consultation-topics";
import { createPageMetadata } from "@/lib/seo";
import { getPublicContent } from "@/lib/public/content";
import { getPublicIndividualConsultationTopic } from "@/lib/individual-consultation-content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const stored = await getPublicIndividualConsultationTopic(slug);
  const topic = stored.topic ?? (!stored.blocked ? getConsultationTopic(slug) : undefined);
  return topic ? createPageMetadata(topic.title, topic.description) : createPageMetadata("مشاوره فردی");
}

export default async function IndividualTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stored = await getPublicIndividualConsultationTopic(slug);
  const topic = stored.topic ?? (!stored.blocked ? getConsultationTopic(slug) : undefined);
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
