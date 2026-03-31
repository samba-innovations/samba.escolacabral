"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, LogOut, PlusCircle } from "lucide-react";
import { clsx } from "clsx";

const NAV = [
  { href: "/dashboard",            label: "Visão Geral",     icon: LayoutDashboard },
  { href: "/dashboard/documentos", label: "Meus Documentos", icon: FileText },
  { href: "/dashboard/documentos/novo", label: "Novo Documento", icon: PlusCircle },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col bg-card border-r border-border/50">
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-black" />
          </div>
          <span className="font-black text-foreground">samba <span className="text-primary">paper</span></span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
              path === item.href
                ? "bg-primary text-black"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border/50">
        <a
          href="/auth/signout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sair do Sistema
        </a>
      </div>
    </aside>
  );
}
