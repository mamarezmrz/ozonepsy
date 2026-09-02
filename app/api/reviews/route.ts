import { getCurrentUser } from "@/lib/auth/service";
import { getRequestMetadata, hasSameOrigin } from "@/lib/security/request";
import { reviewSubmissionSchema, ReviewServiceError, submitUserReview } from "@/lib/reviews";

export const runtime = "nodejs";

function errorResponse(error: ReviewServiceError) {
  const status = error.code === "NOT_FOUND" ? 404 : error.code === "CONFLICT" ? 409 : error.code === "RATE_LIMITED" ? 429 : 400;
  return Response.json({ ok: false, code: error.code, error: error.message }, { status });
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return Response.json({ ok: false, code: "FORBIDDEN", error: "درخواست معتبر نیست." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, code: "UNAUTHORIZED", error: "برای ثبت نظر ابتدا وارد حساب کاربری خود شوید." }, { status: 401 });
  }

  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 16_000) {
      return Response.json({ ok: false, code: "VALIDATION_ERROR", error: "اطلاعات ارسالی بیش از حد مجاز است." }, { status: 413 });
    }

    const input = reviewSubmissionSchema.parse(await request.json());
    if (input.website) {
      return Response.json({ ok: false, code: "VALIDATION_ERROR", error: "درخواست معتبر نیست." }, { status: 400 });
    }

    const review = await submitUserReview(user.id, input, getRequestMetadata(request));
    return Response.json({ ok: true, status: review.status, message: "نظر شما ثبت شد و پس از تأیید منتشر می‌شود." }, { status: 201 });
  } catch (error) {
    if (error instanceof ReviewServiceError) return errorResponse(error);
    if (error instanceof SyntaxError) return Response.json({ ok: false, code: "VALIDATION_ERROR", error: "اطلاعات ارسالی معتبر نیست." }, { status: 400 });
    if (typeof error === "object" && error !== null && "issues" in error) return Response.json({ ok: false, code: "VALIDATION_ERROR", error: "متن نظر را بررسی کنید." }, { status: 400 });
    return Response.json({ ok: false, code: "INTERNAL_ERROR", error: "در حال حاضر ثبت نظر امکان‌پذیر نیست." }, { status: 500 });
  }
}
