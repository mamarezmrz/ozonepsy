import { NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";

export async function GET() {
  try {
    const session = await getCurrentAdminSession();
    if (!session) {
      return NextResponse.json({ code: "UNAUTHORIZED", message: "نیاز به ورود مدیر است." }, { status: 401 });
    }

    return NextResponse.json({
      session: { ...session, expiresAt: session.expiresAt.toISOString() },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
