import { RoleName, UserStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, createSessionToken, getSessionToken, hashSessionToken } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getSiteHeaderUser } from "@/lib/auth/user-display";

type AuthMetadata = {
  userAgent?: string;
  ipAddress?: string;
};

type RegisterInput = {
  email: string;
  password: string;
  passwordConfirmation?: string;
  country?: string;
  displayName?: string;
};

export class AuthConflictError extends Error {}
export class InvalidCredentialsError extends Error {}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function sessionData(userId: string, token: string, metadata: AuthMetadata) {
  return {
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    userAgent: metadata.userAgent?.slice(0, 500),
    ipAddress: metadata.ipAddress?.slice(0, 64),
  };
}

export async function registerUser(input: RegisterInput, metadata: AuthMetadata) {
  const passwordHash = await hashPassword(input.password);
  const token = createSessionToken();

  try {
    const registeredUser = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({ where: { email: input.email } });

      if (existingUser) throw new AuthConflictError("این ایمیل قبلاً ثبت شده است.");

      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          status: UserStatus.ACTIVE,
          profile: {
            create: {
              country: input.country || undefined,
              displayName: input.displayName || undefined,
            },
          },
          roles: {
            create: {
              role: {
                connectOrCreate: {
                  where: { name: RoleName.USER },
                  create: { name: RoleName.USER },
                },
              },
            },
          },
        },
        select: {
          id: true,
          email: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      });

      await tx.authSession.create({ data: sessionData(user.id, token, metadata) });

      return user;
    });

    return {
      token,
      headerUser: getSiteHeaderUser(registeredUser.email, registeredUser.profile?.displayName, registeredUser.profile?.avatarUrl),
    };
  } catch (error) {
    if (error instanceof AuthConflictError || isUniqueConstraintError(error)) {
      throw new AuthConflictError("این ایمیل قبلاً ثبت شده است.");
    }
    throw error;
  }

}

export async function loginUser(email: string, password: string, metadata: AuthMetadata) {
  const token = createSessionToken();

  const authenticatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        status: true,
        profile: { select: { displayName: true, avatarUrl: true } },
      },
    });

    if (!user?.passwordHash || user.status !== UserStatus.ACTIVE || !(await verifyPassword(password, user.passwordHash))) {
      throw new InvalidCredentialsError("ایمیل یا رمز ورود نادرست است.");
    }

    await tx.authSession.create({ data: sessionData(user.id, token, metadata) });

    return user;
  });

  return {
    token,
    headerUser: getSiteHeaderUser(authenticatedUser.email, authenticatedUser.profile?.displayName, authenticatedUser.profile?.avatarUrl),
  };
}

export async function getCurrentUser() {
  const token = await getSessionToken();
  if (!token) return null;

  const session = await prisma.authSession.findFirst({
    where: {
      tokenHash: hashSessionToken(token),
      revokedAt: null,
      expiresAt: { gt: new Date() },
      user: { status: UserStatus.ACTIVE },
    },
    select: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      },
    },
  });

  return session?.user ?? null;
}

export async function logoutCurrentUser() {
  const token = await getSessionToken();

  if (token) {
    await prisma.authSession.updateMany({
      where: { tokenHash: hashSessionToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  await clearSessionCookie();
}
