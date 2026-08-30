import { prisma } from "@/lib/prisma";

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
};

function safeState(value: unknown) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value, (_key, nestedValue) => {
    if (typeof nestedValue !== "string") return nestedValue;
    return nestedValue.length > 2000 ? `${nestedValue.slice(0, 2000)}…` : nestedValue;
  }));
}

export async function recordAdminAudit(input: AuditInput) {
  return prisma.adminAuditLog.create({
    data: {
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
    },
  });
}
