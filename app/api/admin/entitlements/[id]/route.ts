import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { updateAdminEntitlementSessions } from "@/lib/admin/entitlements";
import { adminEntitlementSessionsSchema } from "@/lib/admin/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "sessions.manage");
    const input = adminEntitlementSessionsSchema.parse(await request.json());
    return NextResponse.json({ ok: true, data: await updateAdminEntitlementSessions(session.userId, (await params).id, input.totalSessions, input.reason), message: "تعداد جلسات با موفقیت ذخیره شد." });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
