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

const commonSpecialties = [
  "روانشناسی",
  "مشاوره دارویی",
  "اختلالات و آسیب‌شناسی",
  "مراقبت‌های روانشناختی فرد و خانواده",
];

const commonEducation = [
  "فلوشیپ سلامت معنوی دانشگاه دنور-آمریکا",
  "تخصص روانپزشکی دانشگاه علوم پزشکی ایران",
  "پزشکی عمومی دانشگاه تهران",
];

const commonResponsibilities = [
  "هیئت علمی بازنشسته دانشگاه علوم پزشکی ایران",
  "نایب‌رئیس کمیته سلامت روان ایران",
  "بنیان‌گذار برنامه‌های حمایت از سلامت روان در سیستم مراقبت اولیه بهداشتی ایران",
  "معاونت بهداشت و روان استانداری اصفهان",
];

const commonBooks = [
  "هیئت علمی بازنشسته دانشگاه علوم پزشکی ایران",
  "شبکه سلامت روان ایران",
  "بنیان‌گذار برنامه‌های حمایت از سلامت روان در سیستم مراقبت اولیه بهداشتی ایران",
  "معاونت بهداشت و روان استانداری اصفهان",
];

const commonQuote =
  "یک متن کوتاه از زبان درمانگر برای نشان دادن طرز فکر و نگرش ایشان به مسائل مربوط به روانشناسی و در کل به مسائل مختلف زندگی می‌تواند به درمانجو کمک کند تا قبل از برداشتن اولین قدم، بتواند حال و هوای فضای درمان و تا حدی درمانگر مربوطه را درک کند.";

const fallbackSpecialists: PublicSpecialistProfile[] = [
  ["reza-moloudi", "دکتر رضا مولودی", "partner-11.jpg"],
  ["sara-moloudi", "دکتر سارا مولودی", "partner-7.jpg"],
  ["ali-moloudi", "دکتر علی مولودی", "partner-6.jpg"],
  ["mohammad-moloudi", "دکتر محمد مولودی", "partner-9.jpg"],
  ["nazanin-moloudi", "دکتر نازنین مولودی", "partner-10.jpg"],
  ["amir-moloudi", "دکتر امیر مولودی", "partner-11.jpg"],
].map(([slug, name, image]) => ({
  slug,
  name,
  specialty: "کارشناس ارشد روانشناسی بالینی",
  bio: commonQuote,
  image: `/figma-home/${image}`,
  specialties: [...commonSpecialties],
  education: [...commonEducation],
  responsibilities: [...commonResponsibilities],
  books: [...commonBooks],
  quote: commonQuote,
}));

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

  return rows.length ? rows.map(mapSpecialist) : fallbackSpecialists;
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

  if (row) return mapSpecialist(row);
  return fallbackSpecialists.find((profile) => profile.slug === slug) ?? null;
}
