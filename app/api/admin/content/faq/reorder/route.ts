import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/security/request";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { reorderAdminFaqs } from "@/lib/admin/content";
import { adminFaqReorderSchema } from "@/lib/admin/validation";

export async function POST(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });

  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "content.write");
    const input = adminFaqReorderSchema.parse(await request.json());
    const data = await reorderAdminFaqs(session, input.pageKey, input.ids);
    return NextResponse.json({ ok: true, message: "ترتیب سوال‌ها ذخیره شد.", data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
