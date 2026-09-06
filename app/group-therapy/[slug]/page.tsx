import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GroupTherapyDetailPage } from "@/components/group-therapy-detail-page";
import { SiteFooter, SiteHeader } from "@/components/site-header-server";
import { createPageMetadata } from "@/lib/seo";
import { getPublicContent } from "@/lib/public/content";
import { getPublishedGroupTherapyBySlug } from "@/lib/public/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedGroupTherapyBySlug(slug);
  return product ? createPageMetadata(product.title, product.description) : createPageMetadata("جزئیات جلسه گروه‌درمانی");
}

export default async function GroupTherapySessionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, publicContent] = await Promise.all([getPublishedGroupTherapyBySlug(slug), getPublicContent()]);
  if (!product) notFound();

  return (
    <>
      <SiteHeader />
      <GroupTherapyDetailPage product={product} content={publicContent} />
      <SiteFooter />
    </>
  );
}
