import { NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { updateAdminPublicUser } from "@/lib/admin/users";
import { adminPublicUserUpdateSchema } from "@/lib/admin/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "users.update");
    const { id } = await params;
    const input = adminPublicUserUpdateSchema.parse(await request.json());
    const data = await updateAdminPublicUser(session.userId, id, input);
    return NextResponse.json({ ok: true, message: "اطلاعات کاربر به‌روزرسانی شد.", data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
