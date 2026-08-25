import type { MetadataRoute } from "next";
import { consultationTopics } from "@/lib/consultation-topics";
import { institutionProfiles } from "@/lib/institutions";
import { groupTherapySessions } from "@/lib/group-therapy";
import { therapistProfiles } from "@/lib/therapists";

export default function sitemap(): MetadataRoute.Sitemap {
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
    ...consultationTopics.map((topic) => `/consultations/individual/${topic.slug}`),
  ];

  return paths.map((path) => ({ url: `https://ozonepsy.example${path}`, lastModified: new Date() }));
}
