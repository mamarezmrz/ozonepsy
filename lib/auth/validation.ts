import { countries } from "@/lib/countries";

const countrySet = new Set<string>(countries);

export class AuthInputError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, field: string, maxLength: number, required = true) {
  if (typeof value !== "string") {
    if (!required && (value === undefined || value === null || value === "")) return "";
    throw new AuthInputError(`مقدار ${field} معتبر نیست.`);
  }

  const result = value.trim();
  if (required && !result) throw new AuthInputError(`وارد کردن ${field} الزامی است.`);
  if (result.length > maxLength) throw new AuthInputError(`مقدار ${field} بیش از حد طولانی است.`);
  return result;
}

function readPassword(value: unknown) {
  if (typeof value !== "string" || value.length < 8 || value.length > 128) {
    throw new AuthInputError("رمز ورود باید بین ۸ تا ۱۲۸ کاراکتر باشد.");
  }
  return value;
}

function readEmail(value: unknown) {
  const email = readString(value, "ایمیل", 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthInputError("ایمیل واردشده معتبر نیست.");
  }
  return email;
}

export function parseLoginInput(payload: unknown) {
  if (!isRecord(payload)) throw new AuthInputError("اطلاعات ورود معتبر نیست.");

  return {
    email: readEmail(payload.email),
    password: readPassword(payload.password),
  };
}

export function parseRegisterInput(payload: unknown) {
  if (!isRecord(payload)) throw new AuthInputError("اطلاعات ثبت‌نام معتبر نیست.");

  const country = readString(payload.country, "کشور", 120, false);
  const password = readPassword(payload.password);
  const passwordConfirmation = readString(payload.passwordConfirmation, "تکرار رمز ورود", 128, false);

  if (payload.requireCountry === "true" && !country) {
    throw new AuthInputError("انتخاب کشور الزامی است.");
  }

  if (passwordConfirmation && password !== passwordConfirmation) {
    throw new AuthInputError("رمز ورود و تکرار آن یکسان نیستند.");
  }
  if (country && !countrySet.has(country)) {
    throw new AuthInputError("کشور انتخاب‌شده معتبر نیست.");
  }

  return {
    email: readEmail(payload.email),
    password,
    passwordConfirmation,
    country,
    displayName: readString(payload.displayName, "نام", 200, false),
  };
}
