import { getCurrentUser } from "@/lib/auth/service";
import { getRequestMetadata, hasSameOrigin } from "@/lib/security/request";
import { hideUserReview, ReviewServiceError } from "@/lib/reviews";

export const runtime = "nodejs";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSameOrigin(request)) {
    return Response.json({ ok: false, code: "FORBIDDEN", error: "درخواست معتبر نیست." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, code: "UNAUTHORIZED", error: "برای ادامه وارد حساب کاربری خود شوید." }, { status: 401 });
  }

  try {
    const review = await hideUserReview(user.id, (await params).id, getRequestMetadata(request));
    return Response.json({ ok: true, status: review.status, message: "نظر از فهرست شما حذف شد." });
  } catch (error) {
    if (error instanceof ReviewServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "CONFLICT" ? 409 : 400;
      return Response.json({ ok: false, code: error.code, error: error.message }, { status });
    }
    return Response.json({ ok: false, code: "INTERNAL_ERROR", error: "در حال حاضر حذف نظر امکان‌پذیر نیست." }, { status: 500 });
  }
}
