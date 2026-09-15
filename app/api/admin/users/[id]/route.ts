import { NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { isAdminHost } from "@/lib/admin/host";
import { updateAdminPublicUser } from "@/lib/admin/users";
import { adminPublicUserUpdateSchema } from "@/lib/admin/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
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
