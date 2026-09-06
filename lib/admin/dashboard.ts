import { AppointmentStatus, OrderStatus, ProductKind, RoleName, UserStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { AdminSessionView } from "@/lib/admin/session";

const adminRoleNames = [RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.CONTENT_MANAGER, RoleName.SUPPORT, RoleName.INSTRUCTOR];
const publicUserWhere = { roles: { some: { role: { name: RoleName.USER } }, none: { role: { name: { in: adminRoleNames } } } } } as const;

export type AdminDashboardData = {
  metrics: Array<{ label: string; value: number; tone: "primary" }>;
  recentUsers: Array<{ id: string; email: string; name: string; createdAt: Date; status: UserStatus }>;
  upcomingSessions: Array<{ id: string; title: string; email: string; startsAt: Date; status: AppointmentStatus }>;
  recentOrders: Array<{ id: string; orderNumber: string; title: string; status: OrderStatus; totalMinor: number; currency: string; createdAt: Date }>;
};

export async function getAdminDashboardData(session?: AdminSessionView): Promise<AdminDashboardData> {
  const now = new Date();
  const canReadUsers = session?.permissions.includes("users.read") ?? false;
  const canReadSessions = session?.permissions.includes("sessions.read") ?? false;
  const canReadCourses = session?.permissions.includes("courses.read") ?? false;
  const canReadReviews = session?.permissions.includes("reviews.read") ?? false;
  const canReadOrders = session?.permissions.includes("orders.read") ?? false;

  const [userCount, courseCount, sessionCount, reviewCount, recentUsers, upcomingSessions, recentOrders] = await Promise.all([
    canReadUsers ? prisma.user.count({ where: publicUserWhere }) : Promise.resolve(0),
    canReadCourses ? prisma.product.count({ where: { kind: ProductKind.COURSE } }) : Promise.resolve(0),
    canReadSessions ? prisma.appointment.count() : Promise.resolve(0),
    canReadReviews ? prisma.review.count() : Promise.resolve(0),
    canReadUsers ? prisma.user.findMany({
      where: publicUserWhere,
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, email: true, status: true, createdAt: true, profile: { select: { displayName: true, firstName: true, lastName: true } } },
    }) : Promise.resolve([]),
    canReadSessions ? prisma.appointment.findMany({
      where: { startsAt: { gte: now }, status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED] } },
      orderBy: { startsAt: "asc" },
      take: 6,
      select: { id: true, startsAt: true, status: true, product: { select: { title: true } }, user: { select: { email: true } } },
    }) : Promise.resolve([]),
    canReadOrders ? prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, orderNumber: true, productTitleSnapshot: true, status: true, totalMinor: true, currency: true, createdAt: true },
    }) : Promise.resolve([]),
  ]);

  return {
    metrics: [
    ...(canReadUsers ? [{ label: "کاربران", value: userCount, tone: "primary" as const }] : []),
    ...(canReadCourses ? [{ label: "دوره‌ها", value: courseCount, tone: "primary" as const }] : []),
    ...(canReadSessions ? [{ label: "جلسات", value: sessionCount, tone: "primary" as const }] : []),
    ...(canReadReviews ? [{ label: "نظرات", value: reviewCount, tone: "primary" as const }] : []),
    ],
    recentUsers: recentUsers.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.profile?.displayName || [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ") || "بدون نام",
      createdAt: user.createdAt,
      status: user.status,
    })),
    upcomingSessions: upcomingSessions.map((appointment) => ({ id: appointment.id, title: appointment.product.title, email: appointment.user.email, startsAt: appointment.startsAt, status: appointment.status })),
    recentOrders: recentOrders.map((order) => ({ id: order.id, orderNumber: order.orderNumber, title: order.productTitleSnapshot, status: order.status, totalMinor: order.totalMinor, currency: order.currency, createdAt: order.createdAt })),
  };
}
