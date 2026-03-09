"use client";

import React, { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import DashboardLayout from "@/components/DashboardLayout";
import CaseDrawer from "@/components/clinical/CaseDrawer";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type CallReport = {
  vapiCallId: string;
  timestamp: string;
  customerNumber: string;
  direction: "inbound" | "outbound";
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
  
  // Advanced Filters
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [showOnlyRedFlags, setShowOnlyRedFlags] = useState(false);
  
  const { data: calls = [], mutate, isLoading: isTableLoading } = useSWR<CallReport[]>(
    "/api/vapi/webhook",
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: dbDoctors = [] } = useSWR<DbDoctor[]>("/api/doctors", fetcher);

  const selectedCase = calls.find(c => c.vapiCallId === selectedCaseId);

  // Filtered Calls
  const filteredCalls = calls.filter(c => {
    const matchesPriority = filterPriority === "ALL" || c.priority === filterPriority;
    const matchesRedFlags = !showOnlyRedFlags || c.redFlagsPresent;
    return matchesPriority && matchesRedFlags;
  });

  // Calculate Doctor Load
  const doctorLoad = dbDoctors.map(doc => ({
    ...doc,
    activeCases: calls.filter(c => c.assignedDoctor === doc.name && c.status === 'assigned').length
  }));

  const handleCreateManualCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingManual(true);
    const id = toast.loading("Injecting clinical case...");
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
        toast.success("Case injected successfully", { id });
        setIsManualModalOpen(false);
        setManualPatient({ name: "", phone: "", complaint: "" });
      }
    } catch (err) {
      toast.error("Failed to inject case", { id });
    } finally {
      setIsCreatingManual(false);
    }
  };

  const handleDeleteCase = async (e: React.MouseEvent, callId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure? This action is immutable and will be logged.")) return;
    
    const id = toast.loading("Deleting interaction record...");
    try {
      const res = await fetch(`/api/vapi/webhook?id=${callId}`, { method: "DELETE" });
      if (res.ok) {
        mutate();
        toast.success("Case purged from system", { id });
        if (selectedCaseId === callId) setSelectedCaseId(null);
      }
    } catch (err) {
      toast.error("Deletion failed", { id });
    }
  };

  const pendingCount = calls.filter((c) => c.status === "pending").length;
  const criticalCount = calls.filter((c) => c.redFlagsPresent).length;

  return (
    <DashboardLayout>
      <div className="p-8 relative min-h-full font-jakarta">
        
        {/* Workload Visualization Row */}
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Live Clinical Workload</h4>
              <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                 <span className="size-1.5 rounded-full bg-primary animate-ping"></span>
                 REAL-TIME SYNC
              </span>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {doctorLoad.map(doc => (
                <div key={doc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3 group hover:border-primary/30 transition-all">
                   <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black text-xs uppercase group-hover:scale-110 transition-transform">
                      {doc.name[4]}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{doc.name.split(' ').pop()}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                         <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${doc.activeCases > 3 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (doc.activeCases/5)*100)}%` }}></div>
                         </div>
                         <span className="text-[9px] font-black text-slate-400">{doc.activeCases}</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Stats and Action Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-6">
           <div className="flex flex-wrap gap-4 flex-1">
              <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                 <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-xl">hub</span>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Pool</p>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">{calls.length}</h3>
                 </div>
              </div>
              <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                 <div className={`size-10 rounded-xl flex items-center justify-center ${criticalCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                    <span className="material-symbols-outlined text-xl">warning</span>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Red Flags</p>
                    <h3 className={`text-xl font-black leading-none mt-1 ${criticalCount > 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{criticalCount}</h3>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                 {['ALL', 'High', 'Medium', 'Low'].map(p => (
                   <button 
                     key={p}
                     onClick={() => setFilterPriority(p)}
                     className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterPriority === p ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     {p}
                   </button>
                 ))}
              </div>
              <button 
                onClick={() => setShowOnlyRedFlags(!showOnlyRedFlags)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${showOnlyRedFlags ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'}`}
              >
                 <span className="material-symbols-outlined text-sm">emergency</span>
                 CRITICAL
              </button>
              <button 
                onClick={() => setIsManualModalOpen(true)}
                className="bg-slate-950 dark:bg-primary text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
              >
                 <span className="material-symbols-outlined text-sm">add_circle</span>
                 Manual Intake
              </button>
           </div>
        </div>

        {/* Interaction History Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-[5]">
            <div className="flex items-center gap-4">
               <h3 className="font-black text-xl uppercase tracking-tighter text-slate-900 dark:text-white">Patient Triage Queue</h3>
               <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">{filteredCalls.length} INTERACTIONS</span>
            </div>
            <button onClick={() => mutate()} className="text-primary text-sm font-bold hover:bg-primary/5 px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
              <span className={`material-symbols-outlined text-sm ${isTableLoading ? 'animate-spin' : ''}`}>sync</span>
              Refresh Live Data
            </button>
          </div>
          
          <div className="overflow-x-auto flex-1 relative">
            {isTableLoading && calls.length === 0 && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center">
                 <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                 <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Clinical Data Sync...</p>
              </div>
            )}
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em]">
                  <th className="px-8 py-5">Interaction</th>
                  <th className="px-6 py-5 text-center">Route</th>
                  <th className="px-6 py-5">Clinical Findings</th>
                  <th className="px-6 py-5">AI Processing</th>
                  <th className="px-6 py-5">Assigned Lead</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCalls.map((call) => (
                  <tr
                    key={call.vapiCallId}
                    onClick={() => setSelectedCaseId(call.vapiCallId)}
                    className={`cursor-pointer transition-all group ${selectedCaseId === call.vapiCallId ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'}`}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`size-12 rounded-2xl flex items-center justify-center font-black text-sm uppercase transition-all group-hover:scale-110 ${call.redFlagsPresent ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-inner'}`}>
                          {call.customerNumber.slice(-2)}
                        </div>
                        <div>
                          <span className="font-black text-slate-900 dark:text-white block tracking-tight">{call.customerNumber}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${call.direction === 'outbound' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-blue-50 text-primary border border-blue-100'}`}>
                          <span className="material-symbols-outlined text-[14px]">{call.direction === 'outbound' ? 'outbound' : 'call_received'}</span>
                          {call.direction}
                       </span>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex flex-col gap-2">
                          <span className={`w-fit px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                             call.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' :
                             call.priority === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                             'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}>
                            {call.priority} Priority
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-bold line-clamp-1 max-w-[250px] italic">
                             "{call.chiefComplaint || 'Awaiting clinical data...'}"
                          </p>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex gap-1.5">
                          <div title="Analysis Status" className={`size-6 rounded-lg flex items-center justify-center ${call.carePlan ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                             <span className="material-symbols-outlined text-base">psychology</span>
                          </div>
                          <div title="Chat History" className={`size-6 rounded-lg flex items-center justify-center ${call.chatHistory?.length > 0 ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-100 text-slate-300'}`}>
                             <span className="material-symbols-outlined text-base">forum</span>
                          </div>
                          <div title="Recording" className={`size-6 rounded-lg flex items-center justify-center ${call.recordingUrl ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-300'}`}>
                             <span className="material-symbols-outlined text-base">play_circle</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2.5">
                         <div className={`size-2.5 rounded-full ${call.assignedDoctor ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`}></div>
                         <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tighter">
                            {call.assignedDoctor ? call.assignedDoctor.split(' ').pop() : 'PENDING'}
                         </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4">
                          <button 
                            onClick={(e) => handleDeleteCase(e, call.vapiCallId)}
                            className="bg-red-50 dark:bg-red-900/20 hover:bg-red-500 hover:text-white p-2.5 rounded-xl transition-all shadow-sm text-red-500"
                          >
                             <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                          <button className="bg-primary text-white p-2.5 rounded-xl transition-all shadow-lg shadow-primary/20">
                             <span className="material-symbols-outlined text-xl">arrow_forward</span>
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shared Modular Components */}
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
             <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-primary p-10 text-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                      <span className="material-symbols-outlined text-9xl">add_notes</span>
                   </div>
                   <div className="relative z-10">
                      <div className="flex justify-between items-center mb-2">
                         <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Manual Intake</h3>
                         <button onClick={() => setIsManualModalOpen(false)} className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                            <span className="material-symbols-outlined">close</span>
                         </button>
                      </div>
                      <p className="text-white/70 text-sm font-medium italic">Inject a patient record into the clinical pipeline.</p>
                   </div>
                </div>
                <form onSubmit={handleCreateManualCase} className="p-10 space-y-8">
                   <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                         <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Patient Profile</label>
                            <input 
                              required
                              value={manualPatient.name}
                              onChange={e => setManualPatient({...manualPatient, name: e.target.value})}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl h-16 px-6 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-black"
                              placeholder="Full Name"
                            />
                         </div>
                         <input 
                           required
                           value={manualPatient.phone}
                           onChange={e => setManualPatient({...manualPatient, phone: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl h-16 px-6 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-black"
                           placeholder="Primary Phone (e.g. +1...)"
                         />
                      </div>
                      <div>
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Chief Complaint</label>
                         <textarea 
                           required
                           rows={4}
                           value={manualPatient.complaint}
                           onChange={e => setManualPatient({...manualPatient, complaint: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-3xl p-6 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold resize-none leading-relaxed"
                           placeholder="Detailed clinical observation..."
                         />
                      </div>
                   </div>
                   <button 
                     disabled={isCreatingManual}
                     className="w-full bg-primary text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50"
                   >
                      {isCreatingManual ? 'Processing Intake...' : 'Initialize Clinical Case'}
                   </button>
                </form>
             </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
