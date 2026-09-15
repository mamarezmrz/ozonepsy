export function isDemoPaymentEnabled(email?: string | null) {
  const environment = (process.env.NODE_ENV || "development").toLowerCase();
  if (process.env.DEMO_PAYMENT_ENABLED === "false") return false;

  if (environment === "production") {
    if (process.env.DEMO_PAYMENT_ENABLED !== "true" || !email) return false;
    const allowedEmails = process.env.DEMO_PAYMENT_ALLOWED_EMAILS?.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean) ?? [];
    return allowedEmails.includes(email.trim().toLowerCase());
  }

  const allowedEnvironments = process.env.DEMO_PAYMENT_ALLOWED_ENVIRONMENTS?.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  return allowedEnvironments?.length ? allowedEnvironments.includes(environment) : environment === "development" || environment === "test";
}
