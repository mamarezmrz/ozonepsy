import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { getAdminSpecialist, updateAdminSpecialist, assignAdminSpecialistCourses } from "@/lib/admin/specialists";
import { adminSpecialistCoursesSchema, adminSpecialistSchema } from "@/lib/admin/validation";
import { hasSameOrigin } from "@/lib/admin/security";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "instructors.read"); return NextResponse.json({ ok: true, data: await getAdminSpecialist((await params).id, session) }); }
  catch (error) { return adminErrorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "instructors.write"); return NextResponse.json({ ok: true, data: await updateAdminSpecialist(session.userId, (await params).id, adminSpecialistSchema.parse(await request.json()), session) }); }
  catch (error) { return adminErrorResponse(error); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "instructors.write"); return NextResponse.json({ ok: true, data: await assignAdminSpecialistCourses(session.userId, (await params).id, adminSpecialistCoursesSchema.parse(await request.json()).courseIds, session) }); }
  catch (error) { return adminErrorResponse(error); }
}
