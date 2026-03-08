"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

type CallLog = {
  id: string;
  timestamp: string;
  customerNumber: string;
  duration: string;
  status: string;
  priority: string;
};

export default function CallLogsPage() {
  const [logs, setLogs] = useState<CallLog[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch("/api/vapi/webhook");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.reverse());
      }
    };
    fetchLogs();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-lg">Communication History</h3>
            <p className="text-sm text-slate-500">
              Full audit trail of all voice triage interactions.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="px-6 py-4">Call ID</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Patient Number</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      No logs available
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-primary">
                        {log.id.slice(-12)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {log.customerNumber}
                      </td>
                      <td className="px-6 py-4 text-sm">Voice Triage</td>
                      <td className="px-6 py-4 text-right">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded text-[10px] font-bold uppercase">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
