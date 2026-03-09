import { NextResponse } from "next/server";
import { db } from "@/db";
import { triageCalls } from "@/db/schema";
import { eq, isNull, count } from "drizzle-orm";
import { writeAudit } from "@/lib/audit";

const DOCTORS = [
  "Dr. Michael Chen",
  "Dr. Elena Rodriguez",
  "Dr. James Wilson",
  "Dr. Sarah Patel"
];

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  try {
    // 1. Audit start
    await writeAudit({
      actorType: "SYSTEM",
      eventType: "ALGORITHM_RECALIBRATION_STARTED",
      requestId,
    });

    // 2. Load Balancing Logic
    // Find doctor with current min load
    const loadResults = await db
      .select({
        doctor: triageCalls.assignedDoctor,
        activeCount: count(),
      })
      .from(triageCalls)
      .where(eq(triageCalls.status, "assigned"))
      .groupBy(triageCalls.assignedDoctor);

    const stats = Object.fromEntries(
      loadResults.map((r: { doctor: string | null; activeCount: number }) => [
        r.doctor || "Unknown",
        r.activeCount,
      ])
    );

    // 3. Find pending or poorly distributed cases
    const unassignedCases = await db.query.triageCalls.findMany({
      where: eq(triageCalls.status, "pending")
    });

    let assignedCount = 0;
    for (const triageCase of unassignedCases) {
      // Find best doctor at this specific moment
      let minLoad = Infinity;
      let selectedDoctor = DOCTORS[0];

      for (const doc of DOCTORS) {
        const load = stats[doc] || 0;
        if (load < minLoad) {
          minLoad = load;
          selectedDoctor = doc;
        }
      }

      // Assign and update local stats for next iteration
      await db.update(triageCalls)
        .set({ assignedDoctor: selectedDoctor, status: "assigned" })
        .where(eq(triageCalls.vapiCallId, triageCase.vapiCallId));
      
      stats[selectedDoctor] = (stats[selectedDoctor] || 0) + 1;
      assignedCount++;
    }

    await writeAudit({
      actorType: "SYSTEM",
      eventType: "ALGORITHM_RECALIBRATION_COMPLETED",
      metadata: { casesProcessed: unassignedCases.length, successfulAssignments: assignedCount },
      requestId,
    });

    return NextResponse.json({ success: true, processed: unassignedCases.length });
  } catch (error: any) {
    return NextResponse.json({ error: "Recalibration failed", details: error.message }, { status: 500 });
  }
}
