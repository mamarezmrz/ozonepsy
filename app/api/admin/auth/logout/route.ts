import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/admin/security";
import { logoutAdmin } from "@/lib/admin/service";

export async function POST(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) {
    return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  }

  if (!hasSameOrigin(request)) {
    return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  }

  await logoutAdmin();
  return NextResponse.json({ ok: true });
}
