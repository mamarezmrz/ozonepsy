import { NextResponse } from "next/server";
import { loginAdmin, AdminAuthenticationError } from "@/lib/admin/service";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin, getRequestMetadata } from "@/lib/admin/security";
import { AdminValidationError, parseAdminLoginInput } from "@/lib/admin/validation";

function requestIsForAdminHost(request: Request) {
  return isAdminHost(request.headers.get("host"));
}

export async function POST(request: Request) {
  if (!requestIsForAdminHost(request)) {
    return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  }

  if (!hasSameOrigin(request)) {
    return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  }

  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ code: "VALIDATION_ERROR", message: "اطلاعات ورود معتبر نیست." }, { status: 400 });
    }

    const input = parseAdminLoginInput(payload);
    const result = await loginAdmin(input.email, input.password, getRequestMetadata(request));

    return NextResponse.json({
      ok: true,
      user: result.user,
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof AdminAuthenticationError) {
      const status = error.code === "RATE_LIMITED" ? 429 : 401;
      return NextResponse.json({ code: error.code, message: error.message }, { status });
    }

    if (error instanceof AdminValidationError) {
      return NextResponse.json({ code: "VALIDATION_ERROR", message: error.message }, { status: 400 });
    }

    console.error("[admin.auth.login] unexpected error", error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "خطای داخلی رخ داد. دوباره تلاش کنید." }, { status: 500 });
  }
}
