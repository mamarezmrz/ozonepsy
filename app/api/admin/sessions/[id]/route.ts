import { NextResponse } from "next/server";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { getAdminAppointment } from "@/lib/admin/appointments";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "sessions.read"); return NextResponse.json({ ok: true, data: await getAdminAppointment((await params).id, session) }); }
  catch (error) { return adminErrorResponse(error); }
}
