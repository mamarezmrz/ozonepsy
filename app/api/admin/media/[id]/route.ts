import { NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/security/request";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { archiveAdminMedia, getAdminMedia } from "@/lib/admin/media";
import { adminMediaArchiveSchema } from "@/lib/admin/validation";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "media.read"); return NextResponse.json({ ok: true, data: await getAdminMedia((await params).id, session) }); } catch (error) { return adminErrorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "media.write"); const input = adminMediaArchiveSchema.parse(await request.json()); return NextResponse.json({ ok: true, data: await archiveAdminMedia(session, (await params).id, input.reason) }); } catch (error) { return adminErrorResponse(error); }
}
