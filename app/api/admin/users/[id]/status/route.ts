import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { updateAdminUserStatus } from "@/lib/admin/users";
import { UserStatus } from "@/lib/generated/prisma/enums";
import { z } from "zod";

const userStatusSchema = z.object({
  status: z.enum([UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.ARCHIVED]),
  reason: z.string().trim().min(1, "دلیل تغییر وضعیت الزامی است.").max(1000),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "users.suspend");
    const { id } = await params;
    const body = userStatusSchema.parse(await request.json());
    const data = await updateAdminUserStatus(id, session.userId, body.status as UserStatus, body.reason);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
