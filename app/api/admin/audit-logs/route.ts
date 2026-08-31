import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { parseAdminListQuery } from "@/lib/admin/query";
import { listAdminAuditLogs } from "@/lib/admin/audit-viewer";
import { AuditResult } from "@/lib/generated/prisma/enums";

export async function GET(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "audit.read");
    const url = new URL(request.url);
    const query = parseAdminListQuery(url.searchParams, ["createdAt", "action"]);
    const parseDate = (value: string | null, endOfDay = false) => {
      if (!value) return undefined;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return undefined;
      if (endOfDay) parsed.setHours(23, 59, 59, 999);
      return parsed;
    };
    const resultValue = url.searchParams.get("result");
    const result = Object.values(AuditResult).includes(resultValue as AuditResult) ? resultValue as AuditResult : undefined;
    return NextResponse.json({ ok: true, data: await listAdminAuditLogs(query, { user: url.searchParams.get("user")?.trim() || undefined, result, from: parseDate(url.searchParams.get("from")), to: parseDate(url.searchParams.get("to"), true) }) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
