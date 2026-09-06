import { SpecialistStatus, MediaStatus, MediaVisibility } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type PublicSpecialistProfile = {
  slug: string;
  name: string;
  specialty: string;
  bio: string;
  image: string;
  specialties: string[];
  education: string[];
  responsibilities: string[];
  books: string[];
  quote: string;
};

function resolveImage(imageUrl: string | null, profileMediaId: string | null) {
  if (profileMediaId) return `/api/media/${profileMediaId}`;
  if (!imageUrl) return "/ozone-logo.svg";
  if (imageUrl.startsWith("/") || imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  return `/figma-home/${imageUrl}`;
}

function mapSpecialist(item: {
  slug: string;
  displayName: string;
  specialty: string | null;
  bio: string | null;
  imageUrl: string | null;
  profileMediaId: string | null;
}) : PublicSpecialistProfile {
  const bio = item.bio?.trim() ?? "";
  return {
    slug: item.slug,
    name: item.displayName,
    specialty: item.specialty?.trim() || "مشاور اُزون",
    bio,
    image: resolveImage(item.imageUrl, item.profileMediaId),
    specialties: item.specialty?.trim() ? [item.specialty.trim()] : [],
    education: [],
    responsibilities: [],
    books: [],
    quote: bio,
  };
}

const specialistSelect = {
  slug: true,
  displayName: true,
  specialty: true,
  bio: true,
  imageUrl: true,
  profileMediaId: true,
  profileMedia: {
    select: { id: true },
  },
} as const;

export async function getPublicSpecialists(): Promise<PublicSpecialistProfile[]> {
  const rows = await prisma.specialist.findMany({
    where: {
      status: SpecialistStatus.ACTIVE,
      OR: [
        { profileMediaId: null },
        { profileMedia: { is: { status: MediaStatus.ACTIVE, visibility: MediaVisibility.PUBLIC } } },
      ],
    },
    orderBy: [{ displayName: "asc" }, { createdAt: "asc" }],
    select: specialistSelect,
  });

  return rows.map(mapSpecialist);
}

export async function getPublicSpecialistBySlug(slug: string): Promise<PublicSpecialistProfile | null> {
  const row = await prisma.specialist.findFirst({
    where: {
      slug,
      status: SpecialistStatus.ACTIVE,
      OR: [
        { profileMediaId: null },
        { profileMedia: { is: { status: MediaStatus.ACTIVE, visibility: MediaVisibility.PUBLIC } } },
      ],
    },
    select: specialistSelect,
  });

  return row ? mapSpecialist(row) : null;
}
