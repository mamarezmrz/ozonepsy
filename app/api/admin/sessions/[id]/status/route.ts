import { NextResponse } from "next/server";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { transitionAdminAppointment } from "@/lib/admin/appointments";
import { adminAppointmentStatusSchema } from "@/lib/admin/validation";
import { AppointmentStatus } from "@/lib/generated/prisma/enums";
import { hasSameOrigin } from "@/lib/admin/security";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "sessions.manage"); const input = adminAppointmentStatusSchema.parse(await request.json()); return NextResponse.json({ ok: true, data: await transitionAdminAppointment(session.userId, (await params).id, input.status as AppointmentStatus, input.reason, session) }); }
  catch (error) { return adminErrorResponse(error); }
}
