import { NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { createAdminCourseTag, deleteAdminCourseTag } from "@/lib/admin/course-tags";
import { adminCourseTagCreateSchema, adminCourseTagDeleteSchema } from "@/lib/admin/validation";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "courses.write");
    const input = adminCourseTagCreateSchema.parse(await request.json());
    return NextResponse.json({ ok: true, data: await createAdminCourseTag(session.userId, input.name), message: "تگ اضافه شد." }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "courses.write");
    const input = adminCourseTagDeleteSchema.parse(await request.json());
    const data = await deleteAdminCourseTag(session.userId, input.name);
    return NextResponse.json({ ok: true, data, message: "تگ حذف شد و از دوره‌های مرتبط برداشته شد." });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
