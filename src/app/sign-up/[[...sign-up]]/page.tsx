import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10 text-left">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-2xl font-bold">medical_services</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Join the Staff</h1>
            <p className="mt-3 text-slate-500 font-medium">Create your professional medical profile to start managing triage cases.</p>
          </div>
          
          <SignUp 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 p-0 w-full",
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-sm normal-case font-bold h-12 rounded-xl transition-all shadow-md shadow-primary/10",
                socialButtonsBlockButton: "rounded-xl border-slate-200 text-sm font-semibold h-12",
                formFieldInput: "rounded-xl border-slate-200 bg-slate-50 h-12 focus:ring-2 focus:ring-primary/20 transition-all",
                footer: "hidden", 
                header: "hidden", 
                dividerRow: "my-6",
                formFieldLabel: "text-slate-700 font-bold text-xs uppercase tracking-widest mb-2",
              }
            }}
          />

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Already have an account?{" "}
              <a href="/sign-in" className="text-primary font-bold hover:underline">Sign in here</a>
            </p>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">
              St. Mary's Hospital Human Resources Dept.
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
        
        <div className="relative z-10 max-w-xl">
          <span className="material-symbols-outlined text-white text-7xl mb-8 opacity-50 font-light">healing</span>
          <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-8">
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
