export type GroupTherapySession = {
  slug: string;
  title: string;
  image: string;
  description: string;
  detailDescription: string;
  mentor: string;
  duration: string;
  price: string;
  sessions: { title: string; date: string; time: string }[];
};

const defaultSessions = [
  { title: "جلسه ۱: مقدمه‌ای بر روانشناسی و سلامت روان", date: "۲۳ ژانویه ۲۰۲۶", time: "ساعت ۴ بعد از ظهر" },
  { title: "جلسه ۲: شناخت و مدیریت استرس", date: "۳۰ ژانویه ۲۰۲۶", time: "ساعت ۴ بعد از ظهر" },
  { title: "جلسه ۳: ارتباطات مؤثر و مهارت‌های اجتماعی", date: "۶ فوریه ۲۰۲۶", time: "ساعت ۴ بعد از ظهر" },
  { title: "جلسه ۴: خودآگاهی و رشد فردی", date: "۱۳ فوریه ۲۰۲۶", time: "ساعت ۴ بعد از ظهر" },
  { title: "جلسه ۵: تکنیک‌های حل مسئله", date: "۲۰ فوریه ۲۰۲۶", time: "ساعت ۴ بعد از ظهر" },
  { title: "جلسه ۶: کار با احساسات و هیجانات", date: "۲۷ فوریه ۲۰۲۶", time: "ساعت ۴ بعد از ظهر" },
];

const sharedDescription =
  "این دوره گروه درمانی روانشناسی به بررسی جنبه‌های مختلف سلامت روان می‌پردازد. در این برنامه، شرکت‌کنندگان با مفاهیمی چون مدیریت استرس، ارتباطات مؤثر و خودآگاهی آشنا می‌شوند. همچنین تکنیک‌های حل مسئله و کار با هیجانات به آن‌ها کمک می‌کند تا اعتماد به نفس خود را تقویت کرده و زمان خود را به بهترین شکل مدیریت کنند. این دوره فرصتی برای یادگیری کار گروهی و همکاری نیز فراهم می‌آورد و در نهایت به جمع‌بندی و ارزیابی نهایی می‌انجامد.";

export const groupTherapySessions: GroupTherapySession[] = [
  {
    slug: "schema-therapy-1",
    title: "آشنایی با طرح واره ۱",
    image: "image-20.png",
    description: "توضیح کوتاه مربوط به دوره",
    detailDescription: sharedDescription,
    mentor: "دکتر رضا مولودی",
    duration: "۱۰ جلسه",
    price: "179.9",
    sessions: defaultSessions,
  },
  {
    slug: "life-skills-group",
    title: "دوره‌ی مهارت‌های زندگی",
    image: "image-21.png",
    description: "تمرین مهارت‌های کاربردی در کنار گروه",
    detailDescription: sharedDescription,
    mentor: "دکتر رضا مولودی",
    duration: "۱۰ جلسه",
    price: "179.9",
    sessions: defaultSessions,
  },
  {
    slug: "psychology-and-health",
    title: "مقدمه‌ای بر روانشناسی و سلامت روان",
    image: "image-22.png",
    description: "شناخت بهتر خود و سلامت روان",
    detailDescription: sharedDescription,
    mentor: "دکتر رضا مولودی",
    duration: "۱۰ جلسه",
    price: "179.9",
    sessions: defaultSessions,
  },
  {
    slug: "effective-communication",
    title: "ارتباطات مؤثر و مهارت‌های اجتماعی",
    image: "image-20.png",
    description: "ساختن ارتباط‌های سالم‌تر و آگاهانه‌تر",
    detailDescription: sharedDescription,
    mentor: "دکتر رضا مولودی",
    duration: "۱۰ جلسه",
    price: "179.9",
    sessions: defaultSessions,
  },
];
