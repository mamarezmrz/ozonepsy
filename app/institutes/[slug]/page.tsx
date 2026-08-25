import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { InstitutionDetailPage } from "@/components/institution-detail-page";
import { SiteFooter, SiteHeader } from "@/components/site-header-server";
import { institutionProfiles } from "@/lib/institutions";
import { createPageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return institutionProfiles.map((profile) => ({ slug: profile.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const profile = institutionProfiles.find((item) => item.slug === slug);
  return profile ? createPageMetadata(profile.name, profile.specialty) : createPageMetadata("جزئیات موسسه");
}

export default async function InstitutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = institutionProfiles.find((item) => item.slug === slug);
  if (!profile) notFound();

  return (
    <>
      <SiteHeader />
      <InstitutionDetailPage profile={profile} />
      <SiteFooter />
    </>
  );
}
