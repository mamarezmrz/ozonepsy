import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ConsultationTopicPage } from "@/components/consultation-topic-page";
import { SiteFooter, SiteHeader } from "@/components/site-header-server";
import { consultationTopics } from "@/lib/consultation-topics";
import { createPageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return consultationTopics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = consultationTopics.find((item) => item.slug === slug);
  return topic ? createPageMetadata(topic.title, topic.description) : createPageMetadata("مشاوره فردی");
}

export default async function IndividualTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = consultationTopics.find((item) => item.slug === slug);
  if (!topic) notFound();

  return (
    <>
      <SiteHeader />
      <ConsultationTopicPage topic={topic} />
      <SiteFooter />
    </>
  );
}
