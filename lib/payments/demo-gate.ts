export function isDemoPaymentEnabled() {
  if (process.env.NODE_ENV === "production" || process.env.DEMO_PAYMENT_ENABLED === "false") return false;
  const allowed = process.env.DEMO_PAYMENT_ALLOWED_ENVIRONMENTS?.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  const environment = (process.env.NODE_ENV || "development").toLowerCase();
  // Demo checkout is useful for local/test verification, but production is always
  // denied by the guard above even if an environment variable is misconfigured.
  return allowed?.length ? allowed.includes(environment) : environment === "development" || environment === "test";
}
