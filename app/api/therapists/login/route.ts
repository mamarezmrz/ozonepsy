import { setTherapistSessionCookie } from "@/lib/auth/session";
import { loginTherapist, TherapistAuthenticationError } from "@/lib/auth/therapist";
import { AuthInputError, parseLoginInput } from "@/lib/auth/validation";
import { AuthRateLimitError } from "@/lib/auth/rate-limit";
import { getRequestMetadata, hasSameOrigin } from "@/lib/security/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return Response.json({ ok: false, error: "درخواست معتبر نیست." }, { status: 403 });
  try {
    const input = parseLoginInput(await request.json());
    const result = await loginTherapist(input.email, input.password, getRequestMetadata(request));
    await setTherapistSessionCookie(result.token);
    return Response.json({ ok: true, mustChangePassword: result.mustChangePassword, message: result.mustChangePassword ? "برای ادامه رمز موقت خود را تغییر دهید." : "ورود شما با موفقیت انجام شد." });
  } catch (error) {
    if (error instanceof AuthInputError) return Response.json({ ok: false, error: error.message }, { status: 400 });
    if (error instanceof TherapistAuthenticationError) return Response.json({ ok: false, error: error.message }, { status: 401 });
    if (error instanceof AuthRateLimitError) return Response.json({ ok: false, error: error.message }, { status: 429 });
    console.error("[therapist.auth.login] unexpected error", error);
    return Response.json({ ok: false, error: "در حال حاضر امکان ورود وجود ندارد." }, { status: 500 });
  }
}
