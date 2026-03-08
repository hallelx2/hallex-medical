import { NextResponse } from "next/server";
import { db } from "@/db";
import { triageCalls, patients } from "@/db/schema";
import { eq, count } from "drizzle-orm";

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
  const dbInstance = db;
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
  try {
    const body = await req.json();
    const message = body.message || body;
    const vapiCallId = message.call?.id || message.callId;

    if (!vapiCallId) return NextResponse.json({ error: "No Call ID" });

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
      return NextResponse.json({ success: true });
    }

    if (message.type === 'call.ended') {
      await db.update(triageCalls)
        .set({ callEndedAt: new Date() })
        .where(eq(triageCalls.vapiCallId, vapiCallId));
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
  try {
    const { id, assignedDoctor, status } = await req.json();
    const updated = await db.update(triageCalls)
      .set({ assignedDoctor, status: (status as any) || "assigned" })
      .where(eq(triageCalls.vapiCallId, id))
      .returning();
    return NextResponse.json(updated[0] || { error: "Not found" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed", details: error.message }, { status: 500 });
  }
}
