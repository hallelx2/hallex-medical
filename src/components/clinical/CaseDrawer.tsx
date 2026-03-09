"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type CallReport = {
  vapiCallId: string;
  timestamp: string;
  customerNumber: string;
  doctorSummary: string | null;
  chiefComplaint: string | null;
  recommendedAction: string | null;
  transcript: string | null;
  recordingUrl: string | null;
  status: "pending" | "assigned" | "completed";
  assignedDoctor: string | null;
  priority: "High" | "Medium" | "Low";
  redFlagsPresent: boolean;
  triageGrade: string | null;
  severityScale: number | null;
  riskFactors: any;
  patientId: string | null;
  carePlan: string | null;
  secondOpinion: string | null;
  icd10Code: string | null;
  billingDescription: string | null;
  chatHistory: any;
};

type CaseDrawerProps = {
  selectedCase: CallReport | null;
  isOpen: boolean;
  onClose: () => void;
  onMutate: () => void;
  doctors: { id: string; name: string; specialty: string | null; color: string }[];
};

export default function CaseDrawer({ selectedCase, isOpen, onClose, onMutate, doctors }: CaseDrawerProps) {
  const [activeTab, setActiveTab] = useState<"analysis" | "chat" | "transcript" | "history">("analysis");
  const [isAssigning, setIsAssigning] = useState(false);
  
  // AI State
  const [aiInsights, setAiInsights] = useState<{ carePlan: string; secondOpinion: string; icd10Code?: string; billingDescription?: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isCallingOutbound, setIsCallingOutbound] = useState(false);
  
  // Chat State
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // History State
  const [patientHistory, setPatientHistory] = useState<CallReport[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (selectedCase) {
      if (selectedCase.carePlan) {
        setAiInsights({
          carePlan: selectedCase.carePlan,
          secondOpinion: selectedCase.secondOpinion || "",
          icd10Code: selectedCase.icd10Code || "",
          billingDescription: selectedCase.billingDescription || ""
        });
      } else {
        setAiInsights(null);
      }
      
      if (selectedCase.chatHistory) {
        setChatHistory(selectedCase.chatHistory as any);
      } else {
        setChatHistory([]);
      }

      // Fetch History
      if (selectedCase.patientId) {
        fetchHistory(selectedCase.patientId, selectedCase.vapiCallId);
      }
    }
    setChatMessage("");
    setActiveTab("analysis");
  }, [selectedCase?.vapiCallId]);

  const fetchHistory = async (patientId: string, currentId: string) => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch(`/api/patients/history?patientId=${patientId}&excludeCallId=${currentId}`);
      if (res.ok) {
        const data = await res.json();
        setPatientHistory(data);
      }
    } catch (err) {
      console.error("History Error:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  if (!isOpen || !selectedCase) return null;

  const generateAiInsights = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: selectedCase.doctorSummary,
          complaint: selectedCase.chiefComplaint,
          grade: selectedCase.triageGrade,
          transcript: selectedCase.transcript,
          callId: selectedCase.vapiCallId
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsights(data);
        onMutate();
      }
    } catch (err) {
      console.error("AI Insight Error:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedCase.transcript) return;
    
    const userMsg = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: 'user' as const, text: userMsg }]);
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: selectedCase.transcript,
          message: userMsg,
          history: chatHistory.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
          callId: selectedCase.vapiCallId
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";

      setChatHistory(prev => [...prev, { role: 'model', text: "" }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        assistantMsg += chunk;
        
        setChatHistory(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', text: assistantMsg };
          return updated;
        });
      }
      onMutate();
    } catch (err) {
      console.error("Chat Error:", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const triggerOutboundCall = async () => {
    if (!selectedCase) return;
    
    // Proactive Validation: Vapi Free Tier only supports US numbers (+1)
    const isUSNumber = selectedCase.customerNumber.startsWith("+1") || selectedCase.customerNumber.startsWith("1");
    if (!isUSNumber) {
      alert("Outbound restricted: Vapi Free Tier only supports US (+1) numbers. Please verify the patient's phone format.");
      return;
    }

    setIsCallingOutbound(true);
    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: selectedCase.customerNumber,
          patientId: selectedCase.patientId,
          caseId: selectedCase.vapiCallId
        }),
      });
      if (res.ok) {
        alert("Outbound call successfully initiated.");
      } else {
        const error = await res.json();
        const errorMessage = error.details || 'Unknown error';
        
        // Handle the specific Vapi international restriction error
        if (errorMessage.toLowerCase().includes("international")) {
           alert("Call Failed: This system is currently configured for US-only triage. International calling is restricted by the Vapi provider tier.");
        } else {
           alert(`Failed to initiate call: ${errorMessage}`);
        }
      }
    } catch (err) {
      console.error("Outbound Call Error:", err);
    } finally {
      setIsCallingOutbound(false);
    }
  };

  const assignDoctor = async (doctorName: string) => {
    try {
      const res = await fetch("/api/vapi/webhook", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedCase.vapiCallId, assignedDoctor: doctorName }),
      });
      if (res.ok) {
        onMutate();
        setIsAssigning(false);
      }
    } catch (err) {
      console.error("Failed to assign doctor:", err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[40] transition-opacity animate-in fade-in duration-300" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white dark:bg-slate-900 z-[50] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-in-out font-jakarta">
        <div className={`p-8 text-white shrink-0 ${selectedCase.redFlagsPresent ? 'bg-red-600' : 'bg-primary'}`}>
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-md">
                <span className="material-symbols-outlined text-4xl">medical_information</span>
              </div>
              <div>
                <h3 className="font-bold text-3xl tracking-tight leading-none">{selectedCase.customerNumber}</h3>
                <p className="text-xs text-white/70 font-bold uppercase tracking-[0.2em] mt-2 font-jakarta">EMR-LINKED PATIENT</p>
              </div>
            </div>
            <button onClick={onClose} className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="flex bg-black/10 rounded-xl p-1 mt-4">
             {[
               { id: 'analysis', label: 'Clinical Analysis', icon: 'psychology' },
               { id: 'chat', label: 'Chat with Case', icon: 'forum' },
               { id: 'transcript', label: 'Full Transcript', icon: 'notes' }
             ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
               >
                 <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                 {tab.label}
               </button>
               ))}
               <button
               onClick={() => setActiveTab('history')}
               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
               >
               <span className="material-symbols-outlined text-sm">history</span>
               History
               </button>
               </div>
               </div>

               <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/30">
               {activeTab === 'history' && (
               <div className="space-y-6 animate-in fade-in duration-500 font-jakarta">
               <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Medical History (Vapi Logs)</h4>
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded text-[9px] font-black">{patientHistory.length} PREVIOUS SESSIONS</span>
               </div>

               {isHistoryLoading ? (
                 <div className="py-20 flex flex-col items-center opacity-30">
                    <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-xs font-bold uppercase tracking-widest">Retrieving EMR context...</p>
                 </div>
               ) : patientHistory.length === 0 ? (
                 <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-4xl text-slate-200 mb-4">person_search</span>
                    <p className="text-sm font-bold text-slate-400">No previous interactions found for this patient.</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                    {patientHistory.map((pastCall) => (
                      <div key={pastCall.vapiCallId} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                         <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(pastCall.timestamp).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${pastCall.priority === 'High' ? 'text-red-500' : 'text-emerald-500'}`}>{pastCall.priority} PRIORITY</span>
                         </div>
                         <p className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed italic">"{pastCall.doctorSummary || pastCall.chiefComplaint}"</p>
                         <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <span className="size-1.5 rounded-full bg-primary"></span>
                               <span className="text-[9px] font-black text-slate-400 uppercase">Handled by: {pastCall.assignedDoctor || 'N/A'}</span>
                            </div>
                            <button className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">View Transcript</button>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
               </div>
               )}
               {activeTab === 'analysis' && (

            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-jakarta">
              <section>
                <div className="flex justify-between items-center mb-4">
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Initial AI Summary</h4>
                   {!aiInsights && (
                     <button 
                       onClick={generateAiInsights}
                       disabled={isAiLoading}
                       className="text-[10px] font-black text-primary uppercase flex items-center gap-1 hover:underline disabled:opacity-50"
                     >
                        <span className={`material-symbols-outlined text-xs ${isAiLoading ? 'animate-spin' : ''}`}>bolt</span> 
                        Run Gemini 2.5 Analysis
                     </button>
                   )}
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                   <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed font-medium italic">"{selectedCase.doctorSummary || 'Awaiting agent report...'}"</p>
                </div>
              </section>

              {aiInsights && (
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-primary/5 p-5 rounded-3xl border border-primary/10">
                         <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-2">Diagnosis Code (ICD-10)</p>
                         <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{aiInsights.icd10Code}</p>
                         <p className="text-[10px] text-slate-500 mt-1 leading-tight font-medium">{aiInsights.billingDescription}</p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                         <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Triage Action</p>
                         <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 leading-relaxed">{selectedCase.recommendedAction}</p>
                      </div>
                   </div>

                   <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl border border-slate-800">
                      <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <span className="material-symbols-outlined text-sm">auto_awesome</span> Gemini 2.5 - Patient Care Plan
                      </h5>
                      <p className="text-sm text-slate-300 leading-relaxed font-medium">{aiInsights.carePlan}</p>
                      <button 
                        onClick={triggerOutboundCall}
                        disabled={isCallingOutbound}
                        className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                         <span className={`material-symbols-outlined text-sm ${isCallingOutbound ? 'animate-spin' : ''}`}>
                            {isCallingOutbound ? 'refresh' : 'call'}
                         </span> 
                         {isCallingOutbound ? 'Initiating Vapi Outbound...' : 'Dispatch Outbound Care Coordinator'}
                      </button>
                   </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-full animate-in fade-in duration-500 font-jakarta">
               <div className="flex-1 space-y-4 mb-6">
                  {chatHistory.length === 0 && (
                    <div className="text-center py-20 flex flex-col items-center opacity-30">
                       <span className="material-symbols-outlined text-6xl mb-4">smart_toy</span>
                       <p className="text-sm font-bold uppercase tracking-widest">Interrogate the Case</p>
                       <p className="text-xs mt-2 max-w-[200px]">Ask Gemini details about history, medications, or symptoms mentioned in call.</p>
                    </div>
                  )}
                  {chatHistory.map((chat, i) => (
                    <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed ${chat.role === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-sm shadow-sm'}`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{chat.text}</ReactMarkdown>
                       </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                       <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl animate-pulse flex gap-2">
                          <div className="size-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="size-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="size-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                       </div>
                    </div>
                  )}
               </div>
               <form onSubmit={handleSendMessage} className="sticky bottom-0 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-2 flex gap-3 shadow-xl">
                  <input 
                     value={chatMessage}
                     onChange={(e) => setChatMessage(e.target.value)}
                     placeholder="Ask Gemini about the transcript..."
                     className="flex-1 bg-transparent border-none px-4 py-3 text-sm focus:ring-0 outline-none"
                  />
                  <button type="submit" disabled={isChatLoading || !chatMessage.trim()} className="bg-primary text-white size-12 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
                     <span className="material-symbols-outlined">send</span>
                  </button>
               </form>
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="animate-in fade-in duration-500 pb-10 font-jakarta">
               <div className="space-y-6">
                  {selectedCase.transcript ? selectedCase.transcript.split('\n').map((line, i) => (
                    <div key={i} className="flex gap-4 group">
                       <div className="w-16 shrink-0 text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">LINE {i+1}</div>
                       <div className="flex-1 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{line}</div>
                    </div>
                  )) : <p className="text-center py-20 text-slate-400 italic">No interaction transcript available.</p>}
               </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
          <button 
            onClick={() => setIsAssigning(!isAssigning)}
            className="w-full bg-slate-950 dark:bg-primary text-white font-black py-5 rounded-3xl hover:opacity-90 transition-all shadow-2xl flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs"
          >
            <span className="material-symbols-outlined text-lg">clinical_notes</span>
            {selectedCase.assignedDoctor ? `CASE ASSIGNED TO ${selectedCase.assignedDoctor.toUpperCase()}` : 'INITIALIZE CLINICAL ASSIGNMENT'}
          </button>

          {isAssigning && (
            <div className="absolute inset-x-0 bottom-0 p-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-full duration-300 z-[60] shadow-2xl rounded-t-[3rem]">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h4 className="font-bold text-xl tracking-tight leading-none text-slate-900 dark:text-white">Route to Coverage</h4>
                    <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">On-Duty Medical Staff</p>
                 </div>
                 <button onClick={() => setIsAssigning(false)} className="size-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center transition-all hover:bg-slate-50">
                    <span className="material-symbols-outlined text-slate-400">close</span>
                 </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {doctors.map(doc => (
                   <button key={doc.id} onClick={() => assignDoctor(doc.name)} className="p-5 border border-slate-100 dark:border-slate-800 rounded-3xl hover:border-primary hover:bg-primary/5 transition-all text-sm font-bold text-left flex items-center gap-4 group">
                      <div className={`size-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm group-hover:scale-110 transition-transform text-primary font-black`}>{doc.name[4]}</div>
                      <div>
                         <p className="leading-none text-slate-900 dark:text-white">{doc.name}</p>
                         <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">{doc.specialty || 'General'}</p>
                      </div>
                   </button>
                 ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
