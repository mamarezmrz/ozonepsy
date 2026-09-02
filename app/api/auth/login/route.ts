import { setSessionCookie } from "@/lib/auth/session";
import { InvalidCredentialsError, loginUser } from "@/lib/auth/service";
import { AuthInputError, parseLoginInput } from "@/lib/auth/validation";
import { AuthRateLimitError } from "@/lib/auth/rate-limit";
import { getRequestMetadata, hasSameOrigin } from "@/lib/security/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return Response.json({ ok: false, error: "درخواست معتبر نیست." }, { status: 403 });
  }

  try {
    const input = parseLoginInput(await request.json());
    const { token, headerUser } = await loginUser(input.email, input.password, getRequestMetadata(request));
    await setSessionCookie(token);

    return Response.json({ ok: true, message: "ورود شما با موفقیت انجام شد.", user: headerUser });
  } catch (error) {
    if (error instanceof AuthInputError) {
      return Response.json({ ok: false, error: error.message }, { status: 400 });
    }
    if (error instanceof InvalidCredentialsError) {
      return Response.json({ ok: false, error: error.message }, { status: 401 });
    }
    if (error instanceof AuthRateLimitError) {
      return Response.json({ ok: false, error: error.message }, { status: 429 });
    }

    return Response.json({ ok: false, error: "در حال حاضر امکان ورود وجود ندارد." }, { status: 500 });
  }
}
