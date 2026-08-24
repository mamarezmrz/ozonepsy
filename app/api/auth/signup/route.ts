import { setSessionCookie } from "@/lib/auth/session";
import { AuthConflictError, registerUser } from "@/lib/auth/service";
import { AuthInputError, parseRegisterInput } from "@/lib/auth/validation";

export const runtime = "nodejs";

function requestMetadata(request: Request) {
  return {
    userAgent: request.headers.get("user-agent") ?? undefined,
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? undefined,
  };
}

export async function POST(request: Request) {
  try {
    const input = parseRegisterInput(await request.json());
    const { token } = await registerUser(input, requestMetadata(request));
    await setSessionCookie(token);

    return Response.json({ ok: true, message: "ثبت‌نام شما با موفقیت انجام شد." });
  } catch (error) {
    if (error instanceof AuthInputError) {
      return Response.json({ ok: false, error: error.message }, { status: 400 });
    }
    if (error instanceof AuthConflictError) {
      return Response.json({ ok: false, error: error.message }, { status: 409 });
    }

    return Response.json({ ok: false, error: "در حال حاضر امکان ثبت‌نام وجود ندارد." }, { status: 500 });
  }
}
