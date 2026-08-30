import test from "node:test";
import assert from "node:assert/strict";
import {
  AdminAuthorizationError,
  canManageAdminTarget,
  canManageAdmins,
  hasAdminPermission,
  hasAdminRole,
  requireAdminPermissionFromSession,
  requireAdminRoleFromSession,
} from "../lib/admin/authorization.ts";

const superAdmin = {
  roles: ["SUPER_ADMIN"],
  permissions: ["admins.manage", "dashboard.view"],
};

const admin = {
  roles: ["ADMIN"],
  permissions: ["dashboard.view", "users.read"],
};

test("admin authorization accepts granted roles and permissions", () => {
  assert.equal(hasAdminRole(superAdmin, "SUPER_ADMIN"), true);
  assert.equal(hasAdminPermission(superAdmin, "admins.manage"), true);
  assert.equal(canManageAdmins(superAdmin), true);
  assert.equal(canManageAdmins(admin), false);
});

test("missing admin session is unauthorized and missing permission is forbidden", () => {
  assert.throws(
    () => requireAdminPermissionFromSession(null, "dashboard.view"),
    (error) => error instanceof AdminAuthorizationError && error.code === "UNAUTHORIZED",
  );

  assert.throws(
    () => requireAdminRoleFromSession(admin, "SUPER_ADMIN"),
    (error) => error instanceof AdminAuthorizationError && error.code === "FORBIDDEN",
  );
});

test("admin target protections do not allow escalation or last-super-admin removal", () => {
  assert.equal(canManageAdminTarget(superAdmin, { roles: ["ADMIN"] }), true);
  assert.equal(canManageAdminTarget(admin, { roles: ["SUPER_ADMIN"] }), false);
  assert.equal(canManageAdminTarget(superAdmin, { roles: ["SUPER_ADMIN"], isLastSuperAdmin: true }), false);
});
