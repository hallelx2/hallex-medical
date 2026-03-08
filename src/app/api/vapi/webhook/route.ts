import { NextResponse } from "next/server";
import { db } from "@/db";
import { triageCalls, patients } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { writeAudit } from "@/lib/audit";

export const dynamic = 'force-dynamic';

const DOCTORS = [
  "Dr. Michael Chen",
  "Dr. Elena Rodriguez",
  "Dr. James Wilson",
  "Dr. Sarah Patel"
];

async function getOrCreatePatient(phoneNumber: string) {
  const existing = await db.query.patients.findFirst({
    where: eq(patients.phoneNumber, phoneNumber),
  });

  if (existing) {
    await db.update(patients)
      .set({ lastInteraction: new Date() })
      .where(eq(patients.id, existing.id));
    return existing.id;
  }

  const result = await db.insert(patients)
    .values({ phoneNumber, lastInteraction: new Date() })
    .returning({ id: patients.id });
  
  return result[0].id;
}

async function autoAssignDoctor() {
  const results = await db
    .select({
      doctor: triageCalls.assignedDoctor,
      activeCount: count(),
    })
    .from(triageCalls)
    .where(eq(triageCalls.status, "assigned"))
    .groupBy(triageCalls.assignedDoctor);

  const stats = Object.fromEntries(
    results.map((r: { doctor: string | null; activeCount: number }) => [
      r.doctor || "Unknown",
      r.activeCount,
    ])
  );
  
  let minLoad = Infinity;
  let selectedDoctor = DOCTORS[0];

  for (const doc of DOCTORS) {
    const load = stats[doc] || 0;
    if (load < minLoad) {
      minLoad = load;
      selectedDoctor = doc;
    }
  }
  return selectedDoctor;
}

export async function POST(req: Request) {
  const requestId = req.headers.get("x-vapi-request-id") || crypto.randomUUID();

  try {
    const body = await req.json();
    const message = body.message || body;
    const vapiCallId = message.call?.id || message.callId;

    if (!vapiCallId) return NextResponse.json({ error: "No Call ID" });

    // A) Audit Webhook Received
    await writeAudit({
      actorType: "ASSISTANT",
      callId: vapiCallId,
      eventType: "VAPI_WEBHOOK_RECEIVED",
      metadata: { messageType: message.type, assistantId: message.call?.assistantId },
      requestId,
    });

    // 1. Handle Live Session Events
    if (message.type === 'call.started') {
      const phoneNumber = message.call?.customer?.number || 'Web Call';
      const patientId = await getOrCreatePatient(phoneNumber);

      await db.insert(triageCalls)
        .values({
          vapiCallId,
          patientId,
          customerNumber: phoneNumber,
          callStartedAt: new Date(),
          status: 'pending'
        })
        .onConflictDoUpdate({
          target: triageCalls.vapiCallId,
          set: { callStartedAt: new Date() }
        });

      await writeAudit({
        actorType: "SYSTEM",
        callId: vapiCallId,
        patientId,
        eventType: "CASE_STATE_CHANGED",
        previousState: "NULL",
        newState: "pending",
        metadata: { phoneNumber },
        requestId,
      });

      return NextResponse.json({ success: true });
    }

    if (message.type === 'call.ended') {
      await db.update(triageCalls)
        .set({ callEndedAt: new Date() })
        .where(eq(triageCalls.vapiCallId, vapiCallId));
      
      await writeAudit({
        actorType: "ASSISTANT",
        callId: vapiCallId,
        eventType: "CALL_ENDED",
        metadata: { endedAt: new Date().toISOString() },
        requestId,
      });

      return NextResponse.json({ success: true });
    }

    // 2. Handle Clinical Report & Auto-Assignment
    if (message.type === "end-of-call-report") {
      const { call, analysis, artifact, transcript } = message;
      const structuredData = analysis?.structuredData || {};
      
      const phoneNumber = call.customer?.number || "Web Call";
      const patientId = await getOrCreatePatient(phoneNumber);

      const assignedDoctor = await autoAssignDoctor();

      const callData = {
        vapiCallId: call.id,
        patientId,
        timestamp: new Date(call.startedAt || new Date()),
        customerNumber: phoneNumber,
        
        chiefComplaint: structuredData.chiefComplaint,
        doctorSummary: structuredData.doctorSummary,
        recommendedAction: structuredData.recommendedAction,
        symptomCategory: structuredData.symptomCategory,
        triageGrade: structuredData.triageGrade as any,
        severityScale: structuredData.severityScale,
        redFlagsPresent: structuredData.redFlagsPresent || false,
        riskFactors: structuredData.riskFactors || {},

        transcript: transcript || message.transcript,
        recordingUrl: artifact?.recordingUrl || message.recordingUrl,

        status: "assigned" as const,
        assignedDoctor,
      };

      await db.insert(triageCalls)
        .values(callData)
        .onConflictDoUpdate({
          target: triageCalls.vapiCallId,
          set: callData,
        });

      // B) Audit Clinical Report Persisted
      await writeAudit({
        actorType: "ASSISTANT",
        callId: vapiCallId,
        patientId,
        eventType: "CLINICAL_REPORT_PERSISTED",
        metadata: { 
          triageGrade: structuredData.triageGrade, 
          symptomCategory: structuredData.symptomCategory,
          redFlagsPresent: structuredData.redFlagsPresent 
        },
        requestId,
      });

      // C) Audit State Transition (Auto-assigned)
      await writeAudit({
        actorType: "SYSTEM",
        callId: vapiCallId,
        patientId,
        eventType: "CASE_STATE_CHANGED",
        previousState: "pending",
        newState: "assigned",
        metadata: { assignedDoctor, reason: "AUTO_ASSIGNMENT" },
        requestId,
      });

      return NextResponse.json({ success: true, assignedTo: assignedDoctor });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Failed", details: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const calls = await db.query.triageCalls.findMany({
      orderBy: (table: any, { desc }: any) => [desc(table.timestamp)],
    });
    return NextResponse.json(calls);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const requestId = crypto.randomUUID();
  try {
    const { id, assignedDoctor, status } = await req.json();
    
    // Get previous state
    const current = await db.query.triageCalls.findFirst({
      where: eq(triageCalls.vapiCallId, id)
    });

    const updated = await db.update(triageCalls)
      .set({ assignedDoctor, status: (status as any) || "assigned" })
      .where(eq(triageCalls.vapiCallId, id))
      .returning();

    if (updated.length > 0) {
      await writeAudit({
        actorType: "USER",
        callId: id,
        patientId: updated[0].patientId,
        eventType: "CASE_STATE_CHANGED",
        previousState: current?.status,
        newState: updated[0].status,
        metadata: { assignedDoctor, manuallyUpdated: true },
        requestId,
      });
    }

    return NextResponse.json(updated[0] || { error: "Not found" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const requestId = crypto.randomUUID();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const deleted = await db.delete(triageCalls)
      .where(eq(triageCalls.vapiCallId, id))
      .returning();

    if (deleted.length > 0) {
      await writeAudit({
        actorType: "USER",
        callId: id,
        eventType: "CASE_DELETED",
        metadata: { customerNumber: deleted[0].customerNumber },
        requestId,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed", details: error.message }, { status: 500 });
  }
}
