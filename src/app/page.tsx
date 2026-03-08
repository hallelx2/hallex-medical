"use client";

import React, { useState, useRef } from "react";
import useSWR from "swr";
import DashboardLayout from "@/components/DashboardLayout";

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
};

const DOCTORS = [
  { id: "1", name: "Dr. Michael Chen", specialty: "Cardiology", status: "Active", color: "bg-primary/10", icon: "person" },
  { id: "2", name: "Dr. Elena Rodriguez", specialty: "ER Lead", status: "Active", color: "bg-blue-100 dark:bg-blue-900/40", icon: "medical_services" },
  { id: "3", name: "Dr. James Wilson", specialty: "Neurology", status: "In Call", color: "bg-purple-100 dark:bg-purple-900/40", icon: "neurology" },
  { id: "4", name: "Dr. Sarah Patel", specialty: "Pediatrics", status: "Active", color: "bg-indigo-100 dark:bg-indigo-900/40", icon: "pediatrics" },
];

export default function OverviewPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  
  const { data: calls = [], mutate, isLoading: isTableLoading } = useSWR<CallReport[]>(
    "/api/vapi/webhook",
    fetcher,
    { refreshInterval: 5000 }
  );

  const selectedCase = calls.find(c => c.vapiCallId === selectedCaseId);

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
      <div className="p-8 relative min-h-full">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-tight">Total Interactions</p>
                <h3 className="text-3xl font-bold mt-1">{String(calls.length).padStart(2, '0')}</h3>
                <p className="text-slate-400 text-xs font-bold mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">history</span> All agent calls
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

        <div className="grid grid-cols-1 gap-8">
          {/* Triage Queue Table - Now takes full width */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-[5]">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">list_alt</span>
                  Interaction History
                </h3>
                <div className="flex items-center gap-3">
                   {isTableLoading && <span className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>}
                   <button onClick={() => mutate()} className="text-primary text-sm font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-sm">refresh</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase font-bold tracking-[0.1em]">
                      <th className="px-6 py-4">Patient</th>
                      <th className="px-6 py-4">Clinical Overview</th>
                      <th className="px-6 py-4">Assignment Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {calls.map((call) => (
                      <tr
                        key={call.vapiCallId}
                        onClick={() => setSelectedCaseId(call.vapiCallId)}
                        className={`cursor-pointer transition-colors group ${selectedCaseId === call.vapiCallId ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm uppercase ${call.redFlagsPresent ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
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
                                 call.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400' :
                                 call.priority === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400' :
                                 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                              }`}>
                                {call.priority} Priority
                              </span>
                              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium line-clamp-1 italic">
                                 {call.chiefComplaint || 'Awaiting clinical data...'}
                              </p>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <div className={`size-2 rounded-full ${call.assignedDoctor ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                             <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                {call.assignedDoctor ? call.assignedDoctor : 'Unassigned'}
                             </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white p-2 rounded-lg transition-all">
                              <span className="material-symbols-outlined text-xl">visibility</span>
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR SLIDER (DRAWER) */}
        {selectedCaseId && (
          <>
            {/* Backdrop Overlay */}
            <div 
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[40] transition-opacity animate-in fade-in duration-300"
              onClick={() => setSelectedCaseId(null)}
            />
            
            {/* Drawer Panel */}
            <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white dark:bg-slate-900 z-[50] shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-500 ease-in-out">
              {selectedCase ? (
                <>
                  {/* Drawer Header */}
                  <div className={`p-8 text-white relative shrink-0 ${selectedCase.redFlagsPresent ? 'bg-red-600' : 'bg-primary'}`}>
                    <button 
                      onClick={() => setSelectedCaseId(null)}
                      className="absolute top-6 right-6 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all group"
                    >
                      <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">close</span>
                    </button>

                    <div className="flex flex-col gap-4 mt-2">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-3xl">clinical_notes</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-2xl tracking-tight leading-none">
                            {selectedCase.customerNumber}
                          </h3>
                          <p className="text-xs text-white/70 font-bold uppercase tracking-widest mt-1">
                            Interaction ID: {selectedCase.vapiCallId.slice(-12)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-tighter">
                           Triage: {selectedCase.triageGrade || 'Standard'}
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${selectedCase.redFlagsPresent ? 'bg-white text-red-600' : 'bg-white/20 text-white'}`}>
                           {selectedCase.redFlagsPresent ? 'Red Flags Detected' : 'No Critical Flags'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Drawer Content */}
                  <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {selectedCase.recordingUrl && (
                      <section>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Call Recording</h4>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100 dark:border-slate-800">
                           <button className="size-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                              <span className="material-symbols-outlined text-2xl">play_arrow</span>
                           </button>
                           <div className="flex-1 space-y-1">
                              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                 <div className="h-full bg-primary w-1/3"></div>
                              </div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                 <span>0:42</span>
                                 <span>2:15</span>
                              </div>
                           </div>
                           <a href={selectedCase.recordingUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline">Download</a>
                        </div>
                      </section>
                    )}

                    <section>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <span className="material-symbols-outlined text-sm text-primary">summarize</span> AI Clinical Analysis
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                         <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed font-medium italic">
                            "{selectedCase.doctorSummary || 'Awaiting summary generation...'}"
                         </p>
                      </div>
                    </section>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Chief Complaint</p>
                         <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedCase.chiefComplaint || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Severity Rating</p>
                         <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                               <div className={`h-full transition-all duration-1000 ${selectedCase.severityScale && selectedCase.severityScale > 7 ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${(selectedCase.severityScale || 0) * 10}%` }}></div>
                            </div>
                            <span className="text-sm font-black">{selectedCase.severityScale || 0}/10</span>
                         </div>
                      </div>
                    </div>

                    <section>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Immediate Recommended Action</h4>
                      <div className={`p-6 rounded-2xl border flex items-start gap-4 transition-all ${selectedCase.redFlagsPresent ? 'bg-red-50 border-red-100 text-red-700 dark:bg-red-900/10 dark:border-red-900/20' : 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/10 dark:border-emerald-900/20'}`}>
                         <span className="material-symbols-outlined text-3xl mt-0.5">{selectedCase.redFlagsPresent ? 'emergency' : 'verified_user'}</span>
                         <p className="text-sm font-bold leading-relaxed">
                            {selectedCase.recommendedAction || 'Continue monitoring symptoms and follow protocol if condition changes.'}
                         </p>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 sticky top-0 bg-white dark:bg-slate-900 py-2 z-10">
                         <span className="material-symbols-outlined text-sm text-primary">forum</span> Interaction Transcript
                      </h4>
                      <div className="space-y-4 pb-8">
                         {selectedCase.transcript ? (
                           selectedCase.transcript.split('\n').map((line, i) => (
                             <div key={i} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0">
                                {line}
                             </div>
                           ))
                         ) : (
                           <p className="text-sm text-slate-400 italic">No transcript recorded.</p>
                         )}
                      </div>
                    </section>
                  </div>

                  {/* Drawer Footer / Assignment */}
                  <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shrink-0">
                    <button 
                      onClick={() => setIsAssigning(selectedCase.vapiCallId)}
                      className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">person_add</span>
                      {selectedCase.assignedDoctor ? `Assigned to ${selectedCase.assignedDoctor.split(' ').pop()}` : 'Assign to On-Duty Physician'}
                    </button>

                    {isAssigning === selectedCase.vapiCallId && (
                      <div className="absolute inset-x-0 bottom-0 p-8 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-full duration-300 z-[60] shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                           <div>
                              <h4 className="font-bold text-lg leading-none">Select Medical Staff</h4>
                              <p className="text-xs text-slate-500 mt-1 font-medium">Assign patient to current shift coverage.</p>
                           </div>
                           <button onClick={() => setIsAssigning(null)} className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                              <span className="material-symbols-outlined text-slate-400">close</span>
                           </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           {DOCTORS.map(doc => (
                             <button 
                                key={doc.id}
                                onClick={() => assignDoctor(selectedCase.vapiCallId, doc.name)}
                                className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-sm font-bold text-left flex items-center gap-3 group"
                             >
                                <div className={`size-8 rounded-full ${doc.color} flex items-center justify-center text-xs group-hover:scale-110 transition-transform`}>{doc.name[4]}</div>
                                <div>
                                   <p className="leading-none">{doc.name}</p>
                                   <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">{doc.specialty}</p>
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
