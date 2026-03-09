"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import useSWR from "swr";
import { UserButton, useUser, useClerk } from "@clerk/nextjs";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: settings, mutate, isLoading } = useSWR("/api/settings", fetcher);
  const [isSaving, setIsSaving] = useState(false);

  const updateSetting = async (key: string, value: any) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        mutate();
      }
    } catch (err) {
      console.error("Failed to update setting:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
           <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 font-jakarta">
        <div className="mb-8">
          <h3 className="text-2xl font-bold tracking-tight">System Configuration</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage global triage parameters, security, and medical staff accounts.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                     <span className="material-symbols-outlined text-primary">key</span> API & Integration
                  </h4>
                  {isSaving && <span className="text-[10px] font-black text-primary animate-pulse uppercase tracking-widest">Saving...</span>}
               </div>
               <div className="p-6 space-y-6">
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Vapi Public Key</label>
                     <div className="flex gap-2">
                        <input 
                           type="password" 
                           defaultValue={settings?.vapiPublicKey || ""}
                           onBlur={(e) => updateSetting("vapiPublicKey", e.target.value)}
                           className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-mono focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                           placeholder="Enter Vapi Public Key"
                        />
                        <button className="bg-primary/10 text-primary px-5 rounded-2xl hover:bg-primary hover:text-white transition-all">
                           <span className="material-symbols-outlined text-lg">save</span>
                        </button>
                     </div>
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Live Webhook URL</label>
                     <div className="flex gap-2">
                        <input 
                           type="text" 
                           readOnly
                           value={settings?.webhookUrl || "https://hallex-medical.vercel.app/api/vapi/webhook"} 
                           className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-mono text-slate-400"
                        />
                        <button className="bg-primary/10 text-primary px-5 rounded-2xl hover:bg-primary hover:text-white transition-all">
                           <span className="material-symbols-outlined text-lg">content_copy</span>
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                  <h4 className="font-bold text-lg flex items-center gap-2 text-red-500">
                     <span className="material-symbols-outlined">shield_health</span> Clinical Triage Protocol
                  </h4>
               </div>
               <div className="p-6 space-y-2">
                  {[
                    { key: 'emergencyScreening', label: 'Emergency Red-Flag Screening', desc: 'Auto-detect life-threatening symptoms' },
                    { key: 'autoEscalation', label: 'Automatic Severity Escalation', desc: 'Increase priority based on symptom intensity' },
                    { key: 'hipaaLogging', label: 'Strict HIPAA Logging Mode', desc: 'Immutable audit trail for all PHI access' },
                    { key: 'doctorSync', label: 'Medical Staff Load Balancing', desc: 'Sync assignments with on-duty schedule' },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-5 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-2xl">
                       <div>
                          <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{setting.label}</span>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{setting.desc}</p>
                       </div>
                       <button 
                         onClick={() => updateSetting(setting.key, !settings?.[setting.key])}
                         className={`w-14 h-8 rounded-full transition-all relative ${settings?.[setting.key] ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                       >
                          <div className={`absolute top-1.5 size-5 rounded-full bg-white shadow-sm transition-all ${settings?.[setting.key] ? 'right-1.5' : 'left-1.5'}`}></div>
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
          
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 text-center flex flex-col items-center group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                   <span className="material-symbols-outlined text-8xl">verified_user</span>
                </div>
                <div className="size-28 rounded-[2rem] bg-slate-100 dark:bg-slate-800 overflow-hidden mb-6 border-4 border-primary/20 shadow-inner p-1">
                   <img className="w-full h-full object-cover rounded-[1.5rem]" src={user?.imageUrl} alt="Profile" />
                </div>
                <h4 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">{user?.fullName}</h4>
                <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-2 mb-8 bg-primary/10 px-3 py-1 rounded-lg">Clinical Lead Administrator</p>
                
                <div className="w-full space-y-3 relative z-10">
                   <button className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">manage_accounts</span> Edit Credentials
                   </button>
                   <button 
                     onClick={() => signOut({ redirectUrl: '/sign-in' })}
                     className="w-full bg-red-500 text-white text-xs font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                   >
                      <span className="material-symbols-outlined text-sm">logout</span> System Sign Out
                   </button>
                </div>
             </div>

             <div className="bg-slate-950 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary opacity-10 group-hover:scale-150 transition-transform duration-1000 pointer-events-none"></div>
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">System Identity</h5>
                <div className="space-y-4 font-jakarta">
                   <div>
                      <p className="text-[9px] font-bold text-white/40 uppercase">Environment</p>
                      <p className="text-xs font-black tracking-widest">PRODUCTION_ST_MARYS</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-bold text-white/40 uppercase">Triage Node ID</p>
                      <p className="text-xs font-mono font-bold text-primary">HALLEX-MD-001</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
