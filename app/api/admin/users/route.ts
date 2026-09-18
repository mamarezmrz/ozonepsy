import { NextResponse } from "next/server";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { parseAdminListQuery } from "@/lib/admin/query";
import { listAdminUsers } from "@/lib/admin/users";
import { UserStatus } from "@/lib/generated/prisma/enums";
import { hasSameOrigin } from "@/lib/admin/security";
import { createAdminPublicUser } from "@/lib/admin/users";
import { adminPublicUserCreateSchema } from "@/lib/admin/validation";

export async function GET(request: Request) {
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "users.read");
    const url = new URL(request.url);
    const query = parseAdminListQuery(url.searchParams, ["createdAt", "email", "status"]);
    const statusValue = url.searchParams.get("status");
    const status = statusValue && Object.values(UserStatus).includes(statusValue as UserStatus) ? statusValue as UserStatus : undefined;
    return NextResponse.json({ ok: true, data: await listAdminUsers(query, status) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "users.update");
    const input = adminPublicUserCreateSchema.parse(await request.json());
    const data = await createAdminPublicUser(session.userId, input);
    return NextResponse.json({ ok: true, message: "کاربر جدید ایجاد شد.", data }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
