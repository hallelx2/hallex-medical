import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/db";
import { triageCalls } from "@/db/schema";
import { eq } from "drizzle-orm";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { transcript, message, history = [], callId } = await req.json();

    // Powered by Gemini 2.5 Pro for unmatched clinical reasoning and RAG depth
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `You are an expert clinical consultant. I am a doctor reviewing a triage call. Here is the full transcript of the call: \n\n ${transcript}` }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I have reviewed the interaction using Gemini 2.5 Pro's advanced reasoning. How can I assist you with this complex case?" }],
        },
        ...history
      ],
    });

    const result = await chat.sendMessageStream(message);
    
    let fullResponse = "";
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponse += chunkText;
          controller.enqueue(new TextEncoder().encode(chunkText));
        }
        
        if (callId) {
          const updatedHistory = [
            ...history.map((h: any) => ({ role: h.role, text: h.parts[0].text })),
            { role: "user", text: message },
            { role: "model", text: fullResponse }
          ];
          
          await db.update(triageCalls)
            .set({ chatHistory: updatedHistory })
            .where(eq(triageCalls.vapiCallId, callId));
        }
        
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process chat", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
