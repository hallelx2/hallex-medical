import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { summary, complaint, grade, transcript } = await req.json();

    // Upgraded to Gemini 2.5 Pro for state-of-the-art clinical insights and ICD-10 precision
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `
      You are an expert clinical triage assistant and medical coder at St. Mary's Hospital. 
      Based on the following patient interaction data, provide three specific outputs:
      
      1. PATIENT CARE PLAN: A concise, empathetic message to send to the patient (via SMS/Email) detailing their next steps, home care advice, and appointment urgency.
      2. CLINICAL SECOND OPINION: A professional, brief note for the doctor highlighting any subtle risks or follow-up questions they should ask based on the transcript.
      3. MEDICAL BILLING: Suggest the most appropriate ICD-10 Diagnosis Code and a brief billing description.

      DATA:
      - Chief Complaint: ${complaint}
      - Clinical Summary: ${summary}
      - Triage Grade: ${grade}
      - Full Transcript: ${transcript}

      Format your response as a JSON object with exactly these keys: "carePlan", "secondOpinion", "icd10Code", "billingDescription".
      Do not include any markdown formatting like triple backticks in your response, just the raw JSON string.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: "Failed to generate AI insights", details: error.message }, { status: 500 });
  }
}
