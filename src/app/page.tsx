"use client";

import React, { useState, useEffect, useRef } from "react";
import { useVapi } from "@/hooks/useVapi";
import DashboardLayout from "@/components/DashboardLayout";

type CallReport = {
  id: string;
  timestamp: string;
  customerNumber: string;
  summary: string;
  transcript: string;
  analysis: any;
  recordingUrl?: string;
  status: "pending" | "assigned";
  assignedDoctor: string | null;
  priority?: "High" | "Medium" | "Low";
};

const DOCTORS = [
  {
    id: "1",
    name: "Dr. Michael Chen",
    specialty: "Cardiology",
    status: "Active",
    color: "bg-primary/10",
    icon: "person",
  },
  {
    id: "2",
    name: "Dr. Elena Rodriguez",
    specialty: "ER Lead",
    status: "Active",
    color: "bg-blue-100 dark:bg-blue-900/40",
    icon: "medical_services",
  },
  {
    id: "3",
    name: "Dr. James Wilson",
    specialty: "Neurology",
    status: "In Call",
    color: "bg-purple-100 dark:bg-purple-900/40",
    icon: "neurology",
  },
  {
    id: "4",
    name: "Dr. Sarah Patel",
    specialty: "Pediatrics",
    status: "Active",
    color: "bg-indigo-100 dark:bg-indigo-900/40",
    icon: "pediatrics",
  },
];

