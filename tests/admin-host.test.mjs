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

test("production accepts only the explicitly configured admin host", () => {
  const previous = { node: process.env.NODE_ENV, admin: process.env.ADMIN_HOST, dev: process.env.ADMIN_DEV_HOST, publicDomain: process.env.RAILWAY_PUBLIC_DOMAIN, privateDomain: process.env.RAILWAY_PRIVATE_DOMAIN };
  try {
    process.env.NODE_ENV = "production";
    process.env.ADMIN_HOST = "admin.example.com";
    process.env.ADMIN_DEV_HOST = "admin.localhost:3000";
    process.env.RAILWAY_PUBLIC_DOMAIN = "ozonepsy-production.up.railway.app";
    process.env.RAILWAY_PRIVATE_DOMAIN = "easygoing-energy.railway.internal";
    assert.equal(isAdminHost("admin.example.com"), true);
    assert.equal(isAdminHost("admin.localhost:3000"), false);
    assert.equal(isAdminHost("example.com"), false);
  } finally {
    if (previous.node === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous.node;
    if (previous.admin === undefined) delete process.env.ADMIN_HOST; else process.env.ADMIN_HOST = previous.admin;
    if (previous.dev === undefined) delete process.env.ADMIN_DEV_HOST; else process.env.ADMIN_DEV_HOST = previous.dev;
    if (previous.publicDomain === undefined) delete process.env.RAILWAY_PUBLIC_DOMAIN; else process.env.RAILWAY_PUBLIC_DOMAIN = previous.publicDomain;
    if (previous.privateDomain === undefined) delete process.env.RAILWAY_PRIVATE_DOMAIN; else process.env.RAILWAY_PRIVATE_DOMAIN = previous.privateDomain;
  }
});

test("production accepts Railway public and private hosts when no dedicated admin host exists", () => {
  const previous = { node: process.env.NODE_ENV, admin: process.env.ADMIN_HOST, publicDomain: process.env.RAILWAY_PUBLIC_DOMAIN, privateDomain: process.env.RAILWAY_PRIVATE_DOMAIN };
  try {
    process.env.NODE_ENV = "production";
    delete process.env.ADMIN_HOST;
    process.env.RAILWAY_PUBLIC_DOMAIN = "ozonepsy-production.up.railway.app";
    process.env.RAILWAY_PRIVATE_DOMAIN = "easygoing-energy.railway.internal";
    assert.equal(isAdminHost("ozonepsy-production.up.railway.app"), true);
    assert.equal(isAdminHost("easygoing-energy.railway.internal"), true);
  } finally {
    if (previous.node === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous.node;
    if (previous.admin === undefined) delete process.env.ADMIN_HOST; else process.env.ADMIN_HOST = previous.admin;
    if (previous.publicDomain === undefined) delete process.env.RAILWAY_PUBLIC_DOMAIN; else process.env.RAILWAY_PUBLIC_DOMAIN = previous.publicDomain;
    if (previous.privateDomain === undefined) delete process.env.RAILWAY_PRIVATE_DOMAIN; else process.env.RAILWAY_PRIVATE_DOMAIN = previous.privateDomain;
  }
});
