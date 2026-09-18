import { NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { setAdminPublicUserPassword } from "@/lib/admin/users";
import { adminPublicUserPasswordSchema } from "@/lib/admin/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "users.update");
    const { id } = await params;
    const input = adminPublicUserPasswordSchema.parse(await request.json());
    const data = await setAdminPublicUserPassword(session.userId, id, input.password, input.reason);
    return NextResponse.json({ ok: true, message: "رمز کاربر تغییر کرد و نشست‌های قبلی بسته شدند.", data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
