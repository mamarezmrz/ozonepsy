import { AppointmentStatus, EntitlementStatus, ProductKind, ProductStatus, SessionUsageStatus, UserStatus } from "@/lib/generated/prisma/enums";
import { requireTherapist } from "@/lib/auth/therapist";
import { prisma } from "@/lib/prisma";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";

const productSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  kind: true,
  status: true,
  priceMinor: true,
  currency: true,
} as const;

const clientAppointmentStatuses = [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED, AppointmentStatus.COMPLETED] as const;

type ProductSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: ProductKind;
  status: ProductStatus;
  priceMinor: number;
  currency: string;
};

type AssignedData = {
  consultationRows: Array<{ product: ProductSummary; durationMinutes: number }>;
  courseRows: Array<{ courseProduct: { product: ProductSummary } }>;
};

async function loadAssignedData(specialistId: string): Promise<AssignedData> {
  const [consultationRows, courseRows] = await Promise.all([
    prisma.consultationProduct.findMany({
      where: { specialistId },
      orderBy: { product: { title: "asc" } },
      select: { product: { select: productSelect }, durationMinutes: true },
    }),
    prisma.courseSpecialist.findMany({
      where: { specialistId },
      orderBy: { courseProduct: { product: { title: "asc" } } },
      select: { courseProduct: { select: { product: { select: productSelect } } } },
    }),
  ]);
  return { consultationRows, courseRows };
}

function assignedProducts(data: AssignedData) {
  const products = [
    ...data.consultationRows.map((row) => ({ ...row.product, durationMinutes: row.durationMinutes })),
    ...data.courseRows.map((row) => ({ ...row.courseProduct.product, durationMinutes: null })),
  ];
  return Array.from(new Map(products.map((product) => [product.id, product])).values());
}

function displayName(profile: { displayName: string | null; firstName: string | null; lastName: string | null } | null, email: string) {
  return profile?.displayName?.trim() || [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || email;
}

function isUpcoming(status: AppointmentStatus, startsAt: Date, now = new Date()) {
  return (status === AppointmentStatus.SCHEDULED || status === AppointmentStatus.RESCHEDULED) && startsAt.getTime() > now.getTime();
}

export type TherapistClientRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  appointmentCount: number;
  completedSessions: number;
  remainingSessions: number | null;
  upcomingSessions: number;
  services: string[];
  nextAppointment: Date | null;
};

async function loadClientRows(specialistId: string, assignedProductIds: string[]) {
  const [appointmentRows, entitlementRows] = await Promise.all([
    prisma.appointment.findMany({
      where: { specialistId, status: { in: [...clientAppointmentStatuses] } },
      orderBy: { startsAt: "asc" },
      select: { userId: true, productId: true, entitlementId: true, startsAt: true, status: true, product: { select: { title: true } } },
    }),
    assignedProductIds.length
      ? prisma.entitlement.findMany({
        where: { productId: { in: assignedProductIds }, status: { in: [EntitlementStatus.ACTIVE, EntitlementStatus.EXHAUSTED, EntitlementStatus.EXPIRED] } },
        select: {
          userId: true,
          productId: true,
          totalSessions: true,
          product: { select: { title: true } },
          appointments: { where: { status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED] } }, select: { id: true } },
          usages: { select: { status: true } },
        },
      })
      : Promise.resolve([]),
  ]);

  const userIds = Array.from(new Set([...appointmentRows.map((row) => row.userId), ...entitlementRows.map((row) => row.userId)]));
  if (!userIds.length) return [] satisfies TherapistClientRow[];

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, status: true, profile: { select: { displayName: true, firstName: true, lastName: true, phone: true } } },
  });
  const byId = new Map<string, TherapistClientRow>();
  for (const user of users) {
    byId.set(user.id, {
      id: user.id,
      name: displayName(user.profile, user.email),
      email: user.email,
      phone: user.profile?.phone ?? null,
      status: user.status,
      appointmentCount: 0,
      completedSessions: 0,
      remainingSessions: null,
      upcomingSessions: 0,
      services: [],
      nextAppointment: null,
    });
  }

  const now = new Date();
  for (const appointment of appointmentRows) {
    const client = byId.get(appointment.userId);
    if (!client) continue;
    client.appointmentCount += 1;
    if (appointment.status === AppointmentStatus.COMPLETED && !appointment.entitlementId) client.completedSessions += 1;
    if (isUpcoming(appointment.status, appointment.startsAt, now)) {
      client.upcomingSessions += 1;
      if (!client.nextAppointment || appointment.startsAt < client.nextAppointment) client.nextAppointment = appointment.startsAt;
    }
    if (!client.services.includes(appointment.product.title)) client.services.push(appointment.product.title);
  }
  for (const entitlement of entitlementRows) {
    const client = byId.get(entitlement.userId);
    if (!client) continue;
    if (!client.services.includes(entitlement.product.title)) client.services.push(entitlement.product.title);
    client.completedSessions += entitlement.usages.filter((usage) => usage.status === SessionUsageStatus.COMPLETED).length;
    if (entitlement.totalSessions !== null) {
      const remaining = Math.max(entitlement.totalSessions - entitlement.usages.filter((usage) => usage.status === SessionUsageStatus.COMPLETED).length - entitlement.appointments.length, 0);
      client.remainingSessions = (client.remainingSessions ?? 0) + remaining;
    }
  }

  return [...byId.values()].sort((left, right) => {
    if (left.nextAppointment && right.nextAppointment) return left.nextAppointment.getTime() - right.nextAppointment.getTime();
    if (left.nextAppointment) return -1;
    if (right.nextAppointment) return 1;
    return left.name.localeCompare(right.name, "fa");
  });
}

