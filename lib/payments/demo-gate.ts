export function isDemoPaymentEnabled(email?: string | null) {
  const environment = (process.env.NODE_ENV || "development").toLowerCase();
  if (process.env.DEMO_PAYMENT_ENABLED === "false") return false;

  if (environment === "production") {
    // Temporary production QA mode: demo purchases are available to any signed-in user.
    // They are recorded as paid but do not charge money. Set DEMO_PAYMENT_ENABLED=false to close it.
    return Boolean(email);
  }

  const allowedEnvironments = process.env.DEMO_PAYMENT_ALLOWED_ENVIRONMENTS?.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  return allowedEnvironments?.length ? allowedEnvironments.includes(environment) : environment === "development" || environment === "test";
}
