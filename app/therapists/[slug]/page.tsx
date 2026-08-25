import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TherapistDetailPage } from "@/components/therapist-detail-page";
import { SiteFooter, SiteHeader } from "@/components/site-header-server";
import { therapistProfiles } from "@/lib/therapists";
import { createPageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return therapistProfiles.map((profile) => ({ slug: profile.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const profile = therapistProfiles.find((item) => item.slug === slug);
  return profile ? createPageMetadata(profile.name, profile.specialty) : createPageMetadata("جزئیات مشاور");
}

export default async function TherapistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = therapistProfiles.find((item) => item.slug === slug);
  if (!profile) notFound();

  return (
    <>
      <SiteHeader />
      <TherapistDetailPage profile={profile} />
      <SiteFooter />
    </>
  );
}
