import { RoleName, SpecialistStatus, UserStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { assertAuthRateLimit, clearAuthFailures, recordAuthFailure, recordAuthFailures } from "@/lib/auth/rate-limit";
import { clearTherapistSessionCookie, createSessionToken, getTherapistSessionToken, hashSessionToken } from "@/lib/auth/session";
import { sessionData } from "@/lib/auth/service";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { legacySpecialistProfileSections, parseSpecialistProfileSections, type SpecialistProfileSection } from "@/lib/specialist-profile";
import { parseTherapistPendingProfileChange, type TherapistPendingProfileChange } from "@/lib/therapist/profile";

type TherapistAuthMetadata = { ipAddress?: string; userAgent?: string };

export type TherapistSessionView = {
  sessionId: string;
  userId: string;
  email: string;
  mustChangePassword: boolean;
  specialist: {
    id: string;
    slug: string;
    displayName: string;
    specialty: string | null;
    phone: string | null;
    country: string | null;
    email: string | null;
    bio: string | null;
    imageUrl: string | null;
    profileMediaId: string | null;
    profileSections: SpecialistProfileSection[];
    aboutTitle: string | null;
    aboutDescription: string | null;
    specialtiesTitle: string | null;
    specialtiesItems: string[];
    educationTitle: string | null;
    educationItems: string[];
    responsibilitiesTitle: string | null;
    responsibilitiesItems: string[];
    booksTitle: string | null;
    booksItems: string[];
    quoteTitle: string | null;
    quote: string | null;
    pendingProfileChanges: TherapistPendingProfileChange | null;
  };
};

export class TherapistAuthorizationError extends Error {
  constructor(public readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "MUST_CHANGE_PASSWORD", message: string) {
    super(message);
  }
}

export class TherapistAuthenticationError extends Error {
  constructor(message = "ایمیل یا رمز ورود متخصص نادرست است.") {
    super(message);
  }
}

const invalidCredentialsMessage = "ایمیل یا رمز ورود متخصص نادرست است.";

function therapistWhere() {
  return {
    status: UserStatus.ACTIVE,
    roles: { some: { role: { name: RoleName.THERAPIST } } },
    specialistProfile: { is: { status: SpecialistStatus.ACTIVE } },
  } as const;
}

export async function getCurrentTherapist(): Promise<TherapistSessionView | null> {
  const token = await getTherapistSessionToken();
  if (!token) return null;

  const session = await prisma.authSession.findFirst({
    where: {
      tokenHash: hashSessionToken(token),
      revokedAt: null,
      expiresAt: { gt: new Date() },
      user: therapistWhere(),
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          email: true,
          mustChangePassword: true,
          specialistProfile: {
            select: { id: true, slug: true, displayName: true, specialty: true, phone: true, country: true, email: true, bio: true, aboutTitle: true, aboutDescription: true, specialtiesTitle: true, specialtiesItems: true, educationTitle: true, educationItems: true, responsibilitiesTitle: true, responsibilitiesItems: true, booksTitle: true, booksItems: true, quoteTitle: true, quote: true, profileSections: true, imageUrl: true, profileMediaId: true, pendingProfileChanges: true },
          },
        },
      },
    },
  });

  if (!session?.user.specialistProfile) return null;
  const specialist = session.user.specialistProfile;
  const profileSections = parseSpecialistProfileSections(specialist.profileSections);
  return {
    sessionId: session.id,
    userId: session.userId,
    email: session.user.email,
    mustChangePassword: session.user.mustChangePassword,
    specialist: {
      ...specialist,
      profileSections: profileSections.length ? profileSections : legacySpecialistProfileSections(specialist),
      pendingProfileChanges: parseTherapistPendingProfileChange(specialist.pendingProfileChanges),
    },
  };
}

