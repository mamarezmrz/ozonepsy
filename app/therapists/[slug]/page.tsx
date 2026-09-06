import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TherapistDetailPage } from "@/components/therapist-detail-page";
import { SiteFooter, SiteHeader } from "@/components/site-header-server";
import { getPublicSpecialistBySlug, getPublicSpecialists } from "@/lib/public/specialists";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicSpecialistBySlug(slug);
  return profile ? createPageMetadata(profile.name, profile.specialty) : createPageMetadata("جزئیات مشاور");
}

export default async function TherapistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [profile, specialists] = await Promise.all([getPublicSpecialistBySlug(slug), getPublicSpecialists()]);
  if (!profile) notFound();

  return (
    <>
      <SiteHeader />
      <TherapistDetailPage profile={profile} relatedProfiles={specialists.filter((item) => item.slug !== profile.slug).slice(0, 4)} />
      <SiteFooter />
    </>
  );
}
