import { SpecialistStatus, MediaStatus, MediaVisibility } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { legacySpecialistProfileSections, parseSpecialistProfileSections, type SpecialistProfileSection } from "@/lib/specialist-profile";

export type PublicSpecialistProfile = {
  slug: string;
  name: string;
  specialty: string;
  bio: string;
  image: string;
  aboutTitle: string;
  aboutDescription: string;
  specialtiesTitle: string;
  specialties: string[];
  educationTitle: string;
  education: string[];
  responsibilitiesTitle: string;
  responsibilities: string[];
  booksTitle: string;
  books: string[];
  quoteTitle: string;
  quote: string;
  sections: SpecialistProfileSection[];
};

const detailTitles = {
  about: "معرفی متخصص",
  specialties: "حوزه‌های تخصصی",
  education: "سوابق علمی",
  responsibilities: "مسئولیتهای علمی و اجرایی",
  books: "کتابها",
  quote: "سخنی با درمان‌جو",
} as const;

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
  aboutTitle: string | null;
  aboutDescription: string | null;
  specialtiesTitle: string | null;
  specialtiesItems: string[];
  educationTitle: string | null;
  educationItems: string[];
  responsibilitiesTitle: string | null;
  responsibilitiesItems: string[];
  booksTitle: string | null;
  booksItems: string[];
  quoteTitle: string | null;
  quote: string | null;
  profileSections: unknown;
  imageUrl: string | null;
  profileMediaId: string | null;
}) : PublicSpecialistProfile {
  const bio = item.bio?.trim() ?? "";
  const sections = parseSpecialistProfileSections(item.profileSections);
  return {
    slug: item.slug,
    name: item.displayName,
    specialty: item.specialty?.trim() || "مشاور اُزون",
    bio,
    image: resolveImage(item.imageUrl, item.profileMediaId),
    aboutTitle: item.aboutTitle?.trim() || detailTitles.about,
    aboutDescription: item.aboutDescription?.trim() || "",
    specialtiesTitle: item.specialtiesTitle?.trim() || detailTitles.specialties,
    specialties: item.specialtiesItems.length ? item.specialtiesItems : item.specialty?.trim() ? [item.specialty.trim()] : [],
    educationTitle: item.educationTitle?.trim() || detailTitles.education,
    education: item.educationItems,
    responsibilitiesTitle: item.responsibilitiesTitle?.trim() || detailTitles.responsibilities,
    responsibilities: item.responsibilitiesItems,
    booksTitle: item.booksTitle?.trim() || detailTitles.books,
    books: item.booksItems,
    quoteTitle: item.quoteTitle?.trim() || detailTitles.quote,
    quote: item.quote?.trim() || bio,
    sections: sections.length ? sections : legacySpecialistProfileSections(item),
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
  aboutTitle: detailTitles.about,
  aboutDescription: "",
  specialtiesTitle: detailTitles.specialties,
  specialties: [...commonSpecialties],
  educationTitle: detailTitles.education,
  education: [...commonEducation],
  responsibilitiesTitle: detailTitles.responsibilities,
  responsibilities: [...commonResponsibilities],
  booksTitle: detailTitles.books,
  books: [...commonBooks],
  quoteTitle: detailTitles.quote,
  quote: commonQuote,
  sections: [
    { id: "specialties", title: detailTitles.specialties, description: commonSpecialties.join("\n") },
    { id: "education", title: detailTitles.education, description: commonEducation.join("\n") },
    { id: "responsibilities", title: detailTitles.responsibilities, description: commonResponsibilities.join("\n") },
    { id: "books", title: detailTitles.books, description: commonBooks.join("\n") },
    { id: "quote", title: detailTitles.quote, description: commonQuote },
  ],
}));

const specialistSelect = {
  slug: true,
  displayName: true,
  specialty: true,
  bio: true,
  aboutTitle: true,
  aboutDescription: true,
  specialtiesTitle: true,
  specialtiesItems: true,
  educationTitle: true,
  educationItems: true,
  responsibilitiesTitle: true,
  responsibilitiesItems: true,
  booksTitle: true,
  booksItems: true,
  quoteTitle: true,
  quote: true,
  profileSections: true,
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

  const databaseProfiles = rows.map(mapSpecialist);
  const databaseBySlug = new Map(databaseProfiles.map((profile) => [profile.slug, profile]));
  const fallbackSlugs = new Set(fallbackSpecialists.map((profile) => profile.slug));
  const preservedFallbacks = fallbackSpecialists.map((profile) => databaseBySlug.get(profile.slug) ?? profile);
  const additionalDatabaseProfiles = databaseProfiles.filter((profile) => !fallbackSlugs.has(profile.slug));
  return [...preservedFallbacks, ...additionalDatabaseProfiles];
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
