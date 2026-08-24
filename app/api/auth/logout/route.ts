import { logoutCurrentUser } from "@/lib/auth/service";

export const runtime = "nodejs";

export async function POST() {
  await logoutCurrentUser();
  return Response.json({ ok: true, message: "با موفقیت خارج شدید." });
}
