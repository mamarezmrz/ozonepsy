import { NextResponse } from "next/server";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { hasSameOrigin } from "@/lib/admin/security";
import { adminSpecialistPayoutSchema, createAdminSpecialistPayout } from "@/lib/admin/specialist-payouts";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSameOrigin(request)) return NextResponse.json({ ok: false, message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "instructors.write");
    const input = adminSpecialistPayoutSchema.parse(await request.json());
    await createAdminSpecialistPayout(session.userId, (await params).id, input, session);
    return NextResponse.json({ ok: true, message: "پرداخت متخصص ثبت شد." });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
