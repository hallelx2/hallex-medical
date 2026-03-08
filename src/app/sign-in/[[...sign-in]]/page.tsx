"use client";

import React, { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  // @ts-ignore
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Step 1: Initial Email/Password Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError("");

    try {
      const result: any = await signIn.create({
        identifier: email,
        password,
      } as any);

      if (result.status === "complete") {
        if (setActive) {
          await setActive({ session: result.createdSessionId });
          router.push("/");
        }
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-jakarta">
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10 text-left">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-2xl font-bold">emergency</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase tracking-tighter">Clinical Portal</h1>
            <p className="mt-3 text-slate-500 font-medium">Enterprise access for St. Mary's Medical Staff.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-slate-700 font-black text-[10px] uppercase tracking-[0.2em] mb-2 block">
                Work Email
              </label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 h-14 px-5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                placeholder="doctor@stmarys.org"
              />
            </div>

            <div>
              <label className="text-slate-700 font-black text-[10px] uppercase tracking-[0.2em] mb-2 block">
                Security Password
              </label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 h-14 px-5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <p className="text-xs font-bold">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading || !isLoaded}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {loading ? (
                <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>Sign In to Dashboard <span className="material-symbols-outlined text-sm">login</span></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-slate-50">
            <p className="text-sm text-slate-500 font-medium italic">
              New medical staff?{" "}
              <Link href="/sign-up" className="text-primary font-bold hover:underline not-italic">Register for Access</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 bg-slate-950 relative overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-xl text-left">
          <span className="material-symbols-outlined text-primary text-7xl mb-8 opacity-50">format_quote</span>
          <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-8 font-jakarta">
            "The art of medicine consists of <span className="text-primary italic">amusing the patient</span> while nature cures the disease."
          </h2>
          <div className="flex items-center gap-4">
             <div className="h-px w-12 bg-primary"></div>
             <p className="text-xl text-slate-400 font-bold uppercase tracking-widest font-jakarta">Voltaire</p>
          </div>
        </div>
        
        <div className="absolute bottom-12 right-12 flex items-center gap-3 text-white/30 font-bold uppercase tracking-widest text-[10px] font-jakarta">
           <span>St. Mary's Hospital</span>
           <div className="size-1 bg-white/30 rounded-full"></div>
           <span>Est. 1924</span>
        </div>
      </div>
    </div>
  );
}
