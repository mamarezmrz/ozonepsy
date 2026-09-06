import { NextResponse } from "next/server";
import { getRequestMetadata, hasSameOrigin } from "@/lib/security/request";
import { AuthRateLimitError, assertAuthRateLimit, clearAuthFailures, recordAuthFailure } from "@/lib/auth/rate-limit";
import { PasswordResetError, resetPassword } from "@/lib/auth/recovery";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "درخواست معتبر نیست." }, { status: 403 });
  }

  const ipAddress = getRequestMetadata(request).ipAddress ?? "unknown";

  try {
    const body = await request.json() as { token?: unknown; password?: unknown; passwordConfirmation?: unknown };
    if (typeof body.token !== "string" || body.token.trim().length < 20) {
      return NextResponse.json({ ok: false, error: "لینک بازیابی معتبر نیست." }, { status: 400 });
    }
    if (typeof body.password !== "string" || body.password.length < 12 || body.password.length > 128) {
      return NextResponse.json({ ok: false, error: "رمز ورود باید بین ۱۲ تا ۱۲۸ کاراکتر باشد." }, { status: 400 });
    }
    if (body.password !== body.passwordConfirmation) {
      return NextResponse.json({ ok: false, error: "رمز ورود و تکرار آن یکسان نیستند." }, { status: 400 });
    }

    await assertAuthRateLimit("password-reset-submit", ipAddress);
    await resetPassword(body.token, body.password);
    await clearAuthFailures("password-reset-submit", ipAddress);
    return NextResponse.json({ ok: true, message: "رمز ورود با موفقیت تغییر کرد." });
  } catch (error) {
    if (error instanceof AuthRateLimitError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 429 });
    }
    if (error instanceof PasswordResetError) {
      await recordAuthFailure("password-reset-submit", ipAddress);
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "در حال حاضر امکان تغییر رمز وجود ندارد." }, { status: 500 });
  }
}
