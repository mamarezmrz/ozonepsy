import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { parseAdminListQuery } from "@/lib/admin/query";
import { listAdminUsers } from "@/lib/admin/users";
import { UserStatus } from "@/lib/generated/prisma/enums";

export async function GET(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
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

