"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h3 className="text-2xl font-bold">System Configuration</h3>
          <p className="text-sm text-slate-500">
            Manage Vapi API keys, Triage behavior, and User accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    key
                  </span>{" "}
                  API & Integration
                </h4>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Vapi Public Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value="••••••••••••••••••••••••••••••••"
                      readOnly
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-primary transition-all"
                    />
                    <button className="bg-primary/10 text-primary px-4 py-3 rounded-xl hover:bg-primary hover:text-white transition-all">
                      <span className="material-symbols-outlined text-lg">
                        edit
                      </span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Webhook URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value="https://hallex-medical.vercel.app/api/vapi/webhook"
                      readOnly
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-primary transition-all"
                    />
                    <button className="bg-primary/10 text-primary px-4 py-3 rounded-xl hover:bg-primary hover:text-white transition-all">
                      <span className="material-symbols-outlined text-lg">
                        content_copy
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">
                    shield
                  </span>{" "}
                  Triage Protocol Settings
                </h4>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: "Emergency Red-Flag Screening", active: true },
                  { label: "Automatic Severity Escalation", active: true },
                  { label: "HIPAA Logging Mode", active: true },
                  { label: "Doctor Availability Sync", active: false },
                ].map((setting) => (
                  <div
                    key={setting.label}
                    className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {setting.label}
                    </span>
                    <button
                      className={`w-12 h-6 rounded-full transition-colors relative ${setting.active ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"}`}
                    >
                      <div
                        className={`absolute top-1 size-4 rounded-full bg-white transition-all ${setting.active ? "right-1" : "left-1"}`}
                      ></div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center flex flex-col items-center">
              <div className="size-24 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-6 border-4 border-primary/20">
                <img
                  className="w-full h-full object-cover"
                  src="https://i.pravatar.cc/150?u=sarah"
                  alt="Profile"
                />
              </div>
              <h4 className="text-lg font-bold mb-1">Sarah Jenkins, RN</h4>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-6">
                Triage Lead Admin
              </p>
              <div className="w-full space-y-2">
                <button className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">
                    person
                  </span>{" "}
                  Edit Profile
                </button>
                <button className="w-full bg-red-500 text-white text-sm font-bold py-3 rounded-xl hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/20">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
