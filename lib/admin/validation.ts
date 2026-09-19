import { z } from "zod";
import { countries } from "../countries.ts";

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

const validCountry = z.string().trim().max(120).refine((value) => value === "" || (countries as readonly string[]).includes(value), "کشور انتخاب‌شده معتبر نیست.");
const adminPublicUserProfileSchema = z.object({
  email: z.string().trim().email("ایمیل معتبر نیست.").max(320).transform((value) => value.toLowerCase()),
  firstName: z.string().trim().max(100).default(""),
  lastName: z.string().trim().max(100).default(""),
  phone: z.string().trim().max(40).default(""),
  country: validCountry.default(""),
});

const adminUserPasswordSchema = z.string().min(12, "رمز باید حداقل ۱۲ کاراکتر باشد.").max(200).refine((value) => !/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(value), "استفاده از حروف فارسی یا عربی در رمز مجاز نیست.");
const adminSpecialistPasswordField = z.string().min(12, "رمز متخصص باید حداقل ۱۲ کاراکتر باشد.").max(128).refine((value) => !/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(value), "استفاده از حروف فارسی یا عربی در رمز مجاز نیست.");
export const adminPublicUserCreateSchema = z.object({
  email: z.string().trim().email("ایمیل معتبر نیست.").max(320).transform((value) => value.toLowerCase()),
  fullName: z.string().trim().min(1, "نام و نام خانوادگی را وارد کنید.").max(200),
  phone: z.string().trim().min(1, "شماره تلفن را وارد کنید.").max(40),
  country: validCountry.refine((value) => value.length > 0, "کشور را انتخاب کنید."),
  password: adminUserPasswordSchema,
  confirmPassword: adminUserPasswordSchema,
}).refine((value) => value.password === value.confirmPassword, { message: "رمز و تکرار آن یکسان نیستند.", path: ["confirmPassword"] })
  .transform(({ fullName, ...value }) => {
    const [firstName = "", ...lastNameParts] = fullName.split(/\s+/);
    return { ...value, firstName, lastName: lastNameParts.join(" ") };
  });

export const adminPublicUserUpdateSchema = adminPublicUserProfileSchema
  .omit({ firstName: true, lastName: true })
  .extend({ fullName: z.string().trim().max(200).default("") })
  .transform(({ fullName, ...value }) => {
  const [firstName = "", ...lastNameParts] = fullName.split(/\s+/);
  return { ...value, firstName, lastName: lastNameParts.join(" ") };
});

export const adminPublicUserPasswordSchema = z.object({
  password: adminUserPasswordSchema,
  confirmPassword: adminUserPasswordSchema,
  reason: z.string().trim().min(1, "دلیل تغییر رمز را وارد کنید.").max(1000),
}).refine((value) => value.password === value.confirmPassword, { message: "رمز و تکرار آن یکسان نیستند.", path: ["confirmPassword"] });

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
  currency: z.string().trim().toUpperCase().refine((value) => ["USD", "CAD", "EUR"].includes(value), "واحد پولی معتبر نیست.").default("USD"),
  categoryId: z.preprocess((value) => value === "" ? null : value, z.string().uuid().nullable().optional()),
  deliveryMode: z.enum(["RECORDED", "LIVE"]).default("RECORDED"),
  accessDays: z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().positive().nullable().optional()),
});

const optionalCourseMediaId = z.preprocess((value) => value === "" ? null : value, z.string().uuid().nullable().optional());
const optionalCourseDuration = z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().min(0).max(86400).nullable().optional());

export const adminCourseCreateSchema = adminCourseSchema.extend({
  coverMediaId: optionalCourseMediaId,
  tags: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  instructorName: z.string().trim().max(200).default(""),
  durationSessions: z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().positive().nullable().optional()),
  demoMediaId: optionalCourseMediaId,
  demoVideoDuration: optionalCourseDuration,
  sessions: z.array(z.object({ title: z.string().trim().min(1).max(240), videoMediaId: optionalCourseMediaId, videoDuration: optionalCourseDuration })).max(100).default([]),
});

const adminProductBaseSchema = z.object({
  title: z.string().trim().min(1).max(240),
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "اسلاگ معتبر نیست."),
  description: z.string().trim().min(1),
  priceMinor: z.coerce.number().int().min(0),
  discountPercent: z.coerce.number().int().min(0).max(100).default(0),
  currency: z.string().trim().toUpperCase().refine((value) => ["USD", "CAD", "EUR"].includes(value), "واحد پولی معتبر نیست."),
});

