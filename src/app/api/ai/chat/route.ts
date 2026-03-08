import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { transcript, message, history = [] } = await req.json();

    // Upgraded to Gemini 2.5 Pro for unmatched clinical reasoning and RAG depth
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

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return NextResponse.json({ error: "Failed to process chat", details: error.message }, { status: 500 });
  }
}
