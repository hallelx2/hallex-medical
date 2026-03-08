"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const DOCTORS_LIST = [
  { id: '1', name: 'Dr. Michael Chen', specialty: 'Cardiology', shift: 'Morning Shift', hours: '08:00 - 14:00', icon: 'person', color: 'bg-primary/10' },
  { id: '2', name: 'Dr. Elena Rodriguez', specialty: 'ER Lead', shift: 'Night Shift', hours: '22:00 - 06:00', icon: 'medical_services', color: 'bg-blue-100 dark:bg-blue-900/40' },
  { id: '3', name: 'Dr. James Wilson', specialty: 'Neurology', shift: 'Afternoon Shift', hours: '14:00 - 22:00', icon: 'neurology', color: 'bg-purple-100 dark:bg-purple-900/40' },
  { id: '4', name: 'Dr. Sarah Patel', specialty: 'Pediatrics', shift: 'Morning Shift', hours: '08:00 - 16:00', icon: 'pediatrics', color: 'bg-indigo-100 dark:bg-indigo-900/40' },
];

export default function SchedulePage() {
  const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);
  const { data: calls = [] } = useSWR<any[]>("/api/vapi/webhook", fetcher);

  const getAssignedPatients = (doctorName: string) => {
    return calls.filter(c => c.assignedDoctor === doctorName && c.status === 'assigned');
  };

  return (
    <DashboardLayout>
      <div className="p-8 font-jakarta">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Medical Staff Schedule</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">Real-time occupancy and patient load management.</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">calendar_today</span> March 2026
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h4 className="font-bold text-lg">On-Duty Doctors</h4>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Shift</span>
             </div>
             <div className="p-6 space-y-4">
                {DOCTORS_LIST.map(doc => {
                  const patients = getAssignedPatients(doc.name);
                  const isExpanded = expandedDoctor === doc.id;

                  return (
                    <div key={doc.id} className="border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden transition-all duration-300">
                      <div 
                        onClick={() => setExpandedDoctor(isExpanded ? null : doc.id)}
                        className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-4">
                           <div className={`size-12 rounded-2xl ${doc.color} flex items-center justify-center text-primary shadow-sm`}>
                              <span className="material-symbols-outlined text-2xl">{doc.icon}</span>
                           </div>
                           <div>
                              <p className="font-bold text-slate-900 dark:text-white text-lg">{doc.name}</p>
                              <p className="text-xs text-slate-500 font-semibold uppercase tracking-tighter">{doc.specialty}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right hidden sm:block">
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{doc.shift}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{doc.hours}</p>
                           </div>
                           <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
                              <span className="text-xs font-black text-primary">{patients.length}</span>
                              <span className="text-[10px] font-bold text-primary/70 uppercase">Patients</span>
                           </div>
                           <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Assigned Active Cases</h5>
                           {patients.length === 0 ? (
                             <p className="text-xs text-slate-400 italic">No patients currently assigned to this doctor.</p>
                           ) : (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-jakarta">
                               {patients.map((p: any) => (
                                 <div key={p.vapiCallId} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                    <div>
                                       <p className="text-sm font-bold text-slate-900 dark:text-white">{p.customerNumber}</p>
                                       <p className="text-[10px] text-slate-500 font-medium">Priority: {p.priority}</p>
                                    </div>
                                    <span className={`size-2 rounded-full ${p.priority === 'High' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                 </div>
                               ))}
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  );
                })}
             </div>
          </div>
          
          <div className="xl:col-span-4 space-y-6">
             <div className="bg-primary p-8 rounded-[2.5rem] text-white shadow-2xl shadow-primary/20 flex flex-col items-center text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50 group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="size-20 bg-white/20 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/30 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                   <span className="material-symbols-outlined text-4xl">emergency_share</span>
                </div>
                <h4 className="text-2xl font-black mb-2 tracking-tight">Load Balancing</h4>
                <p className="text-sm text-white/80 leading-relaxed font-medium mb-8">
                  The AI is currently routing cases to optimize clinical outcomes and staff wellness.
                </p>
                <div className="w-full h-1 bg-white/20 rounded-full mb-8 overflow-hidden">
                   <div className="h-full bg-white w-3/4"></div>
                </div>
                <button className="w-full bg-white text-primary font-black py-4 rounded-2xl hover:bg-blue-50 transition-all active:scale-95 uppercase tracking-widest text-xs">
                  Recalibrate Algorithm
                </button>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
