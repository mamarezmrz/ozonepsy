import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GroupTherapyDetailPage } from "@/components/group-therapy-detail-page";
import { SiteFooter, SiteHeader } from "@/components/site-header-server";
import { groupTherapySessions } from "@/lib/group-therapy";
import { createPageMetadata } from "@/lib/seo";
import { getPublicContent } from "@/lib/public/content";

export function generateStaticParams() {
  return groupTherapySessions.map((session) => ({ slug: session.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const session = groupTherapySessions.find((item) => item.slug === slug);
  return session ? createPageMetadata(session.title, session.description) : createPageMetadata("جزئیات جلسه گروه‌درمانی");
}

export default async function GroupTherapySessionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = groupTherapySessions.find((item) => item.slug === slug);
  if (!session) notFound();
  const publicContent = await getPublicContent();

  return (
    <>
      <SiteHeader />
      <GroupTherapyDetailPage session={session} content={publicContent} />
      <SiteFooter />
    </>
  );
}
