"use client";

import { Menu, PanelLeft, LogOut, UserCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSidebar } from "./SidebarContext";

const ROLE_LABELS: Record<string, string> = {
  ADMIN:          "Administrador",
  PRINCIPAL:      "Diretor",
  VICE_PRINCIPAL: "Vice-Diretor",
  COORDINATOR:    "Coordenador",
  TEACHER:        "Professor",
  SECRETARY:      "Secretaria",
};

interface TopBarProps {
  profile: {
    name: string;
    role: string;
    avatarUrl?: string | null;
  };
}

export function TopBar({ profile }: TopBarProps) {
  const { toggleSidebar, toggleMobile } = useSidebar();
  const role = (profile.role ?? "").toUpperCase();

  return (
    <header className="h-20 dashboard-glass border-b border-border/50 flex items-center justify-between px-4 md:px-8 shrink-0 transition-colors z-20">
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={toggleMobile}
          className="md:hidden text-foreground hover:bg-muted p-2 rounded-xl transition-colors shrink-0 outline-none"
        >
          <Menu size={20} />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex text-muted-foreground hover:text-primary p-2 rounded-xl hover:bg-primary/5 transition-all active:scale-95"
          title="Alternar Sidebar"
        >
          <PanelLeft size={20} />
        </button>

        <div className="hidden sm:block mt-1">
          <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
            samba paper
          </h2>
          <p className="text-[11px] font-semibold text-primary uppercase tracking-widest">
            Documentos Pedagógicos
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />

        <div className="h-8 w-px bg-border mx-1" />

        <form action="/auth/signout" method="GET">
          <button
            type="submit"
            title="Sair do sistema"
            className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut size={18} />
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-foreground leading-none">
              {profile.name.split(" ")[0]}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {ROLE_LABELS[role] ?? profile.role}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full relative overflow-hidden ring-2 ring-primary/20 shrink-0">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {profile.name?.charAt(0) || <UserCircle size={20} className="opacity-50" />}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
