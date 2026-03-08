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
      <div className="p-8">
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

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Triage Queue Table */}
          <div className="xl:col-span-7 space-y-6">
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
                      <th className="px-6 py-4">AI Analysis</th>
                      <th className="px-6 py-4">Assignment</th>
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
                            <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${call.redFlagsPresent ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                              {call.customerNumber.slice(-2)}
                            </div>
                            <div>
                              <span className="font-bold text-sm block">{call.customerNumber}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border mb-1 inline-block ${
                              call.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400' :
                              call.priority === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400' :
                              'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                           }`}>
                             {call.priority}
                           </span>
                           <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 max-w-[180px]">
                              {call.doctorSummary || call.chiefComplaint}
                           </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                             <span className={`size-1.5 rounded-full ${call.assignedDoctor ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                             {call.assignedDoctor ? call.assignedDoctor.split(' ').pop() : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Case Review */}
          <div className="xl:col-span-5">
            {selectedCase ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-[700px] animate-in slide-in-from-right-4 duration-500">
                <div className={`p-6 text-white ${selectedCase.redFlagsPresent ? 'bg-red-600' : 'bg-primary'}`}>
                   <div className="flex justify-between items-start mb-4">
                      <div>
                         <h3 className="font-bold text-xl flex items-center gap-2">
                            <span className="material-symbols-outlined">clinical_notes</span>
                            Case Review: {selectedCase.customerNumber}
                         </h3>
                         <p className="text-xs text-white/80 font-bold uppercase tracking-widest mt-1">
                            Vapi Interaction ID: {selectedCase.vapiCallId.slice(-12)}
                         </p>
                      </div>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase">
                         {selectedCase.triageGrade || 'Standard'}
                      </span>
                   </div>
                   
                   {selectedCase.recordingUrl && (
                     <div className="bg-white/10 rounded-lg p-2 flex items-center gap-3">
                        <span className="material-symbols-outlined">play_circle</span>
                        <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                           <div className="h-full bg-white w-1/3"></div>
                        </div>
                        <a href={selectedCase.recordingUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold underline">Listen</a>
                     </div>
                   )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                   <section>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <span className="material-symbols-outlined text-sm">summarize</span> Clinical Summary
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                         <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium italic">
                            "{selectedCase.doctorSummary || 'No summary generated.'}"
                         </p>
                      </div>
                   </section>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                         <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Chief Complaint</p>
                         <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedCase.chiefComplaint || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                         <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Severity Scale</p>
                         <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                               <div className={`h-full ${selectedCase.severityScale && selectedCase.severityScale > 7 ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${(selectedCase.severityScale || 0) * 10}%` }}></div>
                            </div>
                            <span className="text-xs font-bold">{selectedCase.severityScale || 0}/10</span>
                         </div>
                      </div>
                   </div>

                   <section>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recommended Action</h4>
                      <div className={`p-4 rounded-xl border ${selectedCase.redFlagsPresent ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                         <p className="text-xs font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">{selectedCase.redFlagsPresent ? 'emergency' : 'check_circle'}</span>
                            {selectedCase.recommendedAction || 'Monitor symptoms and follow up as needed.'}
                         </p>
                      </div>
                   </section>

                   <section>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <span className="material-symbols-outlined text-sm">forum</span> Full Transcript
                      </h4>
                      <div className="space-y-4">
                         {selectedCase.transcript ? (
                           selectedCase.transcript.split('\n').map((line, i) => (
                             <div key={i} className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                                {line}
                             </div>
                           ))
                         ) : (
                           <p className="text-xs text-slate-400 italic">No transcript available for this call.</p>
                         )}
                      </div>
                   </section>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3">
                   <button 
                     onClick={() => setIsAssigning(selectedCase.vapiCallId)}
                     className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                   >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      {selectedCase.assignedDoctor ? 'Change Assignment' : 'Assign Doctor'}
                   </button>
                   {isAssigning === selectedCase.vapiCallId && (
                     <div className="absolute inset-x-0 bottom-0 p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-full duration-300 z-10">
                        <div className="flex justify-between items-center mb-4">
                           <h4 className="font-bold text-sm">Select On-Duty Doctor</h4>
                           <button onClick={() => setIsAssigning(null)} className="material-symbols-outlined text-slate-400">close</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           {DOCTORS.map(doc => (
                             <button 
                                key={doc.id}
                                onClick={() => assignDoctor(selectedCase.vapiCallId, doc.name)}
                                className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-primary hover:text-primary transition-all text-xs font-bold text-left flex items-center gap-2"
                             >
                                <div className={`size-6 rounded-full ${doc.color} flex items-center justify-center text-[10px]`}>{doc.name[4]}</div>
                                {doc.name}
                             </button>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-center p-12 h-[700px]">
                 <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-slate-300">manage_search</span>
                 </div>
                 <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Case Selected</h4>
                 <p className="text-sm text-slate-500 max-w-[240px] mt-2 leading-relaxed">
                    Select a patient interaction from the queue to review clinical summaries, transcripts, and AI analysis.
                 </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
