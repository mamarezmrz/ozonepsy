import { logoutCurrentUser } from "@/lib/auth/service";
import { getRequestMetadata, hasSameOrigin } from "@/lib/security/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return Response.json({ ok: false, error: "درخواست معتبر نیست." }, { status: 403 });
  await logoutCurrentUser(getRequestMetadata(request));
  return Response.json({ ok: true, message: "با موفقیت خارج شدید." });
}
