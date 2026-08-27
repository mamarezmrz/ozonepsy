import { setSessionCookie } from "@/lib/auth/session";
import { InvalidCredentialsError, loginUser } from "@/lib/auth/service";
import { AuthInputError, parseLoginInput } from "@/lib/auth/validation";

export const runtime = "nodejs";

function requestMetadata(request: Request) {
  return {
    userAgent: request.headers.get("user-agent") ?? undefined,
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? undefined,
  };
}

export async function POST(request: Request) {
  try {
    const input = parseLoginInput(await request.json());
    const { token, headerUser } = await loginUser(input.email, input.password, requestMetadata(request));
    await setSessionCookie(token);

    return Response.json({ ok: true, message: "ورود شما با موفقیت انجام شد.", user: headerUser });
  } catch (error) {
    if (error instanceof AuthInputError) {
      return Response.json({ ok: false, error: error.message }, { status: 400 });
    }
    if (error instanceof InvalidCredentialsError) {
      return Response.json({ ok: false, error: error.message }, { status: 401 });
    }

    return Response.json({ ok: false, error: "در حال حاضر امکان ورود وجود ندارد." }, { status: 500 });
  }
}
