import { NextResponse } from "next/server";
import { ProductStatus, MediaStatus, MediaVisibility } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/service";
import { userHasCourseAccess } from "@/lib/course-access";
import { getMediaStorage } from "@/lib/media/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const { lessonId } = await params;
    const lesson = await prisma.courseLesson.findFirst({
      where: {
        id: lessonId,
        status: ProductStatus.PUBLISHED,
        module: {
          status: ProductStatus.PUBLISHED,
          courseProduct: { product: { status: ProductStatus.PUBLISHED, kind: "COURSE" } },
        },
      },
      select: {
        isPreview: true,
        media: { select: { storageKey: true, mimeType: true, originalName: true, status: true, visibility: true } },
        module: { select: { courseProduct: { select: { product: { select: { slug: true } } } } } },
      },
    });
    if (!lesson?.media || lesson.media.status !== MediaStatus.ACTIVE) return new NextResponse(null, { status: 404 });

    const user = await getCurrentUser();
    const isPublicPreview = lesson.isPreview && lesson.media.visibility === MediaVisibility.PUBLIC;
    const hasAccess = user ? await userHasCourseAccess(user.id, lesson.module.courseProduct.product.slug) : false;
    if (!isPublicPreview && !hasAccess) return new NextResponse(null, { status: 404 });

    const body = await getMediaStorage().get(lesson.media.storageKey);
    if (!body) return new NextResponse(null, { status: 404 });
    return new NextResponse(body as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": lesson.media.mimeType,
        "Content-Length": String(body.byteLength),
        "Content-Disposition": `inline; filename="${lesson.media.originalName.replace(/["\r\n]/g, "")}"`,
        "Cache-Control": isPublicPreview ? "public, max-age=3600, stale-while-revalidate=86400" : "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
