import { redirect } from "next/navigation";
import type { AdminPermissionKey } from "@/lib/admin/constants";
import { hasAdminPermission } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";

export async function requireAdminPagePermission(permission: AdminPermissionKey) {
  const session = await requireAdminSession();
  if (!hasAdminPermission(session, permission)) redirect("/forbidden");
  return session;
}

