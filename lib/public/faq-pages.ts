export const faqPageDefinitions = [
  { key: "home", label: "صفحه اصلی" },
  { key: "pricing", label: "قیمت‌گذاری و خرید" },
  { key: "courses", label: "دوره‌های روانشناسی" },
  { key: "contact", label: "تماس با ما" },
  { key: "support-fund", label: "صندوق حمایت" },
  { key: "free-session", label: "پیش‌مشاوره رایگان" },
  { key: "group-therapy", label: "گروه‌درمانی" },
  { key: "consultation-individual", label: "مشاوره فردی" },
  { key: "consultation-couples", label: "زوج‌درمانی" },
  { key: "consultation-teenagers", label: "کودک و نوجوان" },
  { key: "group-therapy-detail", label: "جزئیات گروه‌درمانی" },
  { key: "consultation-topic", label: "صفحات جزئیات مشاوره" },
] as const;

export type FaqPageKey = (typeof faqPageDefinitions)[number]["key"];

export function isFaqPageKey(value: string | null | undefined): value is FaqPageKey {
  return faqPageDefinitions.some((page) => page.key === value);
}
