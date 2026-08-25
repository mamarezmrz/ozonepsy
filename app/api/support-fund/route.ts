import { getCurrentUser } from "@/lib/auth/service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function normalizeDigits(value: string) {
  return value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

export async function POST(request: Request) {
  try {
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
  } catch {
    return Response.json({ ok: false, error: "در حال حاضر ثبت درخواست حمایت امکان‌پذیر نیست." }, { status: 500 });
  }
}
