export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export interface EmailDeliveryAdapter {
  send(message: EmailMessage): Promise<void>;
}

class DisabledEmailDelivery implements EmailDeliveryAdapter {
  async send(message: EmailMessage) {
    void message;
    // Delivery is intentionally a deployment concern. Tokens are never logged
    // or returned unless the explicit development escape hatch is enabled.
  }
}

class DevelopmentEmailDelivery implements EmailDeliveryAdapter {
  async send(message: EmailMessage) {
    if (process.env.NODE_ENV === "production") return;
    console.info(`[auth.email] ${message.subject} prepared for ${message.to}`);
  }
}

export function getEmailDeliveryAdapter(): EmailDeliveryAdapter {
  return process.env.EMAIL_PROVIDER?.trim().toLowerCase() === "console"
    ? new DevelopmentEmailDelivery()
    : new DisabledEmailDelivery();
}

export async function sendPasswordResetEmail(email: string, token: string, baseUrl: string) {
  const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
  await getEmailDeliveryAdapter().send({
    to: email,
    subject: "بازیابی رمز ورود اُزون",
    text: `برای تعیین رمز جدید از این لینک استفاده کنید: ${resetUrl}`,
  });
}

export async function sendEmailVerificationEmail(email: string, token: string, baseUrl: string) {
  const verifyUrl = `${baseUrl.replace(/\/$/, "")}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  await getEmailDeliveryAdapter().send({
    to: email,
    subject: "تأیید ایمیل اُزون",
    text: `برای تأیید ایمیل از این لینک استفاده کنید: ${verifyUrl}`,
  });
}
