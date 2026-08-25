export type InstitutionProfile = {
  slug: string;
  name: string;
  specialty: string;
  image: string;
  services: string[];
  history: string[];
  socialResponsibilities: string[];
  webinars: string[];
  quote: string;
};

const institutionQuote =
  "یک متن کوتاه از زبان درمانگر برای نشان دادن طرز فکر و نگرش ایشان به مسائل مربوط به روانشناسی و در کل به مسائل مختلف زندگی می‌تواند به درمانجو کمک کند تا قبل از برداشتن اولین قدم، بتواند حال و هوای فضای درمان و تا حدی درمانگر مربوطه را درک کند.";

const commonServices = [
  "روانشناسی",
  "مشاوره دارویی",
  "اختلالات و آسیب‌شناسی",
  "مراقبت‌های روانشناختی فرد و خانواده",
];

const commonHistory = [
  "فلوشیپ سلامت معنوی دانشگاه دنور-آمریکا",
  "تخصص روانپزشکی دانشگاه علوم پزشکی ایران",
  "پزشکی عمومی دانشگاه تهران",
];

const commonSocialResponsibilities = [
  "هیئت علمی بازنشسته دانشگاه علوم پزشکی ایران",
  "نایب‌رئیس کمیته سلامت روان ایران",
  "بنیان‌گذار برنامه‌های حمایت از سلامت روان در سیستم مراقبت اولیه بهداشتی ایران",
  "معاونت بهداشت و روان استانداری اصفهان",
];

const commonWebinars = [
  "وبینارهای سلامت روان برای خانواده‌ها",
  "کارگاه مهارت‌های ارتباطی و زندگی",
  "جلسات آموزشی پیشگیری و ارتقای سلامت روان",
  "دوره‌های آموزشی فرزندپروری",
];

export const institutionProfiles: InstitutionProfile[] = [
  {
    slug: "aseman",
    name: "مرکز مشاوره آسمان",
    specialty: "مشاوره و خدمات روانشناختی",
    image: "partner-2.png",
    services: commonServices,
    history: commonHistory,
    socialResponsibilities: commonSocialResponsibilities,
    webinars: commonWebinars,
    quote: institutionQuote,
  },
  {
    slug: "hamshahri",
    name: "مرکز مشاوره همشهری",
    specialty: "مرکز مشاوره و خدمات روانشناختی",
    image: "partner-1.png",
    services: commonServices,
    history: commonHistory,
    socialResponsibilities: commonSocialResponsibilities,
    webinars: commonWebinars,
    quote: institutionQuote,
  },
  {
    slug: "rah-e-no",
    name: "مرکز مشاوره راه نو",
    specialty: "مرکز روانشناسی و مشاوره",
    image: "partner-4.png",
    services: commonServices,
    history: commonHistory,
    socialResponsibilities: commonSocialResponsibilities,
    webinars: commonWebinars,
    quote: institutionQuote,
  },
  {
    slug: "khanvadeh",
    name: "مرکز مشاوره خانواده",
    specialty: "مرکز مشاوره خانواده و روابط",
    image: "partner-5.png",
    services: commonServices,
    history: commonHistory,
    socialResponsibilities: commonSocialResponsibilities,
    webinars: commonWebinars,
    quote: institutionQuote,
  },
  {
    slug: "ravanshenasi-aye",
    name: "مرکز روانشناسی آیه",
    specialty: "مرکز روانشناسی و مشاوره",
    image: "partner-3.jpg",
    services: commonServices,
    history: commonHistory,
    socialResponsibilities: commonSocialResponsibilities,
    webinars: commonWebinars,
    quote: institutionQuote,
  },
];
