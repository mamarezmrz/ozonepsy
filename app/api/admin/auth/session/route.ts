import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { getCurrentAdminSession } from "@/lib/admin/session";

export async function GET(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) {
    return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  }

  const session = await getCurrentAdminSession();
  if (!session) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "نیاز به ورود مدیر است." }, { status: 401 });
  }

  return NextResponse.json({
    session: { ...session, expiresAt: session.expiresAt.toISOString() },
  });
}
