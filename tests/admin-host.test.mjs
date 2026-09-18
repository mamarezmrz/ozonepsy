import test from "node:test";
import assert from "node:assert/strict";
import { isAdminPath } from "../lib/admin/host.ts";

test("admin UI and API paths are identified by path", () => {
  assert.equal(isAdminPath("/admin"), true);
  assert.equal(isAdminPath("/admin/users"), true);
  assert.equal(isAdminPath("/api/admin"), true);
  assert.equal(isAdminPath("/api/admin/auth/login"), true);
});

test("public and therapist paths are not admin paths", () => {
  assert.equal(isAdminPath("/"), false);
  assert.equal(isAdminPath("/login"), false);
  assert.equal(isAdminPath("/therapists"), false);
  assert.equal(isAdminPath("/therapists/login"), false);
  assert.equal(isAdminPath("/api/auth/login"), false);
});
