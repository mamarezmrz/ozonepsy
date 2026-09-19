import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { approveAdminSpecialistProfile, rejectAdminSpecialistProfile } from "@/lib/admin/specialists";
import { hasSameOrigin } from "@/lib/admin/security";

const approvalSchema = z.object({ action: z.enum(["approve", "reject"]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "instructors.write");
    const input = approvalSchema.parse(await request.json());
    const id = (await params).id;
    const data = input.action === "approve" ? await approveAdminSpecialistProfile(session.userId, id, session) : await rejectAdminSpecialistProfile(session.userId, id, session);
    return NextResponse.json({ ok: true, data, message: input.action === "approve" ? "تغییرات متخصص تأیید شد." : "تغییرات متخصص رد شد." });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
