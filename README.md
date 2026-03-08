# St. Mary's Voice Triage System (Hallex Medical)

An advanced, hospital-grade AI Voice Triage and Clinical Management Dashboard. This application serves as the digital command center for medical facilities using Vapi voice agents to automate patient intake and symptom analysis.

**Creator:** Halleluyah Oludele

---

## 🚀 Frontier Clinical Features

### 1. **Frontier AI Decision Support (Gemini 2.5 Pro)**
- **State-of-the-Art Reasoning:** Leverages Gemini 2.5 Pro for unmatched clinical reasoning and ICD-10 medical coding precision.
- **Automated Care Plans:** Instantly generates empathetic patient follow-up instructions based on the triage interaction.
- **Clinical Second Opinion:** Provides doctors with a "psychology" layer—detecting subtle risks or missed symptoms in the patient's voice.
- **Medical Billing (ICD-10):** Automatically suggests diagnosis codes to accelerate insurance reimbursement.

### 2. **Interactive RAG: "Chat with the Case"**
- Doctors can interrogate the full call transcript via an integrated AI chat interface powered by Gemini 2.5 Pro. 
- Ask complex questions like *"What medications did the patient mention?"* or *"Was there a history of asthma?"* and get instant, grounded answers.

### 3. **EMR-Linked Patient Management**
- **Unified Patient Profiles:** Automatically links incoming calls to unique patient records via phone number.
- **Longitudinal History:** Persistent database storage using **Neon PostgreSQL** and **Drizzle ORM** to track patient interactions over time.

### 4. **High-Fidelity Clinical UI/UX**
- **Split-Screen Triage Drawer:** A sophisticated, tabbed slide-over panel for deep-dive case reviews without losing queue context.
- **Live Status Monitoring:** Real-time visual feedback for active triage sessions, emergency red flags, and doctor workload.
- **Branded Auth Suite:** A premium, white-labeled authentication portal using **Clerk Elements** and **Plus Jakarta Sans**.

---

## 🛠 Tech Stack

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Voice Intelligence:** [Vapi.ai](https://vapi.ai/)
- **AI Frontier Model:** [Google Gemini 2.5 Pro](https://ai.google.dev/)
- **Database:** [Neon PostgreSQL](https://neon.tech/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication:** [Clerk](https://clerk.com/)
- **Styling:** Tailwind CSS 4.0
- **Type Safety:** TypeScript

---

## 🏥 Triage Flow

1. **Intake:** Patient calls the Vapi Agent (e.g., Dr. Trevor).
2. **Analysis:** Vapi extracts structured clinical data (Chief Complaint, Triage Grade, etc.) and fires a webhook.
3. **Queue:** The dashboard receives the webhook and **automatically assigns** the case to the doctor with the lowest current workload.
4. **Review:** The doctor opens the **Case Slider**, reviews the **Gemini 2.5 Pro Analysis**, interrogates the transcript via **AI Chat**, and dispatches the **Care Plan**.

---

## 📄 License

Created for Hallex Medical Center. All rights reserved. 
**Developer:** Halleluyah Oludele
