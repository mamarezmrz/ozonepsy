import test from "node:test";
import assert from "node:assert/strict";
import { isDemoPaymentEnabled } from "../lib/payments/demo-gate.ts";
import { sanitizeOriginalName, validateImageBytes } from "../lib/media/validation.ts";

test("demo payment gate is disabled in production and outside allow-list", () => {
  const previous = { node: process.env.NODE_ENV, enabled: process.env.DEMO_PAYMENT_ENABLED, allowed: process.env.DEMO_PAYMENT_ALLOWED_ENVIRONMENTS };
  try {
    process.env.NODE_ENV = "production"; process.env.DEMO_PAYMENT_ENABLED = "true";
    assert.equal(isDemoPaymentEnabled(), false);
    process.env.NODE_ENV = "development"; process.env.DEMO_PAYMENT_ALLOWED_ENVIRONMENTS = "test";
    assert.equal(isDemoPaymentEnabled(), false);
    process.env.DEMO_PAYMENT_ALLOWED_ENVIRONMENTS = "development,test";
    assert.equal(isDemoPaymentEnabled(), true);
  } finally {
    if (previous.node === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous.node;
    if (previous.enabled === undefined) delete process.env.DEMO_PAYMENT_ENABLED; else process.env.DEMO_PAYMENT_ENABLED = previous.enabled;
    if (previous.allowed === undefined) delete process.env.DEMO_PAYMENT_ALLOWED_ENVIRONMENTS; else process.env.DEMO_PAYMENT_ALLOWED_ENVIRONMENTS = previous.allowed;
  }
});

test("media validation checks signatures and sanitizes names", () => {
  assert.equal(validateImageBytes("image/png", new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])), "png");
  assert.throws(() => validateImageBytes("image/png", new Uint8Array([0, 1, 2])), /معتبر/);
  assert.equal(sanitizeOriginalName("../unsafe name?.png"), "unsafe-name-.png");
});
