import { ADMIN_ROLES, type AdminPermissionKey, type AdminRole } from "./constants.ts";

export type AdminAuthorizationView = {
  roles: AdminRole[];
  permissions: string[];
};

export class AdminAuthorizationError extends Error {
  public readonly code: "UNAUTHORIZED" | "FORBIDDEN";

  constructor(code: "UNAUTHORIZED" | "FORBIDDEN") {
    super(code);
    this.code = code;
  }
}

export function isAdminRole(role: string): role is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

export function hasAdminPermission(session: AdminAuthorizationView, permission: AdminPermissionKey | string) {
  return session.permissions.includes(permission);
}

export function hasAdminRole(session: AdminAuthorizationView, role: AdminRole) {
  return session.roles.includes(role);
}

export function requireAdminRoleFromSession(session: AdminAuthorizationView | null, role: AdminRole) {
  if (!session) throw new AdminAuthorizationError("UNAUTHORIZED");
  if (!hasAdminRole(session, role)) throw new AdminAuthorizationError("FORBIDDEN");
  return session;
}

export function canManageAdmins(session: AdminAuthorizationView) {
  return hasAdminRole(session, "SUPER_ADMIN") && hasAdminPermission(session, "admins.manage");
}

export function canManageAdminTarget(
  actor: AdminAuthorizationView,
  target: { roles: string[]; isLastSuperAdmin?: boolean },
) {
  if (!canManageAdmins(actor)) return false;
  if (target.roles.includes("SUPER_ADMIN") && !hasAdminRole(actor, "SUPER_ADMIN")) return false;
  if (target.isLastSuperAdmin && target.roles.includes("SUPER_ADMIN")) return false;
  return true;
}

export function requireAdminPermissionFromSession(session: AdminAuthorizationView | null, permission: AdminPermissionKey | string) {
  if (!session) throw new AdminAuthorizationError("UNAUTHORIZED");
  if (!hasAdminPermission(session, permission)) throw new AdminAuthorizationError("FORBIDDEN");
  return session;
}
