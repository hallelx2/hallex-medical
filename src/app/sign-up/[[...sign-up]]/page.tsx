"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen bg-white font-jakarta text-slate-900 transition-all">
        {/* Left Side: Auth Form built with Clerk Elements */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-md">
            <div className="mb-10 text-left">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-2xl font-bold">medical_services</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Staff Registration</h1>
              <p className="mt-3 text-slate-500 font-medium">Create your clinical profile to access the triage queue.</p>
            </div>

            <SignUp.Root>
              <SignUp.Step name="start">
                <div className="space-y-6">
                  <Clerk.Field name="emailAddress">
                    <Clerk.Label className="text-slate-700 font-bold text-xs uppercase tracking-widest mb-2 block">Work Email</Clerk.Label>
                    <Clerk.Input className="w-full rounded-xl border border-slate-200 bg-slate-50 h-12 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    <Clerk.FieldError className="text-red-500 text-xs mt-2 font-bold" />
                  </Clerk.Field>

                  <SignUp.Action submit asChild>
                    <button className="w-full bg-primary hover:bg-primary/90 text-white text-sm font-bold h-12 rounded-xl transition-all shadow-md shadow-primary/10">
                      Create Staff Profile
                    </button>
                  </SignUp.Action>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-widest">Rapid Onboarding</span></div>
                  </div>

                  <Clerk.Connection name="google" asChild>
                    <button className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 h-12 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">
                      <Clerk.Icon className="size-5" />
                      Connect via Google Workspace
                    </button>
                  </Clerk.Connection>
                </div>
              </SignUp.Step>

              <SignUp.Step name="verifications">
                <SignUp.Strategy name="email_code">
                  <div className="space-y-6">
                    <div className="text-center mb-4">
                      <p className="text-sm text-slate-600 font-medium">A security code has been sent to your inbox.</p>
                    </div>
                    <Clerk.Field name="code">
                      <Clerk.Label className="text-slate-700 font-bold text-xs uppercase tracking-widest mb-2 block text-center">Enter Code</Clerk.Label>
                      <Clerk.Input className="w-full rounded-xl border border-slate-200 bg-slate-50 h-12 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono font-bold" />
                      <Clerk.FieldError className="text-red-500 text-xs mt-2 font-bold text-center" />
                    </Clerk.Field>
                    <SignUp.Action submit asChild>
                      <button className="w-full bg-primary hover:bg-primary/90 text-white text-sm font-bold h-12 rounded-xl transition-all shadow-md shadow-primary/10">
                        Complete Registration
                      </button>
                    </SignUp.Action>
                  </div>
                </SignUp.Strategy>
              </SignUp.Step>
            </SignUp.Root>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500 font-medium">
                Already have a profile?{" "}
                <Link href="/sign-in" className="text-primary font-bold hover:underline font-jakarta">Staff Sign In</Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Bold Quotation */}
        <div className="hidden lg:flex w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-blue-900"></div>
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
             </svg>
          </div>
          
          <div className="relative z-10 max-w-xl text-left">
            <span className="material-symbols-outlined text-white text-7xl mb-8 opacity-50 font-light">healing</span>
            <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-8 font-jakarta">
              "Wherever the art of medicine is loved, there is also a <span className="text-blue-200 underline decoration-wavy underline-offset-8">love of humanity</span>."
            </h2>
            <div className="flex items-center gap-4">
               <div className="h-px w-12 bg-white/50"></div>
               <p className="text-xl text-blue-100 font-bold uppercase tracking-widest font-jakarta">Hippocrates</p>
            </div>
          </div>
          
          <div className="absolute bottom-12 right-12 flex items-center gap-3 text-white/30 font-bold uppercase tracking-widest text-[10px] font-jakarta">
             <span>Clinical Excellence</span>
             <div className="size-1 bg-white/30 rounded-full"></div>
             <span>Patient First</span>
          </div>
        </div>
      </div>
    </div>
  );
}
