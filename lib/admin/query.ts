import { z } from "zod";

const positiveInt = z.coerce.number().int().positive().max(100_000);

export const adminListQuerySchema = z.object({
  page: positiveInt.default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(160).default(""),
  sort: z.string().trim().max(80).default("createdAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export type AdminListQuery = z.infer<typeof adminListQuerySchema>;

export function parseAdminListQuery(value: URLSearchParams | Record<string, string | string[] | undefined>, allowedSorts: readonly string[]) {
  const source = value instanceof URLSearchParams
    ? Object.fromEntries(value.entries())
    : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, Array.isArray(item) ? item[0] : item]));
  const parsed = adminListQuerySchema.parse(source);
  return {
    ...parsed,
    sort: allowedSorts.includes(parsed.sort) ? parsed.sort : allowedSorts[0] ?? "createdAt",
  };
}

export function pageMeta(total: number, query: AdminListQuery) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    total,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export function paginationOffset(query: AdminListQuery) {
  return (query.page - 1) * query.pageSize;
}
