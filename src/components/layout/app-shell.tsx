"use client";

import { Toaster } from "sonner";
import { Sidebar } from "./sidebar";
import { ThemeProvider } from "./theme-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] p-6">{children}</div>
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
