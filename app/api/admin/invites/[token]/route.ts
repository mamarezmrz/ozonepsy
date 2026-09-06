import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin, getRequestMetadata } from "@/lib/admin/security";
import { adminErrorResponse } from "@/lib/admin/errors";
import { adminInviteAcceptSchema } from "@/lib/admin/validation";
import { acceptAdminInvite } from "@/lib/admin/admins";
import { createAdminSession } from "@/lib/admin/session";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const input = adminInviteAcceptSchema.parse(await request.json());
    const result = await acceptAdminInvite((await params).token, input.password, input.firstName, input.lastName);
    await createAdminSession(result.userId, getRequestMetadata(request));
    return NextResponse.json({ ok: true, message: "حساب ادمین ساخته شد و وارد پنل شدید." });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
