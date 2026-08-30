import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().email("ایمیل معتبر نیست.").max(320),
  password: z.string().min(1, "رمز ورود را وارد کنید.").max(200),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export function parseAdminLoginInput(value: unknown) {
  const parsed = adminLoginSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "اطلاعات ورود معتبر نیست.");
  }
  return parsed.data;
}
