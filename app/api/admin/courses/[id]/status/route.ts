import { NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { adminStatusSchema } from "@/lib/admin/validation";
import { setAdminCourseStatus } from "@/lib/admin/courses";
import { ProductStatus } from "@/lib/generated/prisma/enums";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 }); try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "courses.publish"); const input = adminStatusSchema.parse(await request.json()); const { id } = await params; return NextResponse.json({ ok: true, message: "وضعیت دوره تغییر کرد.", data: await setAdminCourseStatus(session.userId, id, input.status as ProductStatus, input.reason, session) }); } catch (error) { return adminErrorResponse(error); } }
