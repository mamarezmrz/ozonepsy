import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { parseAdminListQuery } from "@/lib/admin/query";
import { listAdminSpecialists, createAdminSpecialist } from "@/lib/admin/specialists";
import { adminSpecialistSchema } from "@/lib/admin/validation";
import { SpecialistStatus } from "@/lib/generated/prisma/enums";
import { hasSameOrigin } from "@/lib/admin/security";

export async function GET(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "instructors.read");
    const url = new URL(request.url);
    const query = parseAdminListQuery(url.searchParams, ["createdAt", "displayName", "status"]);
    const statusValue = url.searchParams.get("status");
    const status = statusValue && Object.values(SpecialistStatus).includes(statusValue as SpecialistStatus) ? statusValue as SpecialistStatus : undefined;
    return NextResponse.json({ ok: true, data: await listAdminSpecialists(query, status, session) });
  } catch (error) { return adminErrorResponse(error); }
}

export async function POST(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "instructors.write");
    const input = adminSpecialistSchema.parse(await request.json());
    return NextResponse.json({ ok: true, data: await createAdminSpecialist(session.userId, input) }, { status: 201 });
  } catch (error) { return adminErrorResponse(error); }
}