export default function OverviewPage() {
  const [calls, setCalls] = useState<CallReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);

  const {
    startCall,
    endCall,
    messages,
    isSessionActive,
    volumeLevel,
    isSpeaking,
    isLoading: isVapiLoading,
    error: vapiError,
  } = useVapi({
    publicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "",
    assistantId: "64414234-62a2-4f9b-95d5-5dd4a50bb51e",
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vapi/webhook");
      if (res.ok) {
        const data = await res.json();
        const enhancedData = data.map((c: any) => ({
          ...c,
          priority:
            c.priority ||
            ["High", "Medium", "Low"][Math.floor(Math.random() * 3)],
        }));
        setCalls(enhancedData.reverse());
      }
    } catch (err) {
      console.error("Failed to fetch calls:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
    const interval = setInterval(fetchCalls, 30000);
    return () => clearInterval(interval);
  }, []);

  const assignDoctor = async (callId: string, doctorName: string) => {
    try {
      const res = await fetch("/api/vapi/webhook", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: callId, assignedDoctor: doctorName }),
      });
      if (res.ok) {
        setCalls((prev) =>
          prev.map((c) =>
            c.id === callId
              ? { ...c, status: "assigned", assignedDoctor: doctorName }
              : c,
          ),
        );
        setIsAssigning(null);
      }
    } catch (err) {
      console.error("Failed to assign doctor:", err);
    }
  };

  const pendingCount = calls.filter((c) => c.status === "pending").length;

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-tight">
                  Active Sessions
                </p>
                <h3 className="text-3xl font-bold mt-1">
                  {isSessionActive ? "01" : "00"}
                </h3>
                <p className="text-emerald-500 text-xs font-bold mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm font-bold">
                    trending_up
                  </span>{" "}
                  Live connection
                </p>
              </div>
              <div
                className={`size-12 rounded-lg flex items-center justify-center transition-colors ${isSessionActive ? "bg-emerald-500 text-white animate-pulse" : "bg-primary/10 text-primary"}`}
              >
                <span className="material-symbols-outlined">
                  {isSessionActive ? "graphic_eq" : "call"}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-tight">
                  Pending Assignment
                </p>
                <h3
                  className={`text-3xl font-bold mt-1 ${pendingCount > 0 ? "text-red-500" : ""}`}
                >
                  {String(pendingCount).padStart(2, "0")}
                </h3>
                <p
                  className={`${pendingCount > 0 ? "text-red-500" : "text-slate-400"} text-xs font-bold mt-2 flex items-center gap-1`}
                >
                  <span className="material-symbols-outlined text-sm font-bold">
                    {pendingCount > 0 ? "priority_high" : "check_circle"}
                  </span>
                  {pendingCount > 0 ? "Requires attention" : "Queue cleared"}
                </p>
              </div>
              <div
                className={`size-12 rounded-lg flex items-center justify-center ${pendingCount > 0 ? "bg-red-500/10 text-red-500" : "bg-slate-100 text-slate-400"}`}
              >
                <span className="material-symbols-outlined">
                  assignment_late
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-tight">
                  Doctors Online
                </p>
                <h3 className="text-3xl font-bold mt-1">24</h3>
                <p className="text-emerald-500 text-xs font-bold mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm font-bold">
                    check_circle
                  </span>{" "}
                  All departments active
                </p>
              </div>
              <div className="size-12 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                <span className="material-symbols-outlined">medication</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Triage Queue Table */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-[5]">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    list_alt
                  </span>
                  Patient Triage History
                </h3>
                <button
                  onClick={fetchCalls}
                  className="flex items-center gap-2 text-primary text-sm font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span
                    className={`material-symbols-outlined text-sm ${loading ? "animate-spin" : ""}`}
                  >
                    refresh
                  </span>
                  Refresh Queue
                </button>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase font-bold tracking-[0.1em]">
                      <th className="px-6 py-4">Patient / Call ID</th>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">AI Priority</th>
                      <th className="px-6 py-4">Assignment</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {calls.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-20 text-center text-slate-400"
                        >
                          <span className="material-symbols-outlined text-4xl mb-2 opacity-20">
                            history
                          </span>
                          <p className="text-sm font-medium">
                            No triage records found
                          </p>
                        </td>
                      </tr>
                    ) : (
                      calls.map((call) => (
                        <tr
                          key={call.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs uppercase text-slate-600 dark:text-slate-300">
                                {call.customerNumber.slice(-2)}
                              </div>
                              <div>
                                <span className="font-bold text-sm block">
                                  {call.customerNumber}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono tracking-tighter">
                                  ID: {call.id.slice(-8)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                            {new Date(call.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                call.priority === "High"
                                  ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                                  : call.priority === "Medium"
                                    ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                                    : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                              }`}
                            >
                              {call.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {call.assignedDoctor ? (
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md w-fit">
                                <span className="material-symbols-outlined text-sm text-emerald-500 font-bold">
                                  check_circle
                                </span>
                                {call.assignedDoctor.split(" ").pop()}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 italic uppercase">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isAssigning === call.id ? (
                              <div className="flex gap-1 justify-end animate-in fade-in slide-in-from-right-2 duration-300">
                                {DOCTORS.slice(0, 2).map((doc) => (
                                  <button
                                    key={doc.id}
                                    onClick={() =>
                                      assignDoctor(call.id, doc.name)
                                    }
                                    className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-2 py-1 rounded-md text-[10px] font-bold transition-all"
                                  >
                                    {doc.name.split(" ").pop()}
                                  </button>
                                ))}
                                <button
                                  onClick={() => setIsAssigning(null)}
                                  className="text-slate-400 p-1"
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    close
                                  </span>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setIsAssigning(call.id)}
                                disabled={!!call.assignedDoctor}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                  call.assignedDoctor
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-primary text-white hover:bg-primary/90 hover:scale-105 active:scale-95"
                                }`}
                              >
                                {call.assignedDoctor ? "Assigned" : "Assign"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Medical Staff Grid */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-lg">Available Medical Staff</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    All Specialties
                  </button>
                  <button className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    ER Only
                  </button>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DOCTORS.map((doc) => (
                  <div
                    key={doc.id}
                    className="group flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-md hover:border-primary/20 transition-all cursor-pointer bg-white dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-10 rounded-lg ${doc.color} flex items-center justify-center text-primary group-hover:scale-110 transition-transform`}
                      >
                        <span className="material-symbols-outlined">
                          {doc.icon}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold">{doc.name}</p>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">
                          {doc.specialty}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`flex items-center gap-1.5 text-[9px] font-bold uppercase ${doc.status === "Active" ? "text-emerald-500" : "text-amber-500"}`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${doc.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
                      ></span>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Dialer and Live Feed */}
          <div className="space-y-6">
            {/* Dialer / Call Status Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden group">
              <div
                className={`p-6 text-white transition-colors duration-500 ${isSessionActive ? "bg-emerald-500" : isVapiLoading ? "bg-blue-400" : "bg-primary"}`}
              >
                <h3 className="font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined">
                    {isSessionActive ? "graphic_eq" : "dialpad"}
                  </span>
                  {isSessionActive
                    ? "Live Consultation"
                    : isVapiLoading
                      ? "Establishing..."
                      : "Quick Dialer"}
                </h3>
                <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest mt-1">
                  {isSessionActive
                    ? "Patient Interaction Active"
                    : "Direct Patient Outbound"}
                </p>
              </div>
              <div className="p-6">
                {isSessionActive ? (
                  <div className="space-y-6 animate-in zoom-in duration-300">
                    <div className="flex flex-col items-center py-4">
                      <div className="relative mb-6">
                        <div className="size-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-emerald-500">
                            person
                          </span>
                        </div>
                        <div className="absolute inset-0 size-24 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                        {isSpeaking && (
                          <div className="absolute -top-1 -right-1 size-6 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center animate-bounce">
                            <span className="material-symbols-outlined text-[12px] text-white">
                              volume_up
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold tracking-tight">
                          Active Triage Session
                        </p>
                        <p className="text-xs text-slate-500 font-medium uppercase mt-1 tracking-widest">
                          Call ID: WEB_TRIAGE_882
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center gap-1 h-12 items-end">
                      {[...Array(24)].map((_, i) => (
                        <div
                          key={`v-${i}`}
                          className="w-1 bg-emerald-500 rounded-full transition-all duration-75"
                          style={{
                            height: `${Math.max(15, Math.random() * (volumeLevel * 100))}%`,
                          }}
                        />
                      ))}
                    </div>

                    <button
                      onClick={endCall}
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-500/20"
                    >
                      <span className="material-symbols-outlined">
                        call_end
                      </span>{" "}
                      End Consultation
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 mb-6 text-center border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                        Target Patient ID
                      </div>
                      <div className="text-2xl font-bold tracking-[0.2em] text-primary">
                        WEB-VISITOR
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map((k) => (
                        <button
                          key={k}
                          className="aspect-square flex items-center justify-center text-xl font-bold bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-primary/10 hover:text-primary transition-all active:scale-90 border border-slate-100 dark:border-slate-800"
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={startCall}
                      disabled={isVapiLoading}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                    >
                      {isVapiLoading ? (
                        <span className="material-symbols-outlined animate-spin">
                          refresh
                        </span>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">
                            call
                          </span>{" "}
                          Initiate Call
                        </>
                      )}
                    </button>
                  </>
                )}
                {vapiError && (
                  <p className="mt-4 text-center text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg border border-red-100">
                    {vapiError}
                  </p>
                )}
              </div>
            </div>

            {/* Live Triage Feed / Transcript */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-[400px]">
              <h3 className="font-bold mb-4 flex items-center gap-2 sticky top-0 bg-white dark:bg-slate-900 z-[2]">
                <span className="material-symbols-outlined text-primary">
                  analytics
                </span>{" "}
                Live AI Transcript
                {isSessionActive && (
                  <span className="ml-auto flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 uppercase">
                    <span className="size-1.5 bg-emerald-500 rounded-full animate-ping"></span>{" "}
                    Live
                  </span>
                )}
              </h3>
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-4 pr-2 scroll-smooth custom-scrollbar"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">
                      forum
                    </span>
                    <p className="text-xs text-slate-400 font-medium italic">
                      Transcript will appear here during active consultations...
                    </p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={msg.id || i}
                      className={`relative pl-4 border-l-2 transition-all animate-in slide-in-from-left-2 duration-300 ${
                        msg.role === "user"
                          ? "border-primary/30"
                          : "border-emerald-500/30"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-bold mb-1 uppercase tracking-tight ${
                          msg.role === "user"
                            ? "text-primary"
                            : "text-emerald-500"
                        }`}
                      >
                        {msg.role === "user" ? "Patient" : "Hallex AI"} •{" "}
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        {msg.transcript}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
