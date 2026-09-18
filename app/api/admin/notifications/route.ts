import { NextResponse } from "next/server";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { listAdminNotifications } from "@/lib/admin/notifications";

export async function GET() {
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "dashboard.view");
    return NextResponse.json({ ok: true, data: await listAdminNotifications() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
