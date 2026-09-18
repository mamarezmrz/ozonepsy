import { NextResponse } from "next/server";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { parseAdminListQuery } from "@/lib/admin/query";
import { listAdminReviews, type AdminReviewStatus } from "@/lib/admin/reviews";
import { ReviewStatus } from "@/lib/generated/prisma/enums";

export async function GET(request: Request) {
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "reviews.read"); const url = new URL(request.url); const query = parseAdminListQuery(url.searchParams, ["createdAt", "status", "rating"]); const value = url.searchParams.get("status"); const status = value === "USER_DELETED" ? "USER_DELETED" : value && Object.values(ReviewStatus).includes(value as ReviewStatus) ? value as ReviewStatus : undefined; return NextResponse.json({ ok: true, data: await listAdminReviews(query, status as AdminReviewStatus | undefined) }); }
  catch (error) { return adminErrorResponse(error); }
}
