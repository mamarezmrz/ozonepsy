import {
  AppointmentStatus,
  EntitlementStatus,
  OrderStatus,
  SessionUsageStatus,
  SupportContributionStatus,
} from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { toPersianDigits } from "@/lib/format";

const productImageBySlug: Record<string, string> = {
  "life-skills-course": "image-20.png",
  "schema-therapy-1": "image-20.png",
  "life-skills-group": "image-21.png",
  "psychology-and-health": "image-22.png",
  "effective-communication": "image-20.png",
};

export type DashboardSession = {
  id: string;
  title: string;
  total: number;
  completed: number;
  remaining: number;
  nextAppointment?: string;
};

export type DashboardCard = {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
};

export type DashboardGroupSession = {
  id: string;
  title: string;
  date: string;
  time: string;
  completed: boolean;
};

export type DashboardGroupTherapyCard = DashboardCard & {
  sessions: DashboardGroupSession[];
};

export type DashboardPayment = {
  id: string;
  orderNumber: string;
  productTitle: string;
  provider: string;
  amount: string;
  date: string;
};

export type DashboardCommentStatus = "PENDING" | "PUBLISHED" | "HIDDEN" | "USER_DELETED";

export type DashboardComment = {
  id: string;
  body: string;
  status: DashboardCommentStatus;
  pageTitle: string;
  pageHref: string;
  date: string;
};

export type DashboardData = {
  profile: {
    name: string;
    country: string;
    email: string;
    avatarUrl: string | null;
  };
  individualSessions: DashboardSession[];
  groupTherapy: DashboardGroupTherapyCard[];
  courses: DashboardCard[];
  payments: DashboardPayment[];
  comments: DashboardComment[];
  supportFundTotalMinor: number;
};

function productImage(slug: string) {
  return `/figma-home/${productImageBySlug[slug] ?? "image-21.png"}`;
}

