import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "calls.json");

async function getCalls() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveCalls(calls: any[]) {
  await fs.writeFile(DATA_FILE, JSON.stringify(calls, null, 2));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received Vapi Webhook:", body);

    // Vapi sends different message types. We care about 'end-of-call-report' or 'call.status.completed'
    // Depending on the Vapi version/config, it might be body.message.type
    const message = body.message || body;

    if (message.type === "end-of-call-report") {
      const callData = {
        id: message.call.id,
        timestamp: new Date().toISOString(),
        customerNumber: message.call.customer?.number || "Web Call",
        summary: message.summary || "No summary provided",
        transcript: message.transcript || "",
        analysis: message.analysis || {},
        recordingUrl: message.recordingUrl,
        status: "pending", // pending assignment to doctor
        assignedDoctor: null,
      };

      const calls = await getCalls();
      // Avoid duplicates
      const existingIndex = calls.findIndex((c: any) => c.id === callData.id);
      if (existingIndex > -1) {
        calls[existingIndex] = { ...calls[existingIndex], ...callData };
      } else {
        calls.push(callData);
      }

      await saveCalls(calls);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const calls = await getCalls();
  return NextResponse.json(calls);
}

export async function PATCH(req: Request) {
  try {
    const { id, assignedDoctor } = await req.json();
    const calls = await getCalls();
    const index = calls.findIndex((c: any) => c.id === id);

    if (index > -1) {
      calls[index].assignedDoctor = assignedDoctor;
      calls[index].status = "assigned";
      await saveCalls(calls);
      return NextResponse.json(calls[index]);
    }

    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update call" },
      { status: 500 },
    );
  }
}
