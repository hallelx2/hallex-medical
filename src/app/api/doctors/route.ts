import { NextResponse } from "next/server";
import { db } from "@/db";
import { doctors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allDoctors = await db.query.doctors.findMany({
      where: eq(doctors.isActive, true),
    });
    return NextResponse.json(allDoctors);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
  }
}
