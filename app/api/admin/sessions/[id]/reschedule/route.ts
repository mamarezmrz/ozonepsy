import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { rescheduleAdminAppointment } from "@/lib/admin/appointments";
import { adminAppointmentRescheduleSchema } from "@/lib/admin/validation";
import { hasSameOrigin } from "@/lib/admin/security";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "sessions.manage"); const input = adminAppointmentRescheduleSchema.parse(await request.json()); return NextResponse.json({ ok: true, data: await rescheduleAdminAppointment(session.userId, (await params).id, input.startsAt, input.endsAt ?? null, input.reason, session) }); }
  catch (error) { return adminErrorResponse(error); }
}
