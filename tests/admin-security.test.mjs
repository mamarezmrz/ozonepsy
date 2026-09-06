import test from "node:test";
import assert from "node:assert/strict";
import { hasSameOrigin } from "../lib/admin/security.ts";
import { adminIndividualConsultationCasesSchema, adminIndividualConsultationTopicSchema, parseAdminLoginInput } from "../lib/admin/validation.ts";

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

test("admin login validation defaults remember-me to false and accepts the checked state", () => {
  assert.equal(parseAdminLoginInput({ email: "admin@example.com", password: "password" }).rememberMe, false);
  assert.equal(parseAdminLoginInput({ email: "admin@example.com", password: "password", rememberMe: true }).rememberMe, true);
  assert.throws(() => parseAdminLoginInput({ email: "admin@example.com", password: "password", rememberMe: "on" }));
});

test("individual consultation card validation allows empty draft rows but rejects malformed slugs", () => {
  const sections = ["individual", "couples", "teenagers", "group-therapy"].map((pageKey) => ({ pageKey, title: "مشکلات", description: "توضیحات", enabled: true, cases: [] }));
  sections[0].cases = [{ title: "", slug: "" }, { title: "اضطراب", slug: "anxiety-disorders" }];
  const parsed = adminIndividualConsultationCasesSchema.parse({ sections });
  assert.equal(parsed.sections[0].cases.length, 2);
  sections[0].cases = [{ title: "اضطراب", slug: "Anxiety Disorders" }];
  assert.throws(() => adminIndividualConsultationCasesSchema.parse({ sections }));
  sections[0].cases = [{ id: "pending-anxiety-disorders", title: "اضطراب", slug: "anxiety-disorders" }];
  assert.equal(adminIndividualConsultationCasesSchema.parse({ sections }).sections[0].cases[0].id, "pending-anxiety-disorders");
});

test("individual consultation topic validation keeps content fields typed", () => {
  const parsed = adminIndividualConsultationTopicSchema.parse({ title: "عنوان", description: "توضیحات", introList: [], signsTitle: "نشانه‌ها", signs: ["یک مورد"], signsNote: "", why: "دلیل", whenToGetHelpTitle: "کمک", whenToGetHelp: [], whatHelps: [], approachTitle: "اُزون", approachParagraphs: [], approach: [], hideShortQuestions: true, shortQuestions: [], imageMode: "multiply", heroMediaId: null, heroImageRemoved: false });
  assert.deepEqual(parsed.signs, ["یک مورد"]);
  assert.equal(parsed.heroMediaId, null);
});
