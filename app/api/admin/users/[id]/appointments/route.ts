import { NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { isAdminHost } from "@/lib/admin/host";
import { scheduleAdminUserAppointment } from "@/lib/admin/entitlements";
import { adminUserAppointmentCreateSchema } from "@/lib/admin/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "sessions.manage");
    const input = adminUserAppointmentCreateSchema.parse(await request.json());
    const { id: userId } = await params;
    const data = await scheduleAdminUserAppointment(session.userId, userId, input.productId, input.startsAt, input.endsAt, input.meetingUrl, input.reason);
    return NextResponse.json({ ok: true, data, message: "جلسه برای کاربر ثبت شد." }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
