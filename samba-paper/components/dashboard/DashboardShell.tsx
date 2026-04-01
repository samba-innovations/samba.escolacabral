"use client";

import { SidebarProvider } from "./SidebarContext";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { PageTransition } from "./PageTransition";

interface Profile {
  name: string;
  role: string;
  avatarUrl?: string | null;
}

export function DashboardShell({ children, profile }: { children: React.ReactNode; profile: Profile }) {
  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] overflow-hidden bg-background font-outfit relative">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <TopBar profile={profile} />
          <main className="flex-1 overflow-y-auto bg-muted/20 dark:bg-black/20 p-4 md:p-8 relative custom-scrollbar">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