export type TherapistSessionRow = Awaited<ReturnType<typeof listTherapistSessions>>["rows"][number];

export async function listTherapistSessions(query: AdminListQuery) {
  const therapist = await requireTherapist();
  const where = {
    specialistId: therapist.specialist.id,
    ...(query.search ? { OR: [
      { user: { email: { contains: query.search, mode: "insensitive" as const } } },
      { user: { profile: { is: { displayName: { contains: query.search, mode: "insensitive" as const } } } } },
      { product: { title: { contains: query.search, mode: "insensitive" as const } } },
    ] } : {}),
  };
  const orderBy = query.sort === "status" ? { status: query.direction } : { startsAt: query.direction };
  const [total, rows] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      orderBy,
      skip: paginationOffset(query),
      take: query.pageSize,
      select: {
        id: true,
        status: true,
        startsAt: true,
        endsAt: true,
        meetingUrl: true,
        notes: true,
        createdAt: true,
        user: { select: { id: true, email: true, profile: { select: { displayName: true, firstName: true, lastName: true } } } },
        product: { select: { id: true, title: true, kind: true } },
        usage: { select: { status: true } },
      },
    }),
  ]);
  return { rows, meta: pageMeta(total, query) };
}

export async function getTherapistClients() {
  const therapist = await requireTherapist();
  const assigned = await loadAssignedData(therapist.specialist.id);
  return loadClientRows(therapist.specialist.id, assignedProducts(assigned).map((product) => product.id));
}

export async function getTherapistServices() {
  const therapist = await requireTherapist();
  const assigned = await loadAssignedData(therapist.specialist.id);
  return {
    consultations: assigned.consultationRows.map((row) => ({ ...row.product, durationMinutes: row.durationMinutes })),
    courses: assigned.courseRows.map((row) => row.courseProduct.product),
  };
}

export type TherapistReviewRow = Awaited<ReturnType<typeof listTherapistReviews>>["rows"][number];

export async function listTherapistReviews(query: AdminListQuery) {
  const therapist = await requireTherapist();
  const assigned = await loadAssignedData(therapist.specialist.id);
  const productIds = assignedProducts(assigned).map((product) => product.id);
  const where = {
    productId: { in: productIds },
    ...(query.search ? { OR: [
      { body: { contains: query.search, mode: "insensitive" as const } },
      { user: { email: { contains: query.search, mode: "insensitive" as const } } },
      { product: { title: { contains: query.search, mode: "insensitive" as const } } },
    ] } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: query.direction },
      skip: paginationOffset(query),
      take: query.pageSize,
      select: { id: true, rating: true, body: true, status: true, createdAt: true, user: { select: { email: true, profile: { select: { displayName: true } } } }, product: { select: { title: true } } },
    }),
  ]);
  return { rows, meta: pageMeta(total, query) };
}

export async function getTherapistOverview() {
  const therapist = await requireTherapist();
  const specialistId = therapist.specialist.id;
  const [assigned, upcomingCount, upcoming] = await Promise.all([
    loadAssignedData(specialistId),
    prisma.appointment.count({ where: { specialistId, startsAt: { gte: new Date() }, status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED] } } }),
    prisma.appointment.findMany({
      where: { specialistId, startsAt: { gte: new Date() }, status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED] } },
      orderBy: { startsAt: "asc" },
      take: 6,
      select: { id: true, status: true, startsAt: true, meetingUrl: true, user: { select: { email: true, profile: { select: { displayName: true, firstName: true, lastName: true } } } }, product: { select: { title: true } } },
    }),
  ]);
  const products = assignedProducts(assigned);
  const clients = await loadClientRows(specialistId, products.map((product) => product.id));
  const ownReviewCount = products.length
    ? await prisma.review.count({ where: { productId: { in: products.map((product) => product.id) } } })
    : 0;
  return {
    metrics: [
      { label: "مراجعان", value: clients.length },
      { label: "جلسات آینده", value: upcomingCount },
      { label: "خدمات من", value: products.length },
      { label: "بازخوردها", value: ownReviewCount },
    ],
    upcoming,
    recentReviews: products.length
      ? await prisma.review.findMany({
        where: { productId: { in: products.map((product) => product.id) } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, body: true, rating: true, status: true, createdAt: true, product: { select: { title: true } }, user: { select: { email: true, profile: { select: { displayName: true } } } } },
      })
      : [],
    clients,
    services: products,
  };
}
