import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { parseAdminListQuery } from "@/lib/admin/query";
import { listAdminAppointments } from "@/lib/admin/appointments";
import { AppointmentStatus } from "@/lib/generated/prisma/enums";

export async function GET(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "sessions.read"); const url = new URL(request.url); const query = parseAdminListQuery(url.searchParams, ["startsAt", "createdAt", "status"]); const statusValue = url.searchParams.get("status"); const status = statusValue && Object.values(AppointmentStatus).includes(statusValue as AppointmentStatus) ? statusValue as AppointmentStatus : undefined; const fromValue = url.searchParams.get("from"); const toValue = url.searchParams.get("to"); const from = fromValue ? new Date(fromValue) : undefined; const to = toValue ? new Date(toValue) : undefined; return NextResponse.json({ ok: true, data: await listAdminAppointments(query, { status, from: from && !Number.isNaN(from.getTime()) ? from : undefined, to: to && !Number.isNaN(to.getTime()) ? to : undefined }, session) }); }
  catch (error) { return adminErrorResponse(error); }
}
