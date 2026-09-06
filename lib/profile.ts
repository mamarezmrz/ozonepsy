import { prisma } from "@/lib/prisma";

export type UserProfileData = {
  email: string;
  displayName: string;
  phone: string;
  country: string;
  avatarUrl: string | null;
};

export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      profile: {
        select: {
          displayName: true,
          phone: true,
          country: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    email: user.email,
    displayName: user.profile?.displayName ?? "",
    phone: user.profile?.phone ?? "",
    country: user.profile?.country ?? "",
    avatarUrl: user.profile?.avatarUrl ?? null,
  };
}
