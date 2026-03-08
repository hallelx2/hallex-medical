"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";

const DOCTORS = [
  {
    id: "1",
    name: "Dr. Michael Chen",
    specialty: "Cardiology",
    shift: "Morning Shift",
    hours: "08:00 - 14:00",
    status: "Active",
    color: "bg-primary/10",
    icon: "person",
  },
  {
    id: "2",
    name: "Dr. Elena Rodriguez",
    specialty: "ER Lead",
    shift: "Night Shift",
    hours: "22:00 - 06:00",
    status: "Active",
    color: "bg-blue-100 dark:bg-blue-900/40",
    icon: "medical_services",
  },
  {
    id: "3",
    name: "Dr. James Wilson",
    specialty: "Neurology",
    shift: "Afternoon Shift",
    hours: "14:00 - 22:00",
    status: "In Call",
    color: "bg-purple-100 dark:bg-purple-900/40",
    icon: "neurology",
  },
  {
    id: "4",
    name: "Dr. Sarah Patel",
    specialty: "Pediatrics",
    shift: "Morning Shift",
    hours: "08:00 - 16:00",
    status: "Active",
    color: "bg-indigo-100 dark:bg-indigo-900/40",
    icon: "pediatrics",
  },
];

export default function SchedulePage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold">Medical Staff Schedule</h3>
            <p className="text-sm text-slate-500">
              Real-time occupancy and shift management.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">
                calendar_today
              </span>{" "}
              March 2026
            </button>
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">
                edit_calendar
              </span>{" "}
              Manage Shifts
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-lg">On-Duty Doctors</h4>
            </div>
            <div className="p-6 space-y-4">
              {DOCTORS.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`size-12 rounded-xl ${doc.color} flex items-center justify-center text-primary shadow-sm`}
                    >
                      <span className="material-symbols-outlined">
                        {doc.icon}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold">{doc.name}</p>
                      <p className="text-xs text-slate-500 font-semibold uppercase">
                        {doc.specialty}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{doc.shift}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      {doc.hours}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-primary p-8 rounded-2xl text-white shadow-xl shadow-primary/20 flex flex-col items-center text-center">
              <div className="size-16 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-md">
                <span className="material-symbols-outlined text-3xl">
                  access_time_filled
                </span>
              </div>
              <h4 className="text-xl font-bold mb-2">Shift Handover Active</h4>
              <p className="text-sm text-white/80 leading-relaxed max-w-xs mb-6">
                Next shift starts in 45 minutes. Please ensure all triage notes
                are finalized.
              </p>
              <button className="w-full bg-white text-primary font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors active:scale-95">
                Prepare Handover Report
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h4 className="font-bold text-lg mb-6">Weekly Coverage</h4>
              <div className="space-y-4">
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
                  <div key={day} className="flex items-center gap-4">
                    <span className="w-10 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {day}
                    </span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${60 + i * 10}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {60 + i * 10}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
