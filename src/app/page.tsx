"use client";

import React, { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import DashboardLayout from "@/components/DashboardLayout";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

const DOCTORS = [
  { id: "1", name: "Dr. Michael Chen", specialty: "Cardiology", status: "Active", color: "bg-primary/10", icon: "person" },
  { id: "2", name: "Dr. Elena Rodriguez", specialty: "ER Lead", status: "Active", color: "bg-blue-100 dark:bg-blue-900/40", icon: "medical_services" },
  { id: "3", name: "Dr. James Wilson", specialty: "Neurology", status: "In Call", color: "bg-purple-100 dark:bg-purple-900/40", icon: "neurology" },
  { id: "4", name: "Dr. Sarah Patel", specialty: "Pediatrics", status: "Active", color: "bg-indigo-100 dark:bg-indigo-900/40", icon: "pediatrics" },
];

export default function OverviewPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "chat" | "transcript">("analysis");
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  
  // AI State
  const [aiInsights, setAiInsights] = useState<{ carePlan: string; secondOpinion: string; icd10Code?: string; billingDescription?: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isCallingOutbound, setIsCallingOutbound] = useState(false);
  
  // Chat State
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const { data: calls = [], mutate, isLoading: isTableLoading } = useSWR<CallReport[]>(
    "/api/vapi/webhook",
    fetcher,
    { refreshInterval: 5000 }
  );

  const selectedCase = calls.find(c => c.vapiCallId === selectedCaseId);

  const generateAiInsights = async () => {
    if (!selectedCase) return;
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
        mutate();
      }
    } catch (err) {
      console.error("AI Insight Error:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedCase?.transcript) return;
    
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
      mutate();
    } catch (err) {
      console.error("Chat Error:", err);
    } finally {
      setIsChatLoading(false);
    }
  };

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
    }
    setChatMessage("");
    setActiveTab("analysis");
  }, [selectedCaseId]);

  const triggerOutboundCall = async () => {
    if (!selectedCase) return;
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
        alert(`Failed to initiate call: ${error.details || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Outbound Call Error:", err);
    } finally {
      setIsCallingOutbound(false);
    }
  };

  const assignDoctor = async (callId: string, doctorName: string) => {
    try {
      const res = await fetch("/api/vapi/webhook", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: callId, assignedDoctor: doctorName }),
      });
      if (res.ok) {
        mutate();
        setIsAssigning(null);
      }
    } catch (err) {
      console.error("Failed to assign doctor:", err);
    }
  };

  const pendingCount = calls.filter((c) => c.status === "pending").length;
  const criticalCount = calls.filter((c) => c.redFlagsPresent).length;

  return (
    <DashboardLayout>
      <div className="p-8 relative min-h-full font-jakarta">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-tight">Total Interactions</p>
                <h3 className="text-3xl font-bold mt-1">{String(calls.length).padStart(2, '0')}</h3>
                <p className="text-slate-400 text-xs font-bold mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm font-bold">history</span> All agent calls
                </p>
              </div>
              <div className="size-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">call</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-tight">Critical Cases</p>
                <h3 className={`text-3xl font-bold mt-1 ${criticalCount > 0 ? "text-red-500" : ""}`}>{String(criticalCount).padStart(2, "0")}</h3>
                <p className={`${criticalCount > 0 ? "text-red-500" : "text-slate-400"} text-xs font-bold mt-2 flex items-center gap-1`}>
                  <span className="material-symbols-outlined text-sm font-bold">warning</span> Red flags detected
                </p>
              </div>
              <div className={`size-12 rounded-lg flex items-center justify-center transition-all ${criticalCount > 0 ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 text-slate-400"}`}>
                <span className="material-symbols-outlined">emergency</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-tight">Unassigned</p>
                <h3 className="text-3xl font-bold mt-1">{String(pendingCount).padStart(2, "0")}</h3>
                <p className="text-emerald-500 text-xs font-bold mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm font-bold">check_circle</span> Auto-assignment active
                </p>
              </div>
              <div className="size-12 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                <span className="material-symbols-outlined">assignment_turned_in</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-[5]">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">list_alt</span>
              Interaction History
            </h3>
            <button onClick={() => mutate()} className="text-primary text-sm font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
              <span className={`material-symbols-outlined text-sm ${isTableLoading ? 'animate-spin' : ''}`}>refresh</span>
              Refresh Queue
            </button>
          </div>
          
          <div className="overflow-x-auto flex-1 relative">
            {isTableLoading && calls.length === 0 && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                 <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                 <p className="text-sm font-bold text-slate-500 animate-pulse">Initializing Triage Queue...</p>
              </div>
            )}
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase font-bold tracking-[0.1em]">
                  <th className="px-6 py-4">Patient Interaction</th>
                  <th className="px-6 py-4">Clinical Overview</th>
                  <th className="px-6 py-4">AI Processing</th>
                  <th className="px-6 py-4">Assignment Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-jakarta">
                {calls.map((call) => (
                  <tr
                    key={call.vapiCallId}
                    onClick={() => setSelectedCaseId(call.vapiCallId)}
                    className={`cursor-pointer transition-all group ${selectedCaseId === call.vapiCallId ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm uppercase ${call.redFlagsPresent ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                          {call.customerNumber.slice(-2)}
                        </div>
                        <div>
                          <span className="font-bold text-base block">{call.customerNumber}</span>
                          <span className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{new Date(call.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1.5">
                          <span className={`w-fit px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                             call.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' :
                             call.priority === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                             'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}>
                            {call.priority} Priority
                          </span>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium line-clamp-1 italic max-w-[200px]">
                             {call.chiefComplaint || 'Awaiting clinical data...'}
                          </p>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                             <span className={`size-1.5 rounded-full ${call.carePlan ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Analysis: {call.carePlan ? 'READY' : 'PENDING'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className={`size-1.5 rounded-full ${call.chatHistory && call.chatHistory.length > 0 ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Interrogated: {call.chatHistory && call.chatHistory.length > 0 ? 'YES' : 'NO'}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className={`size-2 rounded-full ${call.assignedDoctor ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                         <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
                            {call.assignedDoctor ? call.assignedDoctor.split(' ').pop() : 'Pending'}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary group-hover:bg-primary group-hover:text-white p-2 rounded-xl transition-all shadow-sm">
                          <span className="material-symbols-outlined text-xl">open_in_new</span>
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedCaseId && (
          <>
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[40] transition-opacity animate-in fade-in duration-300" onClick={() => setSelectedCaseId(null)} />
            <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white dark:bg-slate-900 z-[50] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-in-out">
              {selectedCase ? (
                <>
                  <div className={`p-8 text-white shrink-0 ${selectedCase.redFlagsPresent ? 'bg-red-600' : 'bg-primary'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-md">
                          <span className="material-symbols-outlined text-4xl">medical_information</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-3xl tracking-tight leading-none">{selectedCase.customerNumber}</h3>
                          <p className="text-xs text-white/70 font-bold uppercase tracking-[0.2em] mt-2">EMR-LINKED PATIENT</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedCaseId(null)} className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
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
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/30">
                    {activeTab === 'analysis' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
                      <div className="flex flex-col h-full animate-in fade-in duration-500">
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
                      <div className="animate-in fade-in duration-500 pb-10">
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
                      onClick={() => setIsAssigning(selectedCase.vapiCallId)}
                      className="w-full bg-slate-950 dark:bg-primary text-white font-black py-5 rounded-3xl hover:opacity-90 transition-all shadow-2xl flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs"
                    >
                      <span className="material-symbols-outlined text-lg">clinical_notes</span>
                      {selectedCase.assignedDoctor ? `CASE ASSIGNED TO ${selectedCase.assignedDoctor.toUpperCase()}` : 'INITIALIZE CLINICAL ASSIGNMENT'}
                    </button>

                    {isAssigning === selectedCase.vapiCallId && (
                      <div className="absolute inset-x-0 bottom-0 p-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-full duration-300 z-[60] shadow-2xl rounded-t-[3rem]">
                        <div className="flex justify-between items-center mb-8">
                           <div>
                              <h4 className="font-bold text-xl tracking-tight leading-none text-slate-900 dark:text-white">Route to Coverage</h4>
                              <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">On-Duty Medical Staff</p>
                           </div>
                           <button onClick={() => setIsAssigning(null)} className="size-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center transition-all hover:bg-slate-50">
                              <span className="material-symbols-outlined text-slate-400">close</span>
                           </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           {DOCTORS.map(doc => (
                             <button key={doc.id} onClick={() => assignDoctor(selectedCase.vapiCallId, doc.name)} className="p-5 border border-slate-100 dark:border-slate-800 rounded-3xl hover:border-primary hover:bg-primary/5 transition-all text-sm font-bold text-left flex items-center gap-4 group">
                                <div className={`size-10 rounded-xl ${doc.color} flex items-center justify-center text-sm group-hover:scale-110 transition-transform`}>{doc.name[4]}</div>
                                <div>
                                   <p className="leading-none text-slate-900 dark:text-white">{doc.name}</p>
                                   <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">{doc.specialty}</p>
                                </div>
                             </button>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-12 text-center">
                   <div className="size-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
