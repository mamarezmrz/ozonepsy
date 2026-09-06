import { getCurrentUser } from "@/lib/auth/service";
import { prisma } from "@/lib/prisma";
import { AuthRateLimitError, assertAuthRateLimit, recordAuthFailure } from "@/lib/auth/rate-limit";
import { getRequestMetadata, hasSameOrigin } from "@/lib/security/request";

export const runtime = "nodejs";

function normalizeDigits(value: string) {
  return value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return Response.json({ ok: false, error: "درخواست معتبر نیست." }, { status: 403 });
  try {
    const identifier = getRequestMetadata(request).ipAddress ?? "unknown";
    await assertAuthRateLimit("support-fund", identifier);
    const payload = await request.json() as { donorName?: unknown; amount?: unknown };
    const donorName = typeof payload.donorName === "string" ? payload.donorName.trim() : "";
    const amountText = typeof payload.amount === "string" || typeof payload.amount === "number" ? String(payload.amount) : "";
    const amount = Number(normalizeDigits(amountText));

    if (donorName.length > 200) {
      return Response.json({ ok: false, error: "نام واردشده بیش از حد طولانی است." }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount < 1 || amount > 1_000_000) {
      return Response.json({ ok: false, error: "مبلغ حمایت باید بین ۱ تا ۱٬۰۰۰٬۰۰۰ دلار باشد." }, { status: 400 });
    }

    await recordAuthFailure("support-fund", identifier);
    const user = await getCurrentUser();
    await prisma.supportContribution.create({
      data: {
        userId: user?.id,
        donorName: donorName || undefined,
        amountMinor: Math.round(amount * 100),
        currency: "USD",
      },
    });
    return Response.json({ ok: true, status: "PENDING", message: "درخواست حمایت شما ثبت شد و پس از اتصال به درگاه، ادامه پرداخت انجام می‌شود." });
  } catch (error) {
    if (error instanceof AuthRateLimitError) return Response.json({ ok: false, error: error.message }, { status: 429 });
    return Response.json({ ok: false, error: "در حال حاضر ثبت درخواست حمایت امکان‌پذیر نیست." }, { status: 500 });
  }
}
