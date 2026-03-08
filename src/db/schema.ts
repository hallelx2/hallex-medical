import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const triageGradeEnum = pgEnum("triage_grade", [
  "EMERGENCY",
  "URGENT",
  "WITHIN_24_72_HOURS",
  "ROUTINE",
  "HOME_CARE"
]);

export const callStatusEnum = pgEnum("call_status", ["pending", "assigned", "completed"]);

export const doctors = pgTable("doctors", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").unique().notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  specialty: text("specialty"),
  role: text("role").default("doctor").notNull(), // 'admin' or 'doctor'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const triageCalls = pgTable("triage_calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  vapiCallId: text("vapi_call_id").unique().notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  callStartedAt: timestamp("call_started_at"),
  callEndedAt: timestamp("call_ended_at"),
  customerNumber: text("customer_number").notNull(),
  
  // Clinical Data from Vapi Structured Data extraction
  chiefComplaint: text("chief_complaint"),
  doctorSummary: text("doctor_summary"),
  recommendedAction: text("recommended_action"),
  symptomCategory: text("symptom_category"),
  triageGrade: triageGradeEnum("triage_grade"),
  severityScale: integer("severity_scale"),
  redFlagsPresent: boolean("red_flags_present").default(false),
  
  // Risk Factors (stored as JSON)
  riskFactors: jsonb("risk_factors"),
  
  // Transcription & Media
  transcript: text("transcript"),
  recordingUrl: text("recording_url"),
  
  // Dashboard Status
  status: callStatusEnum("status").default("pending").notNull(),
  assignedDoctor: text("assigned_doctor"),
});
