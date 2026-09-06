import { NextResponse } from "next/server";
import { hasSameOrigin, getRequestMetadata } from "@/lib/security/request";
import { AuthRateLimitError } from "@/lib/auth/rate-limit";
import { passwordResetDevTokenEnabled, requestPasswordReset } from "@/lib/auth/recovery";
import { sendPasswordResetEmail } from "@/lib/auth/email";

export const runtime = "nodejs";

const genericMessage = "اگر حسابی با این ایمیل وجود داشته باشد، راهنمای بازیابی برای شما ارسال می‌شود.";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "درخواست معتبر نیست." }, { status: 403 });
  }

  try {
    const body = await request.json() as { email?: unknown };
    if (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
      return NextResponse.json({ ok: false, error: "ایمیل واردشده معتبر نیست." }, { status: 400 });
    }

    const metadata = getRequestMetadata(request);
    const result = await requestPasswordReset(body.email, metadata.ipAddress ?? "unknown");
    if (result.token && process.env.EMAIL_PROVIDER) {
      await sendPasswordResetEmail(body.email.trim().toLowerCase(), result.token, process.env.PUBLIC_SITE_URL ?? new URL(request.url).origin);
    }

    return NextResponse.json({
      ok: true,
      message: genericMessage,
      ...(passwordResetDevTokenEnabled() && result.token ? { devToken: result.token } : {}),
    }, { status: 202 });
  } catch (error) {
    if (error instanceof AuthRateLimitError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 429 });
    }
    return NextResponse.json({ ok: false, error: "در حال حاضر امکان ارسال درخواست وجود ندارد." }, { status: 500 });
  }
}
