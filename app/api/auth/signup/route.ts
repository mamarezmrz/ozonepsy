import { setSessionCookie } from "@/lib/auth/session";
import { AuthConflictError, registerUser } from "@/lib/auth/service";
import { AuthInputError, parseRegisterInput } from "@/lib/auth/validation";
import { AuthRateLimitError } from "@/lib/auth/rate-limit";
import { getRequestMetadata, hasSameOrigin } from "@/lib/security/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return Response.json({ ok: false, error: "درخواست معتبر نیست." }, { status: 403 });
  }

  try {
    const input = parseRegisterInput(await request.json());
    const { token, headerUser } = await registerUser(input, getRequestMetadata(request));
    await setSessionCookie(token);

    return Response.json({ ok: true, message: "ثبت‌نام شما با موفقیت انجام شد.", user: headerUser });
  } catch (error) {
    if (error instanceof AuthInputError) {
      return Response.json({ ok: false, error: error.message }, { status: 400 });
    }
    if (error instanceof AuthConflictError) {
      return Response.json({ ok: false, error: error.message }, { status: 409 });
    }
    if (error instanceof AuthRateLimitError) {
      return Response.json({ ok: false, error: error.message }, { status: 429 });
    }

    return Response.json({ ok: false, error: "در حال حاضر امکان ثبت‌نام وجود ندارد." }, { status: 500 });
  }
}
