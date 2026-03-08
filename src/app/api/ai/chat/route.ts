import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { transcript, message, history = [] } = await req.json();

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
    
    // Create a readable stream to pipe Gemini's output directly to the client
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          controller.enqueue(new TextEncoder().encode(chunkText));
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
