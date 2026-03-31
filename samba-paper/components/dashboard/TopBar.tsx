import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  COORDINATOR: "Coordenador",
  TEACHER: "Professor",
  PRINCIPAL: "Diretor",
};

export function TopBar({ userName, role }: { userName: string; role: string }) {
  return (
    <header className="h-16 border-b border-border/50 flex items-center justify-between px-4 md:px-8 dashboard-glass shrink-0 z-10">
      <div>
        <h1 className="font-black text-foreground text-sm uppercase tracking-wider">
          samba <span className="text-primary">paper</span>
        </h1>
        <p className="text-[11px] text-muted-foreground">Documentos Pedagógicos</p>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="h-7 w-px bg-border" />
        <form action="/auth/signout" method="GET">
          <button
            type="submit"
            title="Sair do sistema"
            className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut size={17} />
          </button>
        </form>
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-foreground leading-none">{userName.split(" ")[0]}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{ROLE_LABELS[role] ?? role}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-black text-sm shrink-0">
            {userName[0].toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
