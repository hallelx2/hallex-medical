import { NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import { auth } from "@clerk/nextjs/server";

const VAPI_ASSISTANT_ID = process.env.VAPI_OUTBOUND_ASSISTANT_ID?.trim();
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID?.trim();

export async function POST(req: Request) {
  console.log("VAPI_ASSISTANT_ID:", VAPI_ASSISTANT_ID);
  console.log("VAPI_PHONE_NUMBER_ID:", VAPI_PHONE_NUMBER_ID);
  
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = crypto.randomUUID();
  const { phoneNumber, patientId, caseId } = await req.json();

  if (!phoneNumber) {
    return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  }

  if (!VAPI_ASSISTANT_ID || !VAPI_PHONE_NUMBER_ID) {
    console.error("Vapi Environment Variables missing");
    return NextResponse.json({ error: "System configuration error" }, { status: 500 });
  }

  // 4) Audit Outbound Call Requested
  await writeAudit({
    actorType: "USER",
    actorId: userId,
    patientId,
    eventType: "OUTBOUND_CALL_REQUESTED",
    metadata: { assistantId: VAPI_ASSISTANT_ID, phoneNumber, caseId },
    requestId,
  });

  try {
    const response = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
      },
      body: JSON.stringify({
        assistantId: VAPI_ASSISTANT_ID,
        phoneNumberId: VAPI_PHONE_NUMBER_ID,
        customer: { number: phoneNumber },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create call in Vapi");
    }

    // 4) Audit Outbound Call Created
    await writeAudit({
      actorType: "SYSTEM",
      actorId: "VAPI_API",
      callId: data.id,
      patientId,
      eventType: "OUTBOUND_CALL_CREATED",
      metadata: { callId: data.id },
      requestId,
    });

    return NextResponse.json({ success: true, callId: data.id });
  } catch (error: any) {
    console.error("Vapi Outbound Error:", error);

    // 4) Audit Outbound Call Failed
    await writeAudit({
      actorType: "SYSTEM",
      actorId: "VAPI_API",
      patientId,
      eventType: "OUTBOUND_CALL_CREATE_FAILED",
      metadata: { errorMessage: error.message },
      requestId,
    });

    return NextResponse.json({ error: "Outbound call failed", details: error.message }, { status: 500 });
  }
}
