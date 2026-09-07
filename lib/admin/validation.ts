import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().email("ایمیل معتبر نیست.").max(320),
  password: z.string().min(1, "رمز ورود را وارد کنید.").max(200),
  rememberMe: z.boolean().default(false),
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

const optionalCourseMediaId = z.preprocess((value) => value === "" ? null : value, z.string().uuid().nullable().optional());
const optionalCourseDuration = z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().min(0).max(86400).nullable().optional());

export const adminCourseCreateSchema = adminCourseSchema.extend({
  coverMediaId: optionalCourseMediaId,
  coverImageMode: z.enum(["BRANDED", "PLAIN"]).default("BRANDED"),
  categorySlugs: z.array(z.string().trim().min(1).max(120)).max(4).default([]),
  instructorName: z.string().trim().max(200).default(""),
  durationSessions: z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().positive().nullable().optional()),
  demoMediaId: optionalCourseMediaId,
  demoVideoDuration: optionalCourseDuration,
  sessions: z.array(z.object({ title: z.string().trim().min(1).max(240), videoMediaId: optionalCourseMediaId, videoDuration: optionalCourseDuration })).max(100).default([]),
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

export const adminEntitlementSessionsSchema = z.object({
  totalSessions: z.coerce.number().int().min(0),
  reason: z.string().trim().min(1, "دلیل تغییر تعداد جلسات را وارد کنید.").max(1000),
});

export const adminAppointmentCreateSchema = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.preprocess((value) => value === "" || value === undefined ? null : value, z.coerce.date().nullable()),
  meetingUrl: z.preprocess((value) => value === "" || value === undefined ? null : value, z.string().trim().url("لینک جلسه معتبر نیست.").max(2000).nullable()),
  reason: z.preprocess((value) => value === "" || value === undefined ? undefined : value, z.string().trim().max(1000).optional()),
}).refine((value) => !value.endsAt || value.endsAt > value.startsAt, { message: "زمان پایان باید بعد از زمان شروع باشد.", path: ["endsAt"] })
  .refine((value) => {
    if (!value.meetingUrl) return true;
    try { return ["http:", "https:"].includes(new URL(value.meetingUrl).protocol); } catch { return false; }
  }, { message: "لینک جلسه باید با http یا https شروع شود.", path: ["meetingUrl"] });

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

const adminConsultationBenefitRowSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().max(240),
  description: z.string().trim().max(4000),
});

export const adminConsultationBenefitsSchema = z.object({
  sections: z.array(z.object({
    pageKey: z.enum(["individual", "couples", "teenagers", "group-therapy"]),
    enabled: z.boolean(),
    benefits: z.array(adminConsultationBenefitRowSchema).max(50),
  })).length(4).superRefine((sections, context) => {
    const keys = sections.map((section) => section.pageKey);
    if (new Set(keys).size !== keys.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["sections"], message: "هر حوزه فقط یک بار باید ارسال شود." });
    }
  }),
});

const adminIndividualConsultationCaseSchema = z.object({
  id: z.union([z.string().uuid(), z.string().regex(/^pending-[a-z0-9-]+$/i)]).optional(),
  title: z.string().trim().max(240),
  slug: z.string().trim().max(160).refine((value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), "اسلاگ صفحه معتبر نیست."),
});

export const adminIndividualConsultationCasesSchema = z.object({
  sections: z.array(z.object({
    pageKey: z.enum(["individual", "couples", "teenagers", "group-therapy"]),
    title: z.string().trim().max(240),
    description: z.string().trim().max(4000),
    enabled: z.boolean(),
    cases: z.array(adminIndividualConsultationCaseSchema).max(50),
  })).length(4).superRefine((sections, context) => {
    const keys = sections.map((section) => section.pageKey);
    if (new Set(keys).size !== keys.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ["sections"], message: "هر حوزه فقط یک بار باید ارسال شود." });
  }),
});

const adminTopicListSchema = z.array(z.string().trim().max(4000)).max(50);

export const adminIndividualConsultationTopicSchema = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().min(1).max(20000),
  introList: adminTopicListSchema,
  signsTitle: z.string().trim().max(240),
  signs: adminTopicListSchema,
  signsNote: z.string().trim().max(4000),
  why: z.string().trim().min(1).max(20000),
  whenToGetHelpTitle: z.string().trim().max(240),
  whenToGetHelp: adminTopicListSchema,
  whatHelps: adminTopicListSchema,
  approachTitle: z.string().trim().max(240),
  approachParagraphs: adminTopicListSchema,
  approach: adminTopicListSchema,
  hideShortQuestions: z.boolean(),
  shortQuestions: adminTopicListSchema,
  imageMode: z.enum(["multiply", "normal", "multiply-no-branding", "normal-no-branding"]),
  heroMediaId: z.string().uuid().nullable(),
  heroImageRemoved: z.boolean(),
});