export const adminGroupTherapySchema = adminProductBaseSchema.extend({
  coverMediaId: optionalCourseMediaId,
  instructorName: z.string().trim().max(200).optional().default(""),
  meetingUrl: z.preprocess((value) => value === "" || value === undefined ? null : typeof value === "string" ? value.trim() : value, z.string().trim().url("لینک جلسه معتبر نیست.").max(2000).nullable()),
  durationSessions: z.preprocess((value) => value === "" || value === null ? null : value, z.coerce.number().int().positive().nullable().optional()),
  sessions: z.array(z.object({ title: z.string().trim().min(1).max(240), startsAt: z.coerce.date() })).max(100).default([]),
}).refine((value) => {
  if (!value.meetingUrl) return true;
  try { return ["http:", "https:"].includes(new URL(value.meetingUrl).protocol); } catch { return false; }
}, { message: "لینک جلسه باید با http یا https شروع شود.", path: ["meetingUrl"] });

export const adminIndividualConsultationSchema = adminProductBaseSchema.extend({
  durationMinutes: z.coerce.number().int().positive().max(1440).default(50),
  includedSessions: z.coerce.number().int().positive().max(1000).default(1),
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

const specialistContentListSchema = z.array(z.string().trim().min(1).max(4000)).max(50).default([]);
const specialistProfileSectionSchema = z.object({
  id: z.string().trim().min(1).max(120),
  title: z.string().trim().max(240),
  description: z.string().trim().max(20000),
});

function parseSpecialistContentList(value: unknown) {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return value.split(/\r?\n/).filter(Boolean);
  }
}

function parseSpecialistProfileSections(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : value;
  } catch {
    return value;
  }
}

export const adminSpecialistSchema = z.object({
  slug: z.preprocess((value) => value === "" ? undefined : value, z.string().trim().max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "شناسه متخصص معتبر نیست.").optional()),
  displayName: z.string().trim().min(1).max(200),
  specialty: z.string().trim().max(200).optional(),
  aboutTitle: z.string().trim().max(240).optional(),
  aboutDescription: z.string().trim().max(20000).optional(),
  specialtiesTitle: z.string().trim().max(240).optional(),
  specialtiesItems: z.preprocess((value) => parseSpecialistContentList(value), specialistContentListSchema),
  educationTitle: z.string().trim().max(240).optional(),
  educationItems: z.preprocess((value) => parseSpecialistContentList(value), specialistContentListSchema),
  responsibilitiesTitle: z.string().trim().max(240).optional(),
  responsibilitiesItems: z.preprocess((value) => parseSpecialistContentList(value), specialistContentListSchema),
  booksTitle: z.string().trim().max(240).optional(),
  booksItems: z.preprocess((value) => parseSpecialistContentList(value), specialistContentListSchema),
  quoteTitle: z.string().trim().max(240).optional(),
  quote: z.string().trim().max(20000).optional(),
  profileSections: z.preprocess(parseSpecialistProfileSections, z.array(specialistProfileSectionSchema).max(50).optional()),
  phone: z.string().trim().max(40).optional(),
  country: z.string().trim().max(120).optional(),
  email: z.preprocess((value) => value === "" ? undefined : value, z.string().trim().email("ایمیل متخصص معتبر نیست.").max(320).optional()),
  bio: z.string().trim().max(10000).optional(),
  profileMediaId: z.preprocess((value) => value === "" ? null : value, z.string().uuid().nullable().optional()),
  imageUrl: z.preprocess((value) => value === "" ? null : value, z.string().trim().url().max(1000).nullable().optional()),
  userId: z.preprocess((value) => value === "" ? null : value, z.string().uuid().nullable().optional()),
  initialPassword: z.preprocess((value) => value === "" || value === undefined ? undefined : value, adminSpecialistPasswordField.optional()),
  initialPasswordConfirmation: z.preprocess((value) => value === "" || value === undefined ? undefined : value, z.string().max(128).optional()),
  accountActive: z.preprocess((value) => value === undefined ? undefined : value === true || value === "true" || value === "on", z.boolean().optional()),
  profileVisible: z.preprocess((value) => value === undefined ? undefined : value === true || value === "true" || value === "on", z.boolean().optional()),
}).superRefine((value, context) => {
  if ((value.initialPassword || value.initialPasswordConfirmation) && value.initialPassword !== value.initialPasswordConfirmation) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["initialPasswordConfirmation"], message: "رمز اولیه و تکرار آن یکسان نیستند." });
  }
  if (value.profileSections !== undefined && !value.profileSections.some((section) => section.title.trim() || section.description.trim())) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["profileSections"], message: "حداقل یک بخش محتوایی متخصص را کامل کنید." });
  }
});

