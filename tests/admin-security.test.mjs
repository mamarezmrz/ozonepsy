import test from "node:test";
import assert from "node:assert/strict";
import { hasSameOrigin } from "../lib/admin/security.ts";

function request(headers = {}) {
  return new Request("http://admin.localhost:3000/api/admin/test", {
    headers: { host: "admin.localhost:3000", ...headers },
  });
}

test("same-origin checks accept a matching origin and reject a foreign origin", () => {
  assert.equal(hasSameOrigin(request({ origin: "http://admin.localhost:3000" })), true);
  assert.equal(hasSameOrigin(request({ origin: "http://localhost:3000" })), false);
});

test("same-origin checks fall back to referer when Origin is absent", () => {
  assert.equal(hasSameOrigin(request({ referer: "http://admin.localhost:3000/admin/users" })), true);
  assert.equal(hasSameOrigin(request({ referer: "http://evil.example/admin/users" })), false);
  assert.equal(hasSameOrigin(request()), false);
});
