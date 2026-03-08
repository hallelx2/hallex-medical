"use client";

import React, { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  // @ts-ignore
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName
      } as any);

      await (signUp as any).prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "An error occurred during sign up.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setError("");

    try {
      const completeSignUp: any = await signUp.attemptEmailAddressVerification({ code });
      if (completeSignUp.status === "complete") {
        if (setActive) {
          await setActive({ session: completeSignUp.createdSessionId });
          router.push("/");
        }
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-jakarta text-slate-900">
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10 text-left">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-2xl font-bold">medical_services</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight uppercase tracking-tighter text-slate-900">Registration</h1>
            <p className="mt-3 text-slate-500 font-medium">Initialize clinical credentials at St. Mary's.</p>
          </div>

          {!verifying ? (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-black text-[10px] uppercase tracking-widest mb-2 block">First Name</label>
                  <input 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 h-14 px-5 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-black text-[10px] uppercase tracking-widest mb-2 block">Last Name</label>
                  <input 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 h-14 px-5 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-black text-[10px] uppercase tracking-widest mb-2 block">Institutional Email</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 h-14 px-5 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 font-black text-[10px] uppercase tracking-widest mb-2 block">Secure Password</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 h-14 px-5 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading || !isLoaded}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
              >
                {loading ? <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Create Profile'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="text-center bg-primary/5 p-6 rounded-2xl border border-primary/10 mb-6">
                <p className="text-sm text-primary font-bold">Verification code sent to {email}.</p>
              </div>
              <div>
                <label className="text-slate-700 font-black text-[10px] uppercase tracking-widest mb-2 block text-center">Enter verification code</label>
                <input 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 h-16 px-5 focus:ring-4 focus:ring-primary/10 outline-none transition-all text-center text-3xl font-black tracking-[0.5em]"
                />
              </div>
              <button 
                type="submit"
                disabled={loading || !isLoaded}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-xs"
              >
                {loading ? <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></span> : 'Complete Registration'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center border-t border-slate-50 pt-8">
            <p className="text-sm text-slate-500 font-medium italic">
              Already have a profile?{" "}
              <Link href="/sign-in" className="text-primary font-bold hover:underline not-italic">Staff Sign In</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-blue-900"></div>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
           </svg>
        </div>
        
        <div className="relative z-10 max-w-xl text-left text-white font-jakarta">
          <span className="material-symbols-outlined text-white text-7xl mb-8 opacity-50 font-light">healing</span>
          <h2 className="text-5xl font-black leading-[1.1] tracking-tight mb-8">
            "Wherever the art of medicine is loved, there is also a <span className="text-blue-200 underline decoration-wavy underline-offset-8">love of humanity</span>."
          </h2>
          <div className="flex items-center gap-4">
             <div className="h-px w-12 bg-white/50"></div>
             <p className="text-xl text-blue-100 font-bold uppercase tracking-widest">Hippocrates</p>
          </div>
        </div>
        
        <div className="absolute bottom-12 right-12 flex items-center gap-3 text-white/30 font-bold uppercase tracking-widest text-[10px]">
           <span>Clinical Excellence</span>
           <div className="size-1 bg-white/30 rounded-full"></div>
           <span>Patient First</span>
        </div>
      </div>
    </div>
  );
}
