import type { MetadataRoute } from "next";
import { institutionProfiles } from "@/lib/institutions";
import { groupTherapySessions } from "@/lib/group-therapy";
import { therapistProfiles } from "@/lib/therapists";
import { getPublicSiteUrl } from "@/lib/seo";
import { getLegacyIndividualConsultationCases, getPublicIndividualConsultationCases } from "@/lib/individual-consultation-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamicCases = await getPublicIndividualConsultationCases();
  const individualCases = dynamicCases ?? getLegacyIndividualConsultationCases();
  const paths = [
    "/",
    "/consultations",
    "/courses",
    "/group-therapy",
    "/therapists",
    "/pricing",
    "/partners",
    "/about",
    "/contact",
    "/free-session",
    ...therapistProfiles.map((profile) => `/therapists/${profile.slug}`),
    ...institutionProfiles.map((profile) => `/institutes/${profile.slug}`),
    ...groupTherapySessions.map((session) => `/group-therapy/${session.slug}`),
    ...individualCases.items.map((item) => item.href),
  ];

  return paths.map((path) => ({ url: `${getPublicSiteUrl()}${path}`, lastModified: new Date() }));
}
