import { NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/admin/security";
import { logoutAdmin } from "@/lib/admin/service";
import { adminErrorResponse } from "@/lib/admin/errors";

export async function POST(request: Request) {

  if (!hasSameOrigin(request)) {
    return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  }

  try {
    await logoutAdmin();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
