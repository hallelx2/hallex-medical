import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let settings = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.id, "current"),
    });

    if (!settings) {
      // Initialize default settings if none exist
      const result = await db.insert(systemSettings)
        .values({ id: "current" })
        .returning();
      settings = result[0];
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const updated = await db.insert(systemSettings)
      .values({ id: "current", ...data, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemSettings.id,
        set: { ...data, updatedAt: new Date() }
      })
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
