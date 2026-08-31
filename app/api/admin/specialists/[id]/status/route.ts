import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { setAdminSpecialistStatus } from "@/lib/admin/specialists";
import { adminSpecialistStatusSchema } from "@/lib/admin/validation";
import { SpecialistStatus } from "@/lib/generated/prisma/enums";
import { hasSameOrigin } from "@/lib/admin/security";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "instructors.write"); const input = adminSpecialistStatusSchema.parse(await request.json()); return NextResponse.json({ ok: true, data: await setAdminSpecialistStatus(session.userId, (await params).id, input.status as SpecialistStatus, input.reason) }); }
  catch (error) { return adminErrorResponse(error); }
}
