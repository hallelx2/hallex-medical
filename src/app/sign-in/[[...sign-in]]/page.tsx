import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10 text-left">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-2xl font-bold">emergency</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Portal Access</h1>
            <p className="mt-3 text-slate-500 font-medium">Verify your credentials to enter the St. Mary's Triage Suite.</p>
          </div>
          
          <SignIn 
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
              Don't have an account?{" "}
              <a href="/sign-up" className="text-primary font-bold hover:underline">Register here</a>
            </p>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Authorized Personnel Only. All access is logged and monitored under HIPAA protocols.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Bold Quotation */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 relative overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-xl">
          <span className="material-symbols-outlined text-primary text-7xl mb-8 opacity-50">format_quote</span>
          <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-8">
            "The art of medicine consists of <span className="text-primary">amusing the patient</span> while nature cures the disease."
          </h2>
          <div className="flex items-center gap-4">
             <div className="h-px w-12 bg-primary"></div>
             <p className="text-xl text-slate-400 font-bold uppercase tracking-widest">Voltaire</p>
          </div>
        </div>
        
        <div className="absolute bottom-12 right-12 flex items-center gap-3 text-white/30 font-bold uppercase tracking-widest text-[10px]">
           <span>St. Mary's Hospital</span>
           <div className="size-1 bg-white/30 rounded-full"></div>
           <span>Est. 1924</span>
        </div>
      </div>
    </div>
  );
}
