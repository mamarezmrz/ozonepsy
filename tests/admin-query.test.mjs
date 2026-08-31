import test from "node:test";
import assert from "node:assert/strict";
import { adminListQuerySchema, pageMeta, parseAdminListQuery, paginationOffset } from "../lib/admin/query.ts";

test("admin list query applies defaults and an allow-listed sort", () => {
  const query = parseAdminListQuery(new URLSearchParams("search=%D9%85%D8%B4%D8%A7%D9%88%D8%B1&pageSize=25&sort=unknown"), ["createdAt", "email"]);
  assert.equal(query.search, "مشاور");
  assert.equal(query.pageSize, 25);
  assert.equal(query.sort, "createdAt");
  assert.equal(query.direction, "desc");
});

test("admin list query rejects invalid pagination and caps page size", () => {
  assert.throws(() => adminListQuerySchema.parse({ page: 0 }), /Too small/);
  assert.throws(() => adminListQuerySchema.parse({ pageSize: 101 }), /Too big/);
});

test("pagination metadata and offset remain server-driven", () => {
  const query = adminListQuerySchema.parse({ page: 3, pageSize: 20 });
  assert.equal(paginationOffset(query), 40);
  assert.deepEqual(pageMeta(41, query), { page: 3, pageSize: 20, total: 41, pageCount: 3 });
});
