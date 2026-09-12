export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export interface EmailDeliveryAdapter {
  send(message: EmailMessage): Promise<void>;
}

export class EmailDeliveryConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailDeliveryConfigurationError";
  }
}

class DisabledEmailDelivery implements EmailDeliveryAdapter {
  async send(message: EmailMessage) {
    void message;
    throw new EmailDeliveryConfigurationError("Email delivery provider is not configured.");
  }
}

class DevelopmentEmailDelivery implements EmailDeliveryAdapter {
  async send(message: EmailMessage) {
    if (process.env.NODE_ENV === "production") {
      throw new EmailDeliveryConfigurationError("Console email delivery cannot be used in production.");
    }
    console.info(`[auth.email] ${message.subject} prepared for ${message.to}`);
  }
}

class ResendEmailDelivery implements EmailDeliveryAdapter {
  async send(message: EmailMessage) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.EMAIL_FROM?.trim();
    if (!apiKey || !from) {
      throw new EmailDeliveryConfigurationError("Resend email delivery is not configured.");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend email delivery failed with status ${response.status}.`);
    }
  }
}

export function getEmailDeliveryAdapter(): EmailDeliveryAdapter {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (provider === "console") return new DevelopmentEmailDelivery();
  if (provider === "resend") return new ResendEmailDelivery();
  return new DisabledEmailDelivery();
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