export async function requireTherapist(options: { allowPasswordChange?: boolean } = {}) {
  const therapist = await getCurrentTherapist();
  if (!therapist) {
    const token = await getTherapistSessionToken();
    throw new TherapistAuthorizationError(token ? "FORBIDDEN" : "UNAUTHORIZED", token ? "دسترسی به پنل متخصصان مجاز نیست." : "برای ادامه وارد حساب متخصص شوید.");
  }
  if (therapist.mustChangePassword && !options.allowPasswordChange) {
    throw new TherapistAuthorizationError("MUST_CHANGE_PASSWORD", "پیش از ورود به پنل، رمز موقت خود را تغییر دهید.");
  }
  return therapist;
}

export async function logoutCurrentTherapist(metadata: TherapistAuthMetadata = {}) {
  const token = await getTherapistSessionToken();

  if (token) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.authSession.findFirst({
        where: { tokenHash: hashSessionToken(token), revokedAt: null },
        select: { id: true, userId: true },
      });
      if (!current) return;
      const revoked = await tx.authSession.updateMany({
        where: { id: current.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (revoked.count !== 1) return;
      await recordAdminAuditWithClient(tx, {
        actorId: current.userId,
        action: "THERAPIST_LOGOUT",
        targetType: "AUTH_SESSION",
        targetId: current.id,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      });
    });
  }

  await clearTherapistSessionCookie();
}

export async function loginTherapist(email: string, password: string, metadata: TherapistAuthMetadata) {
  const normalizedEmail = email.trim().toLowerCase();
  const ipAddress = metadata.ipAddress?.trim() || "unknown";
  await assertAuthRateLimit("therapist-login-email", normalizedEmail);
  await assertAuthRateLimit("therapist-login-ip", ipAddress);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      mustChangePassword: true,
      specialistProfile: { select: { id: true, slug: true, displayName: true, specialty: true, phone: true, country: true, bio: true, imageUrl: true, status: true } },
      roles: { where: { role: { name: RoleName.THERAPIST } }, select: { role: { select: { name: true } } } },
      status: true,
    },
  });
  const validPassword = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false;
  const canLogin = Boolean(user && user.status === UserStatus.ACTIVE && user.specialistProfile?.status === SpecialistStatus.ACTIVE && user.roles.length && validPassword);

  if (!canLogin || !user?.specialistProfile) {
    await recordAuthFailures("therapist-login-email", [normalizedEmail]);
    await recordAuthFailure("therapist-login-ip", ipAddress);
    throw new TherapistAuthenticationError(invalidCredentialsMessage);
  }

  const token = createSessionToken();
  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.authSession.create({
      data: sessionData(user.id, token, metadata),
      select: { id: true },
    });
    await recordAdminAuditWithClient(tx, { actorId: user.id, action: "THERAPIST_LOGIN", targetType: "AUTH_SESSION", targetId: created.id, ipAddress: metadata.ipAddress, userAgent: metadata.userAgent });
    return created;
  });
  await clearAuthFailures("therapist-login-email", normalizedEmail);
  await clearAuthFailures("therapist-login-ip", ipAddress);

  return { token, sessionId: session.id, mustChangePassword: user.mustChangePassword };
}

export async function changeTherapistPassword(currentPassword: string, newPassword: string) {
  const therapist = await requireTherapist({ allowPasswordChange: true });
  const user = await prisma.user.findUnique({ where: { id: therapist.userId }, select: { passwordHash: true } });
  if (!user?.passwordHash || !(await verifyPassword(currentPassword, user.passwordHash))) throw new TherapistAuthenticationError("رمز فعلی نادرست است.");

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: therapist.userId }, data: { passwordHash, mustChangePassword: false } });
    await tx.authSession.updateMany({ where: { userId: therapist.userId, revokedAt: null, id: { not: therapist.sessionId } }, data: { revokedAt: new Date() } });
    await recordAdminAuditWithClient(tx, { actorId: therapist.userId, action: "THERAPIST_PASSWORD_CHANGED", targetType: "USER", targetId: therapist.userId, afterState: { mustChangePassword: false } });
  });
  return { ok: true };
}
