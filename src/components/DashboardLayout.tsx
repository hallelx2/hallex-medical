"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser, Show } from "@clerk/nextjs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUser();

  const navItems = [
    { name: "Overview", href: "/", icon: "dashboard" },
    { name: "Call Logs", href: "/logs", icon: "call" },
    { name: "Patient Cases", href: "/cases", icon: "clinical_notes" },
    { name: "Doctor Schedule", href: "/schedule", icon: "calendar_month" },
    { name: "Audit Logs", href: "/audit", icon: "assignment" },
    { name: "Settings", href: "/settings", icon: "settings" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined">emergency</span>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">St. Mary's</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-1">
                Voice Triage System
              </p>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all ${
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="bg-primary/5 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-primary mb-1">
              System Health
            </h3>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[94%] transition-all duration-1000"></div>
            </div>
            <p className="text-[10px] mt-2 text-slate-500 font-medium">
              AI Triage nodes operational (94%)
            </p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-6 flex-1">
            <h2 className="text-xl font-bold tracking-tight">
              {navItems.find((item) => item.href === pathname)?.name ||
                "Dashboard"}
            </h2>
            <div className="max-w-md w-full relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm transition-all"
                placeholder="Search patients or records..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 dark:border-slate-800 mx-2"></div>
            
            <Show when="signed-in">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold">{user?.fullName || 'Doctor'}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    {user?.publicMetadata?.role as string || 'Medical Staff'}
                  </p>
                </div>
                <UserButton 
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "size-10 border-2 border-primary/20"
                    }
                  }}
                />
              </div>
            </Show>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
