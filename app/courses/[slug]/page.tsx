import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CourseDetailPage } from "@/components/course-detail-page";
import { SiteFooter, SiteHeader } from "@/components/site-header-server";
import { getCurrentUser } from "@/lib/auth/service";
import { userHasCourseAccess } from "@/lib/course-access";
import { createPageMetadata } from "@/lib/seo";
import { getPublishedReviewsForProductSlug } from "@/lib/reviews";
import { getPublishedCourseBySlug } from "@/lib/public/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedCourseBySlug(slug);

  return product ? createPageMetadata(product.title, product.description) : createPageMetadata("جزئیات دوره");
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublishedCourseBySlug(slug);

  if (!product) {
    notFound();
  }

  const currentUser = await getCurrentUser();
  const hasCourseAccess = currentUser ? await userHasCourseAccess(currentUser.id, product.slug) : false;
  const reviews = await getPublishedReviewsForProductSlug(product.slug);

  return (
    <>
      <SiteHeader />
      <CourseDetailPage product={product} userEmail={currentUser?.email ?? "مهمان"} hasCourseAccess={hasCourseAccess} reviews={reviews} reviewProductSlug={product.slug} />
      <SiteFooter />
    </>
  );
}
