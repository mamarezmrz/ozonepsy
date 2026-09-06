import type { MetadataRoute } from "next";
import { institutionProfiles } from "@/lib/institutions";
import { getPublicSpecialists } from "@/lib/public/specialists";
import { getPublishedProducts } from "@/lib/public/catalog";
import { getPublicSiteUrl } from "@/lib/seo";
import { getPublicIndividualConsultationCases } from "@/lib/individual-consultation-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamicCases = await getPublicIndividualConsultationCases();
  const specialists = await getPublicSpecialists();
  const groupProducts = await getPublishedProducts("group");
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
    ...specialists.map((profile) => `/therapists/${profile.slug}`),
    ...groupProducts.map((product) => `/group-therapy/${product.slug}`),
    ...institutionProfiles.map((profile) => `/institutes/${profile.slug}`),
    ...(dynamicCases?.items ?? []).map((item) => item.href),
  ];

  return paths.map((path) => ({ url: `${getPublicSiteUrl()}${path}`, lastModified: new Date() }));
}
