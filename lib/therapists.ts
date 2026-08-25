export type TherapistProfile = {
  slug: string;
  name: string;
  specialty: string;
  image: string;
  specialties: string[];
  education: string[];
  responsibilities: string[];
  books: string[];
  quote: string;
};

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

const commonQuote = "یک متن کوتاه از زبان درمانگر برای نشان دادن طرز فکر و نگرش ایشان به مسائل مربوط به روانشناسی و در کل به مسائل مختلف زندگی می‌تواند به درمانجو کمک کند تا قبل از برداشتن اولین قدم، بتواند حال و هوای فضای درمان و تا حدی درمانگر مربوطه را درک کند.";

export const therapistProfiles: TherapistProfile[] = [
  {
    slug: "reza-moloudi",
    name: "دکتر رضا مولودی",
    specialty: "کارشناس ارشد روانشناسی بالینی",
    image: "partner-11.jpg",
    specialties: commonSpecialties,
    education: commonEducation,
    responsibilities: commonResponsibilities,
    books: commonBooks,
    quote: commonQuote,
  },
  {
    slug: "sara-moloudi",
    name: "دکتر سارا مولودی",
    specialty: "کارشناس ارشد روانشناسی بالینی",
    image: "partner-7.jpg",
    specialties: commonSpecialties,
    education: commonEducation,
    responsibilities: commonResponsibilities,
    books: commonBooks,
    quote: commonQuote,
  },
  {
    slug: "ali-moloudi",
    name: "دکتر علی مولودی",
    specialty: "کارشناس ارشد روانشناسی بالینی",
    image: "partner-6.jpg",
    specialties: commonSpecialties,
    education: commonEducation,
    responsibilities: commonResponsibilities,
    books: commonBooks,
    quote: commonQuote,
  },
  {
    slug: "mohammad-moloudi",
    name: "دکتر محمد مولودی",
    specialty: "کارشناس ارشد روانشناسی بالینی",
    image: "partner-9.jpg",
    specialties: commonSpecialties,
    education: commonEducation,
    responsibilities: commonResponsibilities,
    books: commonBooks,
    quote: commonQuote,
  },
  {
    slug: "nazanin-moloudi",
    name: "دکتر نازنین مولودی",
    specialty: "کارشناس ارشد روانشناسی بالینی",
    image: "partner-10.jpg",
    specialties: commonSpecialties,
    education: commonEducation,
    responsibilities: commonResponsibilities,
    books: commonBooks,
    quote: commonQuote,
  },
  {
    slug: "amir-moloudi",
    name: "دکتر امیر مولودی",
    specialty: "کارشناس ارشد روانشناسی بالینی",
    image: "partner-11.jpg",
    specialties: commonSpecialties,
    education: commonEducation,
    responsibilities: commonResponsibilities,
    books: commonBooks,
    quote: commonQuote,
  },
];
