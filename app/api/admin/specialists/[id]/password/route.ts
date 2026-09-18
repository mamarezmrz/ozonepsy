import { NextResponse } from "next/server";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { resetAdminSpecialistPassword } from "@/lib/admin/specialists";
import { adminSpecialistPasswordSchema } from "@/lib/admin/validation";
import { hasSameOrigin } from "@/lib/admin/security";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "instructors.write");
    const input = adminSpecialistPasswordSchema.parse(await request.json());
    await resetAdminSpecialistPassword(session.userId, (await params).id, input.password, input.reason, session);
    return NextResponse.json({ ok: true, message: "رمز متخصص تنظیم شد و نشست‌های قبلی بسته شدند." });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
