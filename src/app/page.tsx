"use client";

import React, { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import DashboardLayout from "@/components/DashboardLayout";
import CaseDrawer from "@/components/clinical/CaseDrawer";

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

type DbDoctor = {
  id: string;
  name: string;
  specialty: string | null;
  role: string;
};

export default function OverviewPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualPatient, setManualPatient] = useState({ name: "", phone: "", complaint: "" });
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  
  const { data: calls = [], mutate, isLoading: isTableLoading } = useSWR<CallReport[]>(
    "/api/vapi/webhook",
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: dbDoctors = [] } = useSWR<DbDoctor[]>("/api/doctors", fetcher);

  const selectedCase = calls.find(c => c.vapiCallId === selectedCaseId);

  const handleCreateManualCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingManual(true);
    try {
      const res = await fetch("/api/vapi/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            type: "end-of-call-report",
            call: {
              id: `MANUAL-${crypto.randomUUID().slice(0, 8)}`,
              customer: { number: manualPatient.phone }
            },
            analysis: {
              structuredData: {
                chiefComplaint: manualPatient.complaint,
                doctorSummary: `Manually entered case for patient ${manualPatient.name}.`,
                triageGrade: "ROUTINE",
                severityScale: 3,
                redFlagsPresent: false
              }
            }
          }
        }),
      });
      if (res.ok) {
        mutate();
        setIsManualModalOpen(false);
        setManualPatient({ name: "", phone: "", complaint: "" });
      }
    } catch (err) {
      console.error("Manual Case Error:", err);
    } finally {
      setIsCreatingManual(false);
    }
  };

  const handleDeleteCase = async (e: React.MouseEvent, callId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this case? This action is permanent and will be logged.")) return;
    
    try {
      const res = await fetch(`/api/vapi/webhook?id=${callId}`, { method: "DELETE" });
      if (res.ok) {
        mutate();
        if (selectedCaseId === callId) setSelectedCaseId(null);
      }
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  const pendingCount = calls.filter((c) => c.status === "pending").length;
  const criticalCount = calls.filter((c) => c.redFlagsPresent).length;

  return (
    <DashboardLayout>
      <div className="p-8 relative min-h-full font-jakarta">
        {/* Stats Overview */}
        <div className="flex justify-between items-center mb-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-500 text-sm font-semibold uppercase tracking-tight">Total Interactions</p>
                    <h3 className="text-3xl font-bold mt-1">{String(calls.length).padStart(2, '0')}</h3>
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
                  </div>
                  <div className="size-12 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                    <span className="material-symbols-outlined">assignment_turned_in</span>
                  </div>
                </div>
              </div>
           </div>
           
           <div className="ml-8">
              <button 
                onClick={() => setIsManualModalOpen(true)}
                className="bg-slate-900 dark:bg-primary text-white h-full px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
              >
                 <span className="material-symbols-outlined">add_circle</span>
                 Manual Intake
              </button>
           </div>
        </div>

        {/* Interaction History Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-[5]">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">list_alt</span>
              Patient Triage Queue
            </h3>
            <button onClick={() => mutate()} className="text-primary text-sm font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
              <span className={`material-symbols-outlined text-sm ${isTableLoading ? 'animate-spin' : ''}`}>refresh</span>
              Refresh
            </button>
          </div>
          
          <div className="overflow-x-auto flex-1 relative">
            {isTableLoading && calls.length === 0 && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center">
                 <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                 <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Clinical Data Sync...</p>
              </div>
            )}
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase font-bold tracking-[0.1em]">
                  <th className="px-6 py-4">Interaction</th>
                  <th className="px-6 py-4">Clinical Status</th>
                  <th className="px-6 py-4">AI Processing</th>
                  <th className="px-6 py-4">Clinical Lead</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {calls.map((call) => (
                  <tr
                    key={call.vapiCallId}
                    onClick={() => setSelectedCaseId(call.vapiCallId)}
                    className={`cursor-pointer transition-all group ${selectedCaseId === call.vapiCallId ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center font-black text-xs uppercase ${call.redFlagsPresent ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                          {call.customerNumber.slice(-2)}
                        </div>
                        <div>
                          <span className="font-bold text-sm block">{call.customerNumber}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(call.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1.5">
                          <span className={`w-fit px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                             call.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' :
                             call.priority === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                             'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}>
                            {call.priority}
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-1 italic max-w-[200px]">
                             {call.chiefComplaint || 'Awaiting Vapi report...'}
                          </p>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                             <span className={`size-1.5 rounded-full ${call.carePlan ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Analysis: {call.carePlan ? 'READY' : 'WAITING'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className={`size-1.5 rounded-full ${call.chatHistory && call.chatHistory.length > 0 ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">History: {call.chatHistory && call.chatHistory.length > 0 ? 'PERSISTED' : 'NONE'}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className={`size-2 rounded-full ${call.assignedDoctor ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                         <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tighter">
                            {call.assignedDoctor ? call.assignedDoctor.split(' ').pop() : 'PENDING'}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                          <button 
                            onClick={(e) => handleDeleteCase(e, call.vapiCallId)}
                            className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 hover:bg-red-500 hover:text-white p-2 rounded-xl transition-all shadow-sm text-red-500"
                          >
                             <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                          <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary group-hover:bg-primary group-hover:text-white p-2 rounded-xl transition-all shadow-sm text-slate-400">
                             <span className="material-symbols-outlined text-xl">open_in_new</span>
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modular Case Drawer */}
        <CaseDrawer 
          isOpen={!!selectedCaseId}
          selectedCase={selectedCase || null}
          onClose={() => setSelectedCaseId(null)}
          onMutate={mutate}
          doctors={dbDoctors.map(d => ({ id: d.id, name: d.name, specialty: d.specialty, color: 'bg-primary/10' }))}
        />

        {/* Manual Intake Modal */}
        {isManualModalOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-primary p-8 text-white">
                   <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Manual Intake</h3>
                      <button onClick={() => setIsManualModalOpen(false)} className="material-symbols-outlined">close</button>
                   </div>
                   <p className="text-white/70 text-sm mt-2 font-medium italic">Manually inject a patient into the triage system.</p>
                </div>
                <form onSubmit={handleCreateManualCase} className="p-8 space-y-6">
                   <div className="space-y-4">
                      <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Patient Full Name</label>
                         <input 
                           required
                           value={manualPatient.name}
                           onChange={e => setManualPatient({...manualPatient, name: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl h-14 px-5 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                           placeholder="Enter patient name"
                         />
                      </div>
                      <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Phone Number</label>
                         <input 
                           required
                           value={manualPatient.phone}
                           onChange={e => setManualPatient({...manualPatient, phone: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl h-14 px-5 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                           placeholder="+1 (555) 000-0000"
                         />
                      </div>
                      <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Chief Complaint</label>
                         <textarea 
                           required
                           rows={3}
                           value={manualPatient.complaint}
                           onChange={e => setManualPatient({...manualPatient, complaint: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-5 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold resize-none"
                           placeholder="Describe the clinical interaction..."
                         />
                      </div>
                   </div>
                   <button 
                     disabled={isCreatingManual}
                     className="w-full bg-primary text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/20 hover:scale-102 active:scale-95 transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                   >
                      {isCreatingManual ? 'Injecting Case...' : 'Initialize Clinical Case'}
                   </button>
                </form>
             </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
