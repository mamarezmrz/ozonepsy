import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

function isCurrentPrismaClient(client: PrismaClient | undefined): client is PrismaClient {
  if (!client) return false;

  // A dev server can keep the previous singleton alive across a Prisma Client
  // regeneration. Detect that stale instance before using a newly generated
  // model delegate such as consultationBenefitsSection.
  const candidate = client as PrismaClient & {
    consultationBenefitsSection?: unknown;
    individualConsultationCaseSection?: unknown;
    individualConsultationTopic?: unknown;
    groupTherapySession?: unknown;
    _runtimeDataModel?: { models?: Record<string, { fields?: Array<{ name: string }> }> };
  };
  const groupFields = candidate._runtimeDataModel?.models?.GroupTherapyProduct?.fields?.map((field) => field.name) ?? [];
  const hasCurrentGroupModel = groupFields.length
    ? ["instructorName", "durationSessions", "sessions"].every((field) => groupFields.includes(field))
    : typeof candidate.groupTherapySession !== "undefined";

  return typeof candidate.consultationBenefitsSection !== "undefined"
    && typeof candidate.individualConsultationCaseSection !== "undefined"
    && typeof candidate.individualConsultationTopic !== "undefined"
    && hasCurrentGroupModel;
}

function getCurrentPrismaClient() {
  if (!isCurrentPrismaClient(globalForPrisma.prisma)) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

if (!isCurrentPrismaClient(globalForPrisma.prisma)) globalForPrisma.prisma = createPrismaClient();

// Resolve the client on every delegate access so a long-running dev server can
// recover from a Prisma Client regeneration without serving an old data model.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getCurrentPrismaClient();
    const value = Reflect.get(client as object, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
