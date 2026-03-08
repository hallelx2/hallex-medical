"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type AuditLog = {
  id: string;
  timestamp: string;
  actorType: string;
  actorId: string | null;
  patientId: string | null;
  callId: string | null;
  eventType: string;
  previousState: string | null;
  newState: string | null;
  metadata: any;
  requestId: string;
};

export default function AuditLogsPage() {
  const { data: logs = [], isLoading } = useSWR<AuditLog[]>("/api/audit", fetcher, {
    refreshInterval: 10000, // Refresh every 10s
  });

  return (
    <DashboardLayout>
      <div className="p-8 font-jakarta">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">System Audit Trail</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">Immutable record of all critical clinical and system events.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500">
             <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
             LIVE MONITORING ACTIVE
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase font-bold tracking-[0.1em]">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Event Type</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">State Transition</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                       <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                       <p className="font-bold text-slate-400">Loading audit records...</p>
                    </td>
                  </tr>
                )}
                
                {!isLoading && logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium italic">
                       No audit logs recorded yet.
                    </td>
                  </tr>
                )}

                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
                         log.eventType.includes('FAILED') ? 'bg-red-100 text-red-700' :
                         log.eventType.includes('CHANGED') ? 'bg-blue-100 text-blue-700' :
                         log.eventType.includes('PERSISTED') ? 'bg-emerald-100 text-emerald-700' :
                         'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                       }`}>
                         {log.eventType.replace(/_/g, ' ')}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black text-white ${
                            log.actorType === 'SYSTEM' ? 'bg-slate-500' :
                            log.actorType === 'ASSISTANT' ? 'bg-primary' : 'bg-indigo-500'
                          }`}>
                            {log.actorType}
                          </span>
                          <span className="font-bold text-slate-600 dark:text-slate-300">
                             {log.actorId ? (log.actorId.length > 15 ? log.actorId.slice(0, 8) + '...' : log.actorId) : '-'}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       {log.previousState && (
                         <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-bold uppercase tracking-tighter">{log.previousState}</span>
                            <span className="material-symbols-outlined text-sm text-slate-300">trending_flat</span>
                            <span className="text-primary font-black uppercase tracking-tighter">{log.newState}</span>
                         </div>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="text-primary hover:underline font-bold text-[10px] uppercase">
                          Inspect
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
