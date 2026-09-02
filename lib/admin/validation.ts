import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().email("ایمیل معتبر نیست.").max(320),
  password: z.string().min(1, "رمز ورود را وارد کنید.").max(200),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export class AdminValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminValidationError";
  }
}

export function parseAdminLoginInput(value: unknown) {
  const parsed = adminLoginSchema.safeParse(value);
  if (!parsed.success) {
    throw new AdminValidationError(parsed.error.issues[0]?.message ?? "اطلاعات ورود معتبر نیست.");
  }
  return parsed.data;
}

export const adminInviteSchema = z.object({
  email: z.string().trim().email("ایمیل معتبر نیست.").max(320),
  role: z.enum(["ADMIN", "CONTENT_MANAGER", "SUPPORT", "INSTRUCTOR", "SUPER_ADMIN"]),
  reason: z.string().trim().max(1000).optional(),
});

export const adminRoleChangeSchema = z.object({
  role: z.enum(["ADMIN", "CONTENT_MANAGER", "SUPPORT", "INSTRUCTOR", "SUPER_ADMIN"]),
  reason: z.string().trim().min(1, "دلیل تغییر نقش را وارد کنید.").max(1000),
});

export const adminStatusChangeSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  reason: z.string().trim().min(1, "دلیل تغییر وضعیت را وارد کنید.").max(1000),
});

export const adminInviteAcceptSchema = z.object({
  password: z.string().min(12, "رمز ورود باید حداقل ۱۲ کاراکتر باشد.").max(200),
  firstName: z.string().trim().max(100).default(""),
  lastName: z.string().trim().max(100).default(""),
});

export const adminCourseSchema = z.object({
  title: z.string().trim().min(1).max(240),
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "شناسه دوره معتبر نیست."),
  description: z.string().trim().min(1),
  priceMinor: z.coerce.number().int().min(0),
  currency: z.string().trim().length(3).default("USD"),
  categoryId: z.preprocess((value) => value === "" ? null : value, z.string().uuid().nullable().optional()),
  deliveryMode: z.enum(["RECORDED", "LIVE"]).default("RECORDED"),
  accessDays: z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().positive().nullable().optional()),
});

export const adminStatusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  reason: z.string().trim().min(1).max(1000),
});

export const adminModuleSchema = z.object({ title: z.string().trim().min(1).max(240), description: z.string().trim().max(4000).optional() });
export const adminLessonSchema = z.object({ title: z.string().trim().min(1).max(240), description: z.string().trim().max(4000).optional(), duration: z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().positive().nullable().optional()), isPreview: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()).default(false) });
export const adminReorderSchema = z.object({ ids: z.array(z.string().uuid()).min(1) });
export const adminCategorySchema = z.object({ slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), title: z.string().trim().min(1).max(200), description: z.string().trim().max(4000).optional() });
export const adminCategoryStatusSchema = z.object({ status: z.enum(["ACTIVE", "ARCHIVED"]), reason: z.string().trim().min(1).max(1000) });

export const adminSpecialistSchema = z.object({
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "شناسه متخصص معتبر نیست."),
  displayName: z.string().trim().min(1).max(200),
  specialty: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(10000).optional(),
  imageUrl: z.preprocess((value) => value === "" ? null : value, z.string().trim().url().max(1000).nullable().optional()),
  userId: z.preprocess((value) => value === "" ? null : value, z.string().uuid().nullable().optional()),
});

export const adminSpecialistStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
  reason: z.string().trim().min(1).max(1000),
});

export const adminSpecialistCoursesSchema = z.object({
  courseIds: z.array(z.string().uuid()).max(100),
});

export const adminAppointmentStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELED", "NO_SHOW", "RESCHEDULED"]),
  reason: z.string().trim().min(1).max(1000),
});

export const adminAppointmentRescheduleSchema = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().nullable().optional(),
  reason: z.string().trim().min(1).max(1000),
}).refine((value) => !value.endsAt || value.endsAt > value.startsAt, { message: "زمان پایان باید بعد از زمان شروع باشد.", path: ["endsAt"] });

export const adminReviewStatusSchema = z.object({
  status: z.enum(["PENDING", "PUBLISHED", "HIDDEN"]),
  reason: z.string().trim().max(1000).optional(),
}).superRefine((value, context) => {
  if (value.status === "PENDING" && !value.reason) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["reason"], message: "دلیل تغییر وضعیت نظر را وارد کنید." });
  }
});

export const adminFaqSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  answer: z.string().trim().min(1).max(10000),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
});

export const adminTestimonialSchema = z.object({
  name: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10000),
  avatarMediaId: z.string().uuid().nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
});

export const adminContentStatusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  reason: z.string().trim().min(1).max(1000),
});

export const adminMediaArchiveSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});
