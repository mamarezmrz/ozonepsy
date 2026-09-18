export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
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
        ...(message.html ? { html: message.html } : {}),
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

export async function sendTherapistCredentialsEmail(input: { email: string; displayName?: string; temporaryPassword: string; reset?: boolean }) {
  const loginUrl = `${(process.env.PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")}/therapist-panel/login`;
  const greeting = input.displayName?.trim() ? `سلام ${input.displayName.trim()}،` : "سلام،";
  const subject = input.reset ? "رمز ورود متخصص اُزون تنظیم شد" : "دسترسی پنل متخصص اُزون";
  const text = `${greeting}\n\n${input.reset ? "رمز ورود موقت شما دوباره تنظیم شده است." : "حساب متخصص شما در اُزون ایجاد شده است."}\nایمیل ورود: ${input.email}\nرمز موقت: ${input.temporaryPassword}\n\nورود به پنل متخصص: ${loginUrl}\n\nپس از ورود، رمز موقت را با رمز شخصی خود عوض کنید.\nاُزون`;
  await sendConfiguredEmail({ to: input.email, subject, text });
}

type AppointmentConfirmationInput = {
  email: string;
  userName?: string | null;
  title: string;
  startsAt: Date;
  endsAt?: Date | null;
  meetingUrl?: string | null;
};

function calendarDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function calendarUrl(input: AppointmentConfirmationInput) {
  const end = input.endsAt && input.endsAt > input.startsAt ? input.endsAt : new Date(input.startsAt.getTime() + 50 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${calendarDate(input.startsAt)}/${calendarDate(end)}`,
    details: input.meetingUrl ? `لینک جلسه: ${input.meetingUrl}` : "جلسه‌ی شما با اُزون تأیید شده است.",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeHtml(value: string) {
  const replacements: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>\"']/g, (character) => replacements[character] ?? character);
}

export async function sendAppointmentConfirmationEmail(input: AppointmentConfirmationInput) {
  const addToCalendarUrl = calendarUrl(input);
  const greeting = input.userName?.trim() ? `سلام ${input.userName.trim()}،` : "سلام،";
  const meetingLine = input.meetingUrl ? `\nلینک جلسه: ${input.meetingUrl}` : "";
  const dateText = input.startsAt.toLocaleString("fa-IR-u-ca-gregory", { dateStyle: "full", timeStyle: "short" });
  const text = `${greeting}\n\nجلسه‌ی «${input.title}» برای شما تأیید شد.\nزمان جلسه: ${dateText}${meetingLine}\n\nافزودن به تقویم: ${addToCalendarUrl}\n\nاُزون`;
  const html = `<div dir="rtl"><p>${escapeHtml(greeting)}</p><p>جلسه‌ی «${escapeHtml(input.title)}» برای شما تأیید شد.</p><p>زمان جلسه: ${escapeHtml(dateText)}</p>${input.meetingUrl ? `<p>لینک جلسه: <a href="${escapeHtml(input.meetingUrl)}">ورود به جلسه</a></p>` : ""}<p><a href="${escapeHtml(addToCalendarUrl)}">افزودن به تقویم</a></p></div>`;
  await sendConfiguredEmail({ to: input.email, subject: `تأیید جلسه‌ی ${input.title} | اُزون`, text, html });
}

export type AdminNotificationEmailInput = {
  subject: string;
  text: string;
};

export async function sendAdminNotificationEmail(input: AdminNotificationEmailInput) {
  const recipient = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
  if (!recipient || !process.env.EMAIL_PROVIDER?.trim()) return { sent: false, configured: false };
  return { sent: await sendConfiguredEmail({ to: recipient, subject: input.subject, text: input.text }), configured: true };
}

async function sendConfiguredEmail(message: EmailMessage): Promise<boolean> {
  if (!message.to.trim() || !process.env.EMAIL_PROVIDER?.trim()) return false;
  try {
    await getEmailDeliveryAdapter().send(message);
    return true;
  } catch (error) {
    console.error("[email] delivery failed", error);
    return false;
  }
}
