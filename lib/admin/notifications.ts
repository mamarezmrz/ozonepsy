import { AdminNotificationType } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

function isMissingTableError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2021";
}

export async function createAdminNotification(input: { type: AdminNotificationType; title: string; description: string; href?: string | null }) {
  try {
    return await prisma.adminNotification.create({
      data: {
        type: input.type,
        title: input.title.trim().slice(0, 240),
        description: input.description.trim(),
        href: input.href?.trim() || null,
      },
      select: { id: true, type: true, title: true, description: true, href: true, createdAt: true },
    });
  } catch (error) {
    if (isMissingTableError(error)) return null;
    console.error("[admin.notifications] notification creation failed", error);
    return null;
  }
}

export async function listAdminNotifications(limit = 30) {
  try {
    return await prisma.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 50),
      select: { id: true, type: true, title: true, description: true, href: true, createdAt: true },
    });
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}
