"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen bg-white font-jakarta">
      {/* Left Side: Auth Form built with Clerk Elements */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10 text-left">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-2xl font-bold">emergency</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Portal Access</h1>
            <p className="mt-3 text-slate-500 font-medium">Verify your medical credentials to enter.</p>
          </div>

          <SignIn.Root>
            <SignIn.Step name="start">
              <div className="space-y-6">
                <Clerk.Field name="identifier">
                  <Clerk.Label className="text-slate-700 font-bold text-xs uppercase tracking-widest mb-2 block">
                    Medical Email Address
                  </Clerk.Label>
                  <Clerk.Input className="w-full rounded-xl border border-slate-200 bg-slate-50 h-12 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                  <Clerk.FieldError className="text-red-500 text-xs mt-2 font-bold" />
                </Clerk.Field>

                <SignIn.Action submit asChild>
                  <button className="w-full bg-primary hover:bg-primary/90 text-white text-sm font-bold h-12 rounded-xl transition-all shadow-md shadow-primary/10">
                    Continue to Portal
                  </button>
                </SignIn.Action>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-widest">Authorized OAuth</span></div>
                </div>

                <Clerk.Connection name="google" asChild>
                  <button className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 h-12 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">
                    <Clerk.Icon className="size-5" />
                    Sign in with Google
                  </button>
                </Clerk.Connection>
              </div>
            </SignIn.Step>

            <SignIn.Step name="verifications">
              <SignIn.Strategy name="email_code">
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <p className="text-sm text-slate-600">Enter the verification code sent to your email.</p>
                  </div>
                  <Clerk.Field name="code">
                    <Clerk.Label className="text-slate-700 font-bold text-xs uppercase tracking-widest mb-2 block text-center">Verification Code</Clerk.Label>
                    <Clerk.Input className="w-full rounded-xl border border-slate-200 bg-slate-50 h-12 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono" />
                    <Clerk.FieldError className="text-red-500 text-xs mt-2 font-bold text-center" />
                  </Clerk.Field>
                  <SignIn.Action submit asChild>
                    <button className="w-full bg-primary hover:bg-primary/90 text-white text-sm font-bold h-12 rounded-xl transition-all shadow-md shadow-primary/10">
                      Verify & Enter
                    </button>
                  </SignIn.Action>
                </div>
              </SignIn.Strategy>
            </SignIn.Step>
          </SignIn.Root>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 font-medium">
              New to St. Mary's?{" "}
              <Link href="/sign-up" className="text-primary font-bold hover:underline font-jakarta">Create Staff Profile</Link>
            </p>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              HIPAA Compliant Environment • St. Mary's Health
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Bold Quotation */}
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
