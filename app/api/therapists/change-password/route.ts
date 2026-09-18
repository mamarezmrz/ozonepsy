import { changeTherapistPassword, TherapistAuthenticationError, TherapistAuthorizationError } from "@/lib/auth/therapist";
import { AuthInputError, parseTherapistPasswordChangeInput } from "@/lib/auth/validation";
import { hasSameOrigin } from "@/lib/security/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return Response.json({ ok: false, error: "درخواست معتبر نیست." }, { status: 403 });
  try {
    const input = parseTherapistPasswordChangeInput(await request.json());
    await changeTherapistPassword(input.currentPassword, input.newPassword);
    return Response.json({ ok: true, message: "رمز عبور با موفقیت تغییر کرد." });
  } catch (error) {
    if (error instanceof AuthInputError) return Response.json({ ok: false, error: error.message }, { status: 400 });
    if (error instanceof TherapistAuthenticationError) return Response.json({ ok: false, error: error.message }, { status: 401 });
    if (error instanceof TherapistAuthorizationError) return Response.json({ ok: false, error: error.message }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
    console.error("[therapist.auth.password] unexpected error", error);
    return Response.json({ ok: false, error: "در حال حاضر امکان تغییر رمز وجود ندارد." }, { status: 500 });
  }
}