function formatMoney(amountMinor: number, currency: string) {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatAppointmentDate(date: Date) {
  const datePart = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${datePart} · ${timePart}`;
}

function formatSessionDate(date: Date) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-gregory", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatSessionTime(date: Date) {
  const time = new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `ساعت ${time}`;
}

function reviewPage(product: { kind: string; slug: string; title: string } | null) {
  if (!product) return { pageTitle: "اُزون", pageHref: "/" };
  if (product.kind === "COURSE") return { pageTitle: product.title, pageHref: `/courses/${product.slug}` };
  if (product.kind === "GROUP") return { pageTitle: product.title, pageHref: "/group-therapy" };
  if (product.kind === "CONSULTATION") return { pageTitle: product.title, pageHref: "/consultations/individual" };
  return { pageTitle: product.title, pageHref: "/consultations" };
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      profile: { select: { displayName: true, country: true, avatarUrl: true } },
      entitlements: {
        where: {
          status: {
            in: [EntitlementStatus.ACTIVE, EntitlementStatus.EXHAUSTED, EntitlementStatus.EXPIRED],
          },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          totalSessions: true,
          product: {
            select: {
              slug: true,
              title: true,
              description: true,
              kind: true,
            },
          },
          appointments: {
            where: { status: "SCHEDULED" },
            orderBy: { startsAt: "asc" },
            take: 1,
            select: { startsAt: true },
          },
          usages: { select: { status: true } },
        },
      },
      orders: {
        where: { status: OrderStatus.PAID },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          orderNumber: true,
          productTitleSnapshot: true,
          totalMinor: true,
          currency: true,
          createdAt: true,
          payments: {
            where: { status: "VERIFIED" },
            orderBy: { verifiedAt: "desc" },
            take: 1,
            select: { provider: true },
          },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          body: true,
          status: true,
          createdAt: true,
          product: { select: { kind: true, slug: true, title: true } },
        },
      },
    },
  });

  if (!user) {
    return {
      profile: { name: "کاربر اُزون", country: "", email: "", avatarUrl: null },
      individualSessions: [],
      groupTherapy: [],
      courses: [],
      payments: [],
      comments: [],
      supportFundTotalMinor: 0,
    };
  }

  const userDeletedReviewRows = await prisma.adminAuditLog.findMany({
    where: { actorId: userId, targetType: "REVIEW", action: "REVIEW_HIDDEN_BY_USER" },
    select: { targetId: true },
  });
  const userDeletedReviewIds = new Set(userDeletedReviewRows.map((row) => row.targetId));

  const supportFundTotal = await prisma.supportContribution.aggregate({
    where: {
      userId,
      status: SupportContributionStatus.PAID,
      currency: "USD",
    },
    _sum: { amountMinor: true },
  });

  const groupEntitlementIds = user.entitlements
    .filter((entitlement) => entitlement.product.kind === "GROUP")
    .map((entitlement) => entitlement.id);
  const groupAppointments = groupEntitlementIds.length
    ? await prisma.appointment.findMany({
        where: {
          userId,
          entitlementId: { in: groupEntitlementIds },
        },
        orderBy: { startsAt: "asc" },
        select: {
          id: true,
          entitlementId: true,
          status: true,
          startsAt: true,
          usage: { select: { status: true } },
        },
      })
    : [];
  const groupAppointmentsByEntitlement = new Map<string, typeof groupAppointments>();
  for (const appointment of groupAppointments) {
    if (!appointment.entitlementId) continue;
    const appointments = groupAppointmentsByEntitlement.get(appointment.entitlementId) ?? [];
    appointments.push(appointment);
    groupAppointmentsByEntitlement.set(appointment.entitlementId, appointments);
  }

  const individualSessions: DashboardSession[] = [];
  const groupTherapy: DashboardGroupTherapyCard[] = [];
  const courses: DashboardCard[] = [];

  for (const entitlement of user.entitlements) {
    const completed = entitlement.usages.filter((usage) => usage.status === SessionUsageStatus.COMPLETED).length;
    const total = entitlement.totalSessions ?? 1;
    const product = entitlement.product;
    const card = {
      id: entitlement.id,
      title: product.title,
      description: product.description,
      image: productImage(product.slug),
      href: `/dashboard/entitlements/${entitlement.id}`,
    };

    if (product.kind === "COURSE") {
      courses.push(card);
    } else if (product.kind === "GROUP") {
      const appointments = groupAppointmentsByEntitlement.get(entitlement.id) ?? [];
      groupTherapy.push({
        ...card,
        sessions: appointments.map((appointment, index) => ({
          id: appointment.id,
          title: `جلسه ${toPersianDigits(index + 1)}`,
          date: formatSessionDate(appointment.startsAt),
          time: formatSessionTime(appointment.startsAt),
          completed:
            appointment.status === AppointmentStatus.COMPLETED ||
            appointment.usage?.status === SessionUsageStatus.COMPLETED,
        })),
      });
    } else {
      individualSessions.push({
        id: entitlement.id,
        title: product.title,
        total,
        completed,
        remaining: Math.max(total - completed, 0),
        nextAppointment: entitlement.appointments[0]
          ? formatAppointmentDate(entitlement.appointments[0].startsAt)
          : undefined,
      });
    }
  }

  return {
    profile: {
      name: user.profile?.displayName || user.email.split("@")[0] || "کاربر اُزون",
      country: user.profile?.country || "",
      email: user.email,
      avatarUrl: user.profile?.avatarUrl || null,
    },
    individualSessions,
    groupTherapy,
    courses,
    payments: user.orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      productTitle: order.productTitleSnapshot,
      provider: order.payments[0]?.provider || "—",
      amount: formatMoney(order.totalMinor, order.currency),
      date: formatDate(order.createdAt),
    })),
    comments: user.reviews.map((review) => {
      const page = reviewPage(review.product);
      return {
        id: review.id,
        body: review.body,
        status: userDeletedReviewIds.has(review.id) ? "USER_DELETED" : review.status as DashboardCommentStatus,
        pageTitle: page.pageTitle,
        pageHref: page.pageHref,
        date: formatDate(review.createdAt),
      };
    }),
    supportFundTotalMinor: supportFundTotal._sum.amountMinor ?? 0,
  };
}
