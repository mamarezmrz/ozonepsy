import { NextResponse } from "next/server";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";

export async function GET() {
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "dashboard.view");

    return NextResponse.json({
      identity: {
        id: session.userId,
        email: session.email,
        displayName: session.displayName,
        roles: session.roles,
      },
      permissions: session.permissions,
    });
  } catch (error) {
    const code = error instanceof Error && "code" in error ? error.code : "INTERNAL_ERROR";
    const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ code, message: status === 500 ? "خطایی رخ داد." : "دسترسی مجاز نیست." }, { status });
  }
}
