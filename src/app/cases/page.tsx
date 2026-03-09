"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import useSWR from "swr";
import CaseDrawer from "@/components/clinical/CaseDrawer";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Case = {
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

export default function CasesPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  
  const { data: cases = [], isLoading, mutate } = useSWR<Case[]>("/api/vapi/webhook", fetcher);
  const { data: dbDoctors = [] } = useSWR<DbDoctor[]>("/api/doctors", fetcher);

  const selectedCase = cases.find(c => c.vapiCallId === selectedCaseId);

  return (
    <DashboardLayout>
      <div className="p-8 font-jakarta">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Patient Cases</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">Unified clinical view of all triage interactions.</p>
          </div>
        </div>
        
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
             <p className="text-sm font-bold text-slate-400">Syncing clinical records...</p>
          </div>
        )}

        {!isLoading && cases.length === 0 ? (
          <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-slate-500">
             <span className="material-symbols-outlined text-4xl mb-2 opacity-20 text-slate-400">history_edu</span>
             <p className="font-bold text-sm">No clinical cases established yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cases.map((c) => (
              <div 
                key={c.vapiCallId} 
                onClick={() => setSelectedCaseId(c.vapiCallId)}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group relative overflow-hidden cursor-pointer"
              >
                {c.carePlan && (
                  <div className="absolute top-0 right-0 p-2">
                     <span className="size-2 bg-emerald-500 rounded-full block animate-pulse"></span>
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${c.status === 'assigned' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    {c.status}
                  </div>
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-tighter">ID: {c.vapiCallId.slice(-6)}</span>
                </div>
                <h4 className="text-lg font-bold mb-1 truncate text-slate-900 dark:text-white">Patient {c.customerNumber}</h4>
                <p className="text-xs text-slate-500 font-medium mb-4">{new Date(c.timestamp).toLocaleString()}</p>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800 min-h-[80px]">
                   <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed font-medium italic">
                    "{c.doctorSummary || c.chiefComplaint || 'Awaiting clinical data extraction...'}"
                   </p>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                         {c.assignedDoctor ? c.assignedDoctor.split(' ').pop()?.slice(0, 2) : '??'}
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                         {c.assignedDoctor ? c.assignedDoctor : 'PENDING'}
                      </span>
                   </div>
                   <button className="text-primary hover:bg-primary/5 p-1.5 rounded-lg transition-colors group-hover:translate-x-1 duration-300">
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <CaseDrawer 
          isOpen={!!selectedCaseId}
          selectedCase={selectedCase || null}
          onClose={() => setSelectedCaseId(null)}
          onMutate={mutate}
          doctors={dbDoctors.map(d => ({ id: d.id, name: d.name, specialty: d.specialty, color: 'bg-primary/10' }))}
        />
      </div>
    </DashboardLayout>
  );
}
