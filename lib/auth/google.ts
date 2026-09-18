import { RoleName, UserStatus } from "@/lib/generated/prisma/enums";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { createSessionToken } from "@/lib/auth/session";
import { getSiteHeaderUser } from "@/lib/auth/user-display";
import { prisma } from "@/lib/prisma";
import { sessionData, InvalidCredentialsError } from "@/lib/auth/service";

export type GoogleProfile = {
  subject: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  givenName?: string;
  familyName?: string;
};

export class GoogleAuthError extends Error {}

function splitName(profile: GoogleProfile) {
  const firstName = profile.givenName?.trim() || profile.name?.trim().split(/\s+/)[0] || "";
  const lastName = profile.familyName?.trim() || profile.name?.trim().split(/\s+/).slice(1).join(" ") || "";
  return { firstName, lastName, displayName: profile.name?.trim() || [firstName, lastName].filter(Boolean).join(" ") };
}

export async function authenticateGoogleUser(profile: GoogleProfile, metadata: { ipAddress?: string; userAgent?: string }) {
  if (!profile.subject || !profile.email || !profile.emailVerified) throw new GoogleAuthError("حساب گوگل باید ایمیل تأییدشده داشته باشد.");

  const email = profile.email.trim().toLowerCase();
  const token = createSessionToken();
  const name = splitName(profile);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const identity = await tx.authIdentity.findUnique({
        where: { provider_providerAccountId: { provider: "google", providerAccountId: profile.subject } },
        select: { user: { select: { id: true, email: true, status: true, profile: { select: { displayName: true, avatarUrl: true } } } } },
      });

      let account = identity?.user ?? await tx.user.findUnique({
        where: { email },
        select: { id: true, email: true, status: true, profile: { select: { displayName: true, avatarUrl: true } } },
      });

      if (account && account.status !== UserStatus.ACTIVE) throw new InvalidCredentialsError("این حساب در حال حاضر فعال نیست.");

      if (!account) {
        account = await tx.user.create({
          data: {
            email,
            status: UserStatus.ACTIVE,
            emailVerifiedAt: new Date(),
            profile: { create: { firstName: name.firstName || null, lastName: name.lastName || null, displayName: name.displayName || null } },
            roles: { create: { role: { connectOrCreate: { where: { name: RoleName.USER }, create: { name: RoleName.USER } } } } },
          },
          select: { id: true, email: true, status: true, profile: { select: { displayName: true, avatarUrl: true } } },
        });
      }

      if (!identity) {
        await tx.authIdentity.create({ data: { userId: account.id, provider: "google", providerAccountId: profile.subject, email } });
      }

      await tx.authSession.create({ data: sessionData(account.id, token, metadata) });
      await recordAdminAuditWithClient(tx, {
        actorId: account.id,
        action: "USER_LOGIN_GOOGLE",
        targetType: "USER",
        targetId: account.id,
        afterState: { provider: "google", email: account.email },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      });
      return account;
    });

    return { token, headerUser: getSiteHeaderUser(user.email, user.profile?.displayName, user.profile?.avatarUrl) };
  } catch (error) {
    if (error instanceof InvalidCredentialsError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw new GoogleAuthError("این حساب گوگل هم‌زمان در حال اتصال است. دوباره تلاش کنید.");
    }
    throw error;
  }
}