export const adminSpecialistPasswordSchema = z.object({
  password: adminSpecialistPasswordField,
  confirmPassword: z.string().max(128),
  reason: z.string().trim().min(1, "دلیل تغییر رمز را وارد کنید.").max(1000),
}).refine((value) => value.password === value.confirmPassword, { message: "رمز جدید و تکرار آن یکسان نیستند.", path: ["confirmPassword"] });

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

const adminAppointmentCreateFields = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.preprocess((value) => value === "" || value === undefined ? null : value, z.coerce.date().nullable()),
  meetingUrl: z.preprocess((value) => value === "" || value === undefined ? null : value, z.string().trim().url("لینک جلسه معتبر نیست.").max(2000).nullable()),
  specialistId: z.preprocess((value) => value === "" || value === undefined ? null : value, z.string().uuid("متخصص معتبر نیست.").nullable()),
  reason: z.preprocess((value) => value === "" || value === undefined ? undefined : value, z.string().trim().max(1000).optional()),
});

function hasValidAppointmentUrl(meetingUrl: string | null) {
  if (!meetingUrl) return true;
  try { return ["http:", "https:"].includes(new URL(meetingUrl).protocol); } catch { return false; }
}

export const adminAppointmentCreateSchema = adminAppointmentCreateFields.refine((value) => !value.endsAt || value.endsAt > value.startsAt, { message: "زمان پایان باید بعد از زمان شروع باشد.", path: ["endsAt"] })
  .refine((value) => {
    return hasValidAppointmentUrl(value.meetingUrl);
  }, { message: "لینک جلسه باید با http یا https شروع شود.", path: ["meetingUrl"] });

export const adminUserAppointmentCreateSchema = adminAppointmentCreateFields.extend({ productId: z.string().uuid("نوع جلسه معتبر نیست.") })
  .refine((value) => !value.endsAt || value.endsAt > value.startsAt, { message: "زمان پایان باید بعد از زمان شروع باشد.", path: ["endsAt"] })
  .refine((value) => hasValidAppointmentUrl(value.meetingUrl), { message: "لینک جلسه باید با http یا https شروع شود.", path: ["meetingUrl"] });

export const adminCourseTagCreateSchema = z.object({ name: z.string().trim().min(1, "نام تگ را وارد کنید.").max(80).transform((value) => value.replace(/\s+/g, " ")) });
export const adminCourseTagDeleteSchema = z.object({ name: z.string().trim().min(1).max(80) });

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
  pageKey: z.enum(["home", "pricing", "courses", "contact", "support-fund", "free-session", "group-therapy", "consultation-individual", "consultation-couples", "consultation-teenagers", "group-therapy-detail", "consultation-topic"]).optional(),
});

export const adminFaqReorderSchema = z.object({
  pageKey: z.enum(["home", "pricing", "courses", "contact", "support-fund", "free-session", "group-therapy", "consultation-individual", "consultation-couples", "consultation-teenagers", "group-therapy-detail", "consultation-topic"]),
  ids: z.array(z.string().uuid()).min(1).max(100).refine((ids) => new Set(ids).size === ids.length, "شناسه‌ی سوال تکراری است."),
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
const adminTopicCustomSectionsSchema = z.array(z.object({ id: z.string().trim().min(1).max(100), title: z.string().trim().max(240), description: z.string().trim().max(20000) })).max(20).superRefine((sections, context) => {
  sections.forEach((section, index) => {
    if (!section.title && !section.description) return;
    if (!section.title || !section.description) context.addIssue({ code: z.ZodIssueCode.custom, path: [index], message: "عنوان و توضیحات بخش جدید را کامل کنید." });
  });
});

export const adminIndividualConsultationTopicSchema = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().min(1).max(20000),
  introList: adminTopicListSchema,
  signsTitle: z.string().trim().max(240),
  signs: adminTopicListSchema,
  signsNote: z.string().trim().max(4000),
  why: z.string().trim().max(20000),
  whyTitle: z.string().trim().max(240).default("چرا پیش می‌آید؟"),
  whenToGetHelpTitle: z.string().trim().max(240),
  whenToGetHelp: adminTopicListSchema,
  whatHelpsTitle: z.string().trim().max(240).default("چه کارهایی معمولاً کمک می‌کند؟"),
  whatHelps: adminTopicListSchema,
  approachTitle: z.string().trim().max(240),
  approachParagraphs: adminTopicListSchema,
  approach: adminTopicListSchema,
  customSections: adminTopicCustomSectionsSchema.default([]),
  hideShortQuestions: z.boolean(),
  shortQuestions: adminTopicListSchema,
  imageMode: z.enum(["multiply", "normal", "multiply-no-branding", "normal-no-branding"]),
  heroMediaId: z.string().uuid().nullable(),
  heroImageRemoved: z.boolean(),
});
