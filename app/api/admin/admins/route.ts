import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { parseAdminListQuery } from "@/lib/admin/query";
import { adminInviteSchema } from "@/lib/admin/validation";
import { createAdminInvite, listAdminUsers } from "@/lib/admin/admins";

function hostGuard(request: Request) {
  return isAdminHost(request.headers.get("host"));
}

export async function GET(request: Request) {
  if (!hostGuard(request)) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "admins.manage");
    const url = new URL(request.url);
    const query = parseAdminListQuery(url.searchParams, ["createdAt", "email", "status"]);
    return NextResponse.json({ ok: true, data: await listAdminUsers(query, session) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!hostGuard(request)) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "admins.manage");
    const invite = await createAdminInvite(session, adminInviteSchema.parse(await request.json()));
    return NextResponse.json({ ok: true, message: "دعوت‌نامه ساخته شد.", data: invite }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
