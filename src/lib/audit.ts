import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export type AuditEvent = {
  actorType: "SYSTEM" | "USER" | "ASSISTANT";
  actorId?: string | null;
  patientId?: string | null;
  callId?: string | null;
  eventType: string;
  previousState?: string | null;
  newState?: string | null;
  metadata?: any;
  requestId: string;
};

export async function writeAudit(e: AuditEvent) {
  try {
    // Idempotency key: combination of requestId, eventType, and callId
    const idempotencyKey = `${e.requestId}_${e.eventType}_${e.callId || 'no_call'}`;

    await db.insert(auditLogs)
      .values({
        actorType: e.actorType,
        actorId: e.actorId,
        patientId: e.patientId,
        callId: e.callId,
        eventType: e.eventType,
        previousState: e.previousState,
        newState: e.newState,
        metadata: e.metadata || {},
        requestId: e.requestId,
        idempotencyKey: idempotencyKey,
      })
      .onConflictDoNothing(); // Prevent double logging for retried webhooks
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Don't throw - audit failures shouldn't break the main flow
  }
}
