import { prisma } from "@/lib/prisma";
import { AuditResult } from "@/lib/generated/prisma/enums";

type AuditInput = {
  actorId?: string;
  action: string;
  targetType: string;
  targetId: string;
  beforeState?: unknown;
  afterState?: unknown;
  reason?: string;
  requestId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  result?: AuditResult;
};

function safeState(value: unknown) {
  if (value === undefined) return undefined;
  const sensitiveKeys = new Set(["password", "passwordHash", "token", "tokenHash", "sessionToken", "secret", "cookie", "authorization", "authorizationHeader"]);
  return JSON.parse(JSON.stringify(value, (key, nestedValue) => {
    if (sensitiveKeys.has(key.toLowerCase())) return "[REDACTED]";
    if (typeof nestedValue !== "string") return nestedValue;
    return nestedValue.length > 2000 ? `${nestedValue.slice(0, 2000)}…` : nestedValue;
  }));
}

type AuditClient = {
  adminAuditLog: {
    create: (args: { data: ReturnType<typeof adminAuditData> }) => Promise<unknown>;
  };
};

function adminAuditData(input: AuditInput) {
  return {
    actorId: input.actorId,
    action: input.action.slice(0, 120),
    targetType: input.targetType.slice(0, 80),
    targetId: input.targetId.slice(0, 80),
    beforeState: safeState(input.beforeState),
    afterState: safeState(input.afterState),
    reason: input.reason?.slice(0, 1000),
    requestId: input.requestId?.slice(0, 120),
    correlationId: input.correlationId?.slice(0, 120),
    ipAddress: input.ipAddress?.slice(0, 64),
    userAgent: input.userAgent?.slice(0, 500),
    result: input.result ?? AuditResult.SUCCESS,
  };
}

export async function recordAdminAuditWithClient(client: AuditClient, input: AuditInput) {
  return client.adminAuditLog.create({ data: adminAuditData(input) });
}

export async function recordAdminAudit(input: AuditInput) {
  return recordAdminAuditWithClient(prisma, input);
}
