import test from "node:test";
import assert from "node:assert/strict";
import { isAdminHost, isAdminPath } from "../lib/admin/host.ts";

test("development admin host is recognized and public hosts are not", () => {
  const previous = process.env.ADMIN_HOST;
  delete process.env.ADMIN_HOST;

  try {
    assert.equal(isAdminHost("admin.localhost:3000"), true);
    assert.equal(isAdminHost("ADMIN.LOCALHOST:3000."), true);
    assert.equal(isAdminHost("localhost:3000"), false);
    assert.equal(isAdminHost("example.com"), false);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_HOST;
    else process.env.ADMIN_HOST = previous;
  }
});

test("admin paths are identified independently from host routing", () => {
  assert.equal(isAdminPath("/admin"), true);
  assert.equal(isAdminPath("/admin/users"), true);
  assert.equal(isAdminPath("/api/admin/auth/login"), true);
  assert.equal(isAdminPath("/dashboard"), false);
});
