import { ReviewStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { z } from "zod";

const REVIEW_WINDOW_MS = 15 * 60 * 1000;
const MAX_REVIEWS_PER_WINDOW = 3;

export const reviewSubmissionSchema = z.object({
  productSlug: z.string().trim().min(1, "صفحه‌ی نظر معتبر نیست.").max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "صفحه‌ی نظر معتبر نیست."),
  body: z.string().trim().min(10, "متن نظر باید حداقل ۱۰ کاراکتر باشد.").max(2000, "متن نظر نباید بیشتر از ۲۰۰۰ کاراکتر باشد."),
  website: z.string().trim().max(0, "درخواست معتبر نیست.").optional().default(""),
});

export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;

type ReviewMetadata = {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
};

export type PublicReview = {
  id: string;
  name: string;
  body: string;
  avatarUrl: string | null;
};

export type ReviewServiceCode = "NOT_FOUND" | "VALIDATION_ERROR" | "CONFLICT" | "RATE_LIMITED";

export class ReviewServiceError extends Error {
  constructor(public readonly code: ReviewServiceCode, message: string) {
    super(message);
    this.name = "ReviewServiceError";
  }
}

export async function getPublishedReviewsForProductSlug(productSlug: string, take = 6): Promise<PublicReview[]> {
  const product = await prisma.product.findUnique({
    where: { slug: productSlug },
    select: { id: true, status: true },
  });

  if (!product || product.status !== "PUBLISHED") return [];

  const reviews = await prisma.review.findMany({
    where: { productId: product.id, status: ReviewStatus.PUBLISHED },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      body: true,
      user: { select: { profile: { select: { displayName: true, avatarUrl: true } } } },
    },
  });

  return reviews.map((review) => ({
    id: review.id,
    name: review.user.profile?.displayName?.trim() || "همراه اُزون",
    body: review.body,
    avatarUrl: review.user.profile?.avatarUrl ?? null,
  }));
}

export async function submitUserReview(userId: string, input: ReviewSubmissionInput, metadata: ReviewMetadata = {}) {
  const product = await prisma.product.findUnique({
    where: { slug: input.productSlug },
    select: { id: true, status: true },
  });

  if (!product || product.status !== "PUBLISHED") {
    throw new ReviewServiceError("NOT_FOUND", "صفحه‌ی موردنظر برای ثبت نظر پیدا نشد.");
  }

  const windowStartedAt = new Date(Date.now() - REVIEW_WINDOW_MS);
  const [recentCount, duplicate] = await Promise.all([
    prisma.review.count({ where: { userId, createdAt: { gte: windowStartedAt } } }),
    prisma.review.findFirst({
      where: {
        userId,
        productId: product.id,
        body: input.body,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
    }),
  ]);

  if (recentCount >= MAX_REVIEWS_PER_WINDOW) {
    throw new ReviewServiceError("RATE_LIMITED", "تعداد ثبت نظر در این بازه بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.");
  }
  if (duplicate) {
    throw new ReviewServiceError("CONFLICT", "این نظر را قبلاً برای همین صفحه ثبت کرده‌اید.");
  }

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        userId,
        productId: product.id,
        body: input.body,
        status: ReviewStatus.PENDING,
      },
      select: { id: true, status: true, createdAt: true },
    });

    await recordAdminAuditWithClient(tx, {
      actorId: userId,
      action: "REVIEW_SUBMITTED",
      targetType: "REVIEW",
      targetId: review.id,
      afterState: { status: review.status, productId: product.id },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      requestId: metadata.requestId,
    });

    return review;
  });
}

export async function hideUserReview(userId: string, reviewId: string, metadata: ReviewMetadata = {}) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.review.findFirst({
      where: { id: reviewId, userId },
      select: { id: true, status: true, productId: true },
    });

    if (!before) throw new ReviewServiceError("NOT_FOUND", "نظر پیدا نشد.");
    if (before.status === ReviewStatus.HIDDEN) {
      const existingUserDeletion = await tx.adminAuditLog.findFirst({ where: { targetType: "REVIEW", targetId: reviewId, action: "REVIEW_HIDDEN_BY_USER" }, select: { id: true } });
      if (!existingUserDeletion) {
        await recordAdminAuditWithClient(tx, {
          actorId: userId,
          action: "REVIEW_HIDDEN_BY_USER",
          targetType: "REVIEW",
          targetId: reviewId,
          beforeState: before,
          afterState: before,
          reason: "کاربر نظر را از حساب کاربری خود حذف کرد.",
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          requestId: metadata.requestId,
        });
      }
      return before;
    }

    const changed = await tx.review.updateMany({
      where: { id: reviewId, userId, status: before.status },
      data: { status: ReviewStatus.HIDDEN },
    });
    if (changed.count !== 1) throw new ReviewServiceError("CONFLICT", "وضعیت نظر هم‌زمان تغییر کرده است.");

    const updated = await tx.review.findUniqueOrThrow({
      where: { id: reviewId },
      select: { id: true, status: true, productId: true },
    });

    await recordAdminAuditWithClient(tx, {
      actorId: userId,
      action: "REVIEW_HIDDEN_BY_USER",
      targetType: "REVIEW",
      targetId: reviewId,
      beforeState: before,
      afterState: updated,
      reason: "کاربر نظر را از حساب کاربری خود حذف کرد.",
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      requestId: metadata.requestId,
    });

    return updated;
  });
}
