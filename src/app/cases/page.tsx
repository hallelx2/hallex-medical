"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type Case = {
  id: string;
  timestamp: string;
  customerNumber: string;
  summary: string;
  assignedDoctor: string | null;
  status: string;
};

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);

  useEffect(() => {
    const fetchCases = async () => {
      const res = await fetch("/api/vapi/webhook");
      if (res.ok) {
        const data = await res.json();
        setCases(data.reverse());
      }
    };
    fetchCases();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold">Patient Cases</h3>
            <p className="text-sm text-slate-500">
              Overview of all active and completed patient triage cases.
            </p>
          </div>
          <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> New
            Manual Case
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cases.length === 0 ? (
            <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-20">
                history_edu
              </span>
              <p className="font-medium text-sm">
                No clinical cases established yet
              </p>
            </div>
          ) : (
            cases.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase ${c.status === "assigned" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}
                  >
                    {c.status}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    #{c.id.slice(-6)}
                  </span>
                </div>
                <h4 className="text-lg font-bold mb-1 truncate">
                  Patient {c.customerNumber}
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  {new Date(c.timestamp).toLocaleString()}
                </p>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl mb-4 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed italic">
                    "{c.summary || "No summary available"}"
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {c.assignedDoctor
                        ? c.assignedDoctor.split(" ").pop()?.slice(0, 2)
                        : "??"}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {c.assignedDoctor ? c.assignedDoctor : "Unassigned"}
                    </span>
                  </div>
                  <button className="text-primary hover:bg-primary/5 p-1.5 rounded-lg transition-colors group-hover:translate-x-1 duration-300">
                    <span className="material-symbols-outlined text-lg">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
