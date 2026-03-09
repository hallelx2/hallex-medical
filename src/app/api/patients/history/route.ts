import { NextResponse } from "next/server";
import { db } from "@/db";
import { triageCalls } from "@/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const currentCallId = searchParams.get("excludeCallId");

  if (!patientId) return NextResponse.json({ error: "Patient ID required" }, { status: 400 });

  try {
    // Fetch all calls for this patient except the one currently being viewed
    const history = await db.query.triageCalls.findMany({
      where: and(
        eq(triageCalls.patientId, patientId),
        currentCallId ? ne(triageCalls.vapiCallId, currentCallId) : undefined
      ),
      orderBy: [desc(triageCalls.timestamp)],
    });

    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch patient history" }, { status: 500 });
  }
}
