import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { parseAdminListQuery } from "@/lib/admin/query";
import { adminCourseSchema } from "@/lib/admin/validation";
import { createAdminCourse, listAdminCourses } from "@/lib/admin/courses";
import { ProductStatus } from "@/lib/generated/prisma/enums";

export async function GET(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  try {
    const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "courses.read");
    const url = new URL(request.url); const query = parseAdminListQuery(url.searchParams, ["createdAt", "title", "status"]); const status = Object.values(ProductStatus).includes(url.searchParams.get("status") as ProductStatus) ? url.searchParams.get("status") as ProductStatus : undefined;
    return NextResponse.json({ ok: true, data: await listAdminCourses(query, status, session) });
  } catch (error) { return adminErrorResponse(error); }
}

export async function POST(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "courses.write"); const input = adminCourseSchema.parse(await request.json()); return NextResponse.json({ ok: true, message: "دوره ایجاد شد.", data: await createAdminCourse(session.userId, input) }, { status: 201 }); } catch (error) { return adminErrorResponse(error); }
}
