import { getCurrentUser } from "@/lib/auth/service";
import { countries } from "@/lib/countries";
import { prisma } from "@/lib/prisma";
import { AuthRateLimitError, assertAuthRateLimit, recordAuthFailure } from "@/lib/auth/rate-limit";
import { getRequestMetadata, hasSameOrigin } from "@/lib/security/request";

export const runtime = "nodejs";

function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return Response.json({ ok: false, error: "درخواست معتبر نیست." }, { status: 403 });
  try {
    const identifier = getRequestMetadata(request).ipAddress ?? "unknown";
    await assertAuthRateLimit("preconsultation", identifier);
    const payload = await request.json() as { country?: unknown; phone?: unknown; message?: unknown };
    const country = typeof payload.country === "string" ? payload.country.trim() : "";
    const phone = typeof payload.phone === "string" ? normalizeDigits(payload.phone).trim() : "";
    const message = typeof payload.message === "string" ? payload.message.trim() : "";

    if (!countries.includes(country as (typeof countries)[number])) {
      return Response.json({ ok: false, error: "کشور انتخاب‌شده معتبر نیست." }, { status: 400 });
    }
    if (!/^[+0-9()\s-]{7,40}$/.test(phone) || phone.replace(/\D/g, "").length < 7) {
      return Response.json({ ok: false, error: "شماره تماس معتبر نیست." }, { status: 400 });
    }
    if (message.length > 2000) {
      return Response.json({ ok: false, error: "توضیحات واردشده بیش از حد طولانی است." }, { status: 400 });
    }

    await recordAuthFailure("preconsultation", identifier);
    const user = await getCurrentUser();
    await prisma.preconsultationRequest.create({
      data: {
        userId: user?.id,
        country,
        phone,
        message: message || undefined,
      },
    });
    return Response.json({ ok: true, status: "PENDING", message: "درخواست پیش‌مشاوره شما با موفقیت ثبت شد." });
  } catch (error) {
    if (error instanceof AuthRateLimitError) return Response.json({ ok: false, error: error.message }, { status: 429 });
    return Response.json({ ok: false, error: "در حال حاضر ثبت درخواست امکان‌پذیر نیست." }, { status: 500 });
  }
}
