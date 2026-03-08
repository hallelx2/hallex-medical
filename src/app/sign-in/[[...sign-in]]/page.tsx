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

  const signInWithGoogle = () => {
    if (!isLoaded || !signIn) {
      console.error("Clerk not loaded yet");
      return;
    }
    console.log("Initiating Google Sign-In redirect...");
    try {
      (signIn as any).authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-up/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err) {
      console.error("OAuth Error:", err);
    }
  };

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

          <div className="relative py-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-bold tracking-widest">
                Authorized SSO
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 h-14 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm"
          >
            <svg className="size-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>

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
