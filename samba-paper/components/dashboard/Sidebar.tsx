"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut, X } from "lucide-react";
import { Icon } from "@iconify/react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "./SidebarContext";

const NAV = [
  { href: "/dashboard",                 label: "Visão Geral",     icon: "line-md:home-md" },
  { href: "/dashboard/documentos",      label: "Meus Documentos", icon: "line-md:document" },
  { href: "/dashboard/documentos/novo", label: "Novo Documento",  icon: "line-md:plus-circle" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggleMobile } = useSidebar();

  const NavLink = ({
    href, icon, label, active,
  }: { href: string; icon: string; label: string; active: boolean }) => (
    <Link href={href} onClick={() => isMobileOpen && toggleMobile()} className="relative group block">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
        active
          ? "text-primary bg-primary/10 shadow-[0_4px_20px_rgba(182,76,150,0.08)]"
          : "text-foreground/60 hover:text-foreground hover:bg-muted/50"
      }`}>
        <Icon
          icon={icon}
          width={18}
          height={18}
          className={`${active ? "text-primary" : "text-foreground/40 group-hover:text-foreground/70"} shrink-0`}
        />
        <span className={`truncate whitespace-nowrap transition-all duration-300 ${
          isCollapsed ? "md:opacity-0 md:w-0 overflow-hidden" : "opacity-100"
        }`}>
          {label}
        </span>
        {active && (
          <motion.div
            layoutId="sidebar-active-paper"
            className="absolute left-0 w-1.5 h-6 bg-primary rounded-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </div>
    </Link>
  );

  const SidebarContent = (
    <>
      {/* Logo */}
      <div className={`h-24 flex items-center shrink-0 transition-all duration-300 ${
        isCollapsed ? "md:justify-center" : "px-8"
      }`}>
        <AnimatePresence mode="wait">
          {isCollapsed ? (
            <motion.div
              key="logo-collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="hidden md:block"
            >
              <Image src="/imgs/paper-logo1.svg" alt="samba paper" width={40} height={40} className="w-10 h-10 drop-shadow-md" priority />
            </motion.div>
          ) : (
            <motion.div
              key="logo-expanded"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <div className="flex items-center justify-between w-full md:block">
                <div>
                  <Image src="/imgs/paper-logotipo.svg"  alt="samba paper" width={130} height={34} className="w-auto h-8 dark:hidden" priority />
                  <Image src="/imgs/paper-logotipo2.svg" alt="samba paper" width={130} height={34} className="w-auto h-8 hidden dark:block drop-shadow-md" priority />
                </div>
                <button onClick={toggleMobile} className="md:hidden p-2 text-foreground/40 hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar overflow-x-hidden">
        <p className={`px-5 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-4 transition-opacity duration-300 ${
          isCollapsed ? "md:opacity-0 md:h-0 overflow-hidden" : "opacity-100"
        }`}>
          Principal
        </p>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href)
              }
            />
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-border/50 bg-muted/10 mt-auto shrink-0">
        <form action="/auth/signout" method="GET">
          <button
            type="submit"
            className={`flex items-center justify-center h-12 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl text-xs font-black transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isCollapsed ? "md:w-12 md:mx-auto md:px-0" : "w-full gap-3 px-4"
            }`}
          >
            <LogOut size={16} />
            <span className={isCollapsed ? "md:hidden" : ""}>Sair do Sistema</span>
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 100 : 288 }}
        transition={{ type: "spring", stiffness: 300, damping: 35 }}
        className="dashboard-glass border-r border-border/50 h-full flex-col max-md:hidden flex shrink-0 z-30 relative overflow-hidden"
      >
        {SidebarContent}
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={toggleMobile}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-background border-r border-border z-70 md:hidden flex flex-col overflow-hidden"
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
