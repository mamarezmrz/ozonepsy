import { ContentStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { defaultFaqs, defaultTestimonials, getDefaultFaqsForPage } from "@/lib/public/content-defaults";
import type { FaqPageKey } from "@/lib/public/faq-pages";

export type PublicContent = {
  faqs: Array<{ question: string; answer: string }>;
  testimonials: Array<{ name: string; avatar: string; text: string }>;
};

function sourceMode() { return process.env.PUBLIC_CONTENT_SOURCE?.trim().toLowerCase() || "auto"; }

export async function getPublicContent(pageKey: FaqPageKey = "home"): Promise<PublicContent> {
  const fallbackFaqs = pageKey === "home" ? [...defaultFaqs] : getDefaultFaqsForPage(pageKey);
  if (sourceMode() === "static") return { faqs: fallbackFaqs, testimonials: [...defaultTestimonials] };
  const [faqRows, testimonials] = await Promise.all([
    prisma.faq.findMany({ where: { pageKey }, orderBy: { sortOrder: "asc" }, select: { question: true, answer: true, status: true } }),
    prisma.testimonial.findMany({ where: { status: ContentStatus.PUBLISHED }, orderBy: { sortOrder: "asc" }, select: { name: true, body: true, avatarMediaId: true } }),
  ]);
  const pageHasManagedFaqs = faqRows.length > 0;
  const faqs = faqRows.filter((item) => item.status !== ContentStatus.ARCHIVED).map(({ question, answer }) => ({ question, answer }));
  const mappedTestimonials = testimonials.map((item, index) => ({ name: item.name, text: item.body, avatar: item.avatarMediaId ? `/api/media/${item.avatarMediaId}` : defaultTestimonials[index % defaultTestimonials.length]?.avatar ?? "profile-1.png" }));
  if (sourceMode() !== "database") {
    return {
      faqs: pageHasManagedFaqs ? faqs : fallbackFaqs,
      testimonials: mappedTestimonials.length ? mappedTestimonials : [...defaultTestimonials],
    };
  }
  return { faqs: pageHasManagedFaqs ? faqs : fallbackFaqs, testimonials: mappedTestimonials };
}
