import { getCurrentUser } from "@/lib/auth/service";
import { countries } from "@/lib/countries";
import { prisma } from "@/lib/prisma";
import { AuthRateLimitError, assertAuthRateLimit, recordAuthFailure } from "@/lib/auth/rate-limit";
import { getRequestMetadata, hasSameOrigin } from "@/lib/security/request";
import { AdminNotificationType } from "@/lib/generated/prisma/enums";
import { createAdminNotification } from "@/lib/admin/notifications";
import { sendAdminNotificationEmail } from "@/lib/auth/email";

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
    const payload = await request.json() as { fullName?: unknown; email?: unknown; country?: unknown; phone?: unknown; message?: unknown };
    const fullName = typeof payload.fullName === "string" ? payload.fullName.trim().replace(/\s+/g, " ") : "";
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const country = typeof payload.country === "string" ? payload.country.trim() : "";
    const phone = typeof payload.phone === "string" ? normalizeDigits(payload.phone).trim() : "";
    const message = typeof payload.message === "string" ? payload.message.trim() : "";

    if (!fullName || fullName.length > 200) {
      return Response.json({ ok: false, error: "نام و نام خانوادگی را کامل وارد کنید." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      return Response.json({ ok: false, error: "ایمیل معتبر نیست." }, { status: 400 });
    }
    if (!countries.includes(country as (typeof countries)[number])) {
      return Response.json({ ok: false, error: "کشور انتخاب‌شده معتبر نیست." }, { status: 400 });
    }
    if (!/^[+0-9()\s-]{7,40}$/.test(phone) || phone.replace(/\D/g, "").length < 7) {
      return Response.json({ ok: false, error: "شماره تماس معتبر نیست." }, { status: 400 });
    }
    if (!message || message.length > 2000) {
      return Response.json({ ok: false, error: message ? "توضیحات واردشده بیش از حد طولانی است." : "توضیحات را وارد کنید." }, { status: 400 });
    }

    await recordAuthFailure("preconsultation", identifier);
    const user = await getCurrentUser();
    const created = await prisma.preconsultationRequest.create({
      data: {
        userId: user?.id,
        fullName,
        email,
        country,
        phone,
        message,
      },
      select: { id: true, fullName: true, email: true, country: true, phone: true, message: true, createdAt: true },
    });
    await Promise.all([
      createAdminNotification({ type: AdminNotificationType.PRECONSULTATION_REQUEST, title: "درخواست پیش‌مشاوره جدید", description: `${created.fullName} یک درخواست پیش‌مشاوره ثبت کرده است.`, href: "/preconsultation-requests" }),
      sendAdminNotificationEmail({ subject: "درخواست پیش‌مشاوره جدید | اُزون", text: `درخواست جدیدی از ${created.fullName} ثبت شده است.\nایمیل: ${created.email}\nشماره تماس: ${created.phone}\nکشور: ${created.country}\nتوضیحات: ${created.message}` }),
    ]);
    return Response.json({ ok: true, status: "PENDING", message: "درخواست پیش‌مشاوره شما با موفقیت ثبت شد." });
  } catch (error) {
    if (error instanceof AuthRateLimitError) return Response.json({ ok: false, error: error.message }, { status: 429 });
    return Response.json({ ok: false, error: "در حال حاضر ثبت درخواست امکان‌پذیر نیست." }, { status: 500 });
  }
}
