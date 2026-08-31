import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { adminCategoryStatusSchema } from "@/lib/admin/validation";
import { setAdminCategoryStatus } from "@/lib/admin/categories";
import { CategoryStatus } from "@/lib/generated/prisma/enums";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 }); if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 }); try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "categories.write"); const input = adminCategoryStatusSchema.parse(await request.json()); return NextResponse.json({ ok: true, data: await setAdminCategoryStatus(session.userId, (await params).id, input.status as CategoryStatus, input.reason) }); } catch (error) { return adminErrorResponse(error); } }
