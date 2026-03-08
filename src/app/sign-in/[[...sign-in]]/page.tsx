import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md p-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-2xl font-bold">emergency</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">St. Mary's Medical Portal Access</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:bg-primary/90 text-sm normal-case font-bold h-11",
              card: "shadow-xl border border-slate-200 dark:border-slate-800 rounded-2xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "rounded-xl border-slate-200 dark:border-slate-800 text-sm font-semibold",
              formFieldInput: "rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 h-11",
              footerActionLink: "text-primary hover:text-primary/80 font-bold",
            }
          }}
        />
      </div>
    </div>
  );
}
