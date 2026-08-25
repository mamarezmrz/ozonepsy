import { getCurrentUser } from "@/lib/auth/service";
import { countries } from "@/lib/countries";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export async function POST(request: Request) {
  try {
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
  } catch {
    return Response.json({ ok: false, error: "در حال حاضر ثبت درخواست امکان‌پذیر نیست." }, { status: 500 });
  }
}
