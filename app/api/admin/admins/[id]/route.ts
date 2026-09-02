import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { adminRoleChangeSchema, adminStatusChangeSchema } from "@/lib/admin/validation";
import { changeAdminRole, getAdminUser, setAdminStatus } from "@/lib/admin/admins";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "admins.manage");
    return NextResponse.json({ ok: true, data: await getAdminUser((await params).id, session) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "admins.manage");
    const id = (await params).id;
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.role === "string") {
      const input = adminRoleChangeSchema.parse(body);
      return NextResponse.json({ ok: true, message: "نقش ادمین تغییر کرد.", data: await changeAdminRole(session, id, input.role, input.reason) });
    }
    const input = adminStatusChangeSchema.parse(body);
    return NextResponse.json({ ok: true, message: "وضعیت ادمین تغییر کرد.", data: await setAdminStatus(session, id, input.status, input.reason) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
