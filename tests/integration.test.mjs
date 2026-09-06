import test from "node:test";
import assert from "node:assert/strict";

const baseUrl = process.env.INTEGRATION_BASE_URL?.replace(/\/$/, "");
const skipReason = "INTEGRATION_BASE_URL تنظیم نشده است؛ این suite به یک سرور و دیتابیس test-safe نیاز دارد.";

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", ...init });
  return { response, body: await response.text() };
}

function assertNotFound(result) {
  if (result.response.status === 404) return;
  assert.equal(result.response.status, 500);
  assert.match(result.body, /next-error[\s\S]*not-found|NEXT_HTTP_ERROR_FALLBACK;404/);
}

test("integration: published catalog and group detail use public database routes", { skip: !baseUrl ? skipReason : false }, async () => {
  const catalog = await request("/courses/life-skills-course");
  assert.equal(catalog.response.status, 200);
  assert.match(catalog.body, /life-skills-course|دوره/);

  const groupListing = await request("/group-therapy");
  assert.equal(groupListing.response.status, 200);

  const groupDetail = await request("/group-therapy/group-therapy");
  assert.equal(groupDetail.response.status, 200);
  assert.match(groupDetail.body, /خرید جلسه/);
  assert.match(groupDetail.body, /\/checkout\//);
});

test("integration: missing and legacy group records are not served from static data", { skip: !baseUrl ? skipReason : false }, async () => {
  const missingGroup = await request("/group-therapy/schema-therapy-1");
  assertNotFound(missingGroup);

  const missingCourse = await request("/courses/not-a-real-course");
  assertNotFound(missingCourse);
});

test("integration: anonymous protected data and cross-origin payment attempts are rejected", { skip: !baseUrl ? skipReason : false }, async () => {
  const dashboard = await request("/api/dashboard");
  assert.equal(dashboard.response.status, 401);

  const payment = await request("/api/payments/demo", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://attacker.example" },
    body: JSON.stringify({ productId: "group-therapy", email: "anonymous@example.com" }),
  });
  assert.ok([403, 404].includes(payment.response.status));
  if (payment.response.status === 403) {
    assert.match(payment.body, /FORBIDDEN/);
  } else {
    assert.match(payment.body, /NOT_FOUND|یافت نشد/);
  }
});
