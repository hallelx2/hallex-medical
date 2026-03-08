"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Case = {
  vapiCallId: string;
  timestamp: string;
  customerNumber: string;
  doctorSummary: string | null;
  chiefComplaint: string | null;
  assignedDoctor: string | null;
  status: string;
  carePlan: string | null;
};

export default function CasesPage() {
  const { data: cases = [], isLoading } = useSWR<Case[]>("/api/vapi/webhook", fetcher);

  return (
    <DashboardLayout>
      <div className="p-8 font-jakarta">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Patient Cases</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">Unified clinical view of all triage interactions.</p>
          </div>
          <button className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> New Manual Case
          </button>
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
              <div key={c.vapiCallId} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group relative overflow-hidden">
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
                   {c.carePlan && (
                     <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">auto_awesome</span> ANALYZED
                     </span>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
