import { ContentStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { defaultFaqs, defaultTestimonials } from "@/lib/public/content-defaults";

export type PublicContent = {
  faqs: Array<{ question: string; answer: string }>;
  testimonials: Array<{ name: string; avatar: string; text: string }>;
};

function sourceMode() { return process.env.PUBLIC_CONTENT_SOURCE?.trim().toLowerCase() || "auto"; }

export async function getPublicContent(): Promise<PublicContent> {
  if (sourceMode() === "static") return { faqs: [...defaultFaqs], testimonials: [...defaultTestimonials] };
  const [faqs, testimonials] = await Promise.all([
    prisma.faq.findMany({ where: { status: ContentStatus.PUBLISHED }, orderBy: { sortOrder: "asc" }, select: { question: true, answer: true } }),
    prisma.testimonial.findMany({ where: { status: ContentStatus.PUBLISHED }, orderBy: { sortOrder: "asc" }, select: { name: true, body: true, avatarMediaId: true } }),
  ]);
  const mappedTestimonials = testimonials.map((item) => ({ name: item.name, text: item.body, avatar: item.avatarMediaId ? `/api/media/${item.avatarMediaId}` : "profile-1.png" }));
  return { faqs, testimonials: mappedTestimonials };
}
