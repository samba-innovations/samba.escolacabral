"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface StatItem {
  label: string;
  value: number;
  icon: string;
  color: string;
  bg: string;
}

interface RecentDoc {
  id: number;
  title: string;
  type: string;
  status: string;
  label: string;
}

interface Props {
  firstName: string;
  stats: StatItem[];
  typeLabels: Record<string, string>;
  recentDocs: RecentDoc[];
  totalDocs: number;
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

export function DashboardClient({ firstName, stats, typeLabels, recentDocs, totalDocs }: Props) {
  return (
    <div className="space-y-8 max-w-5xl">
      {/* Welcome */}
      <motion.div {...fadeUp(0)}>
        <p className="text-[13px] font-semibold text-primary/80 uppercase tracking-widest mb-1">
          Bem-vindo de volta
        </p>
        <h1 className="text-3xl font-black text-foreground">
          {firstName}<span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Crie e gerencie seus documentos pedagógicos com facilidade.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            {...fadeUp(0.08 + i * 0.06)}
            className="bg-card border border-border/50 rounded-2xl p-5 hover:shadow-md hover:shadow-primary/5 transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  {s.label}
                </p>
                <p className="text-3xl font-black text-foreground">{s.value}</p>
              </div>
              <div className={`${s.bg} p-3 rounded-xl flex items-center justify-center`}>
                <Icon icon={s.icon} width={20} height={20} className={s.color} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <motion.div {...fadeUp(0.25)}>
        <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-4">
          Criar novo documento
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(typeLabels).map(([type, label], i) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.28 + i * 0.04 }}
            >
              <Link
                href={`/dashboard/documentos/novo?type=${type}`}
                className="group bg-card border border-border/50 hover:border-primary/50 rounded-2xl p-4 text-sm font-semibold text-foreground hover:text-primary transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 flex items-center gap-2"
              >
                <Icon
                  icon="line-md:plus-circle"
                  width={16}
                  height={16}
                  className="shrink-0 text-primary"
                />
                {label}
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent docs */}
      {totalDocs > 0 && (
        <motion.div {...fadeUp(0.35)}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
              Documentos recentes
            </h2>
            <Link
              href="/dashboard/documentos"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/30">
            {recentDocs.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.38 + i * 0.05 }}
              >
                <Link
                  href={`/dashboard/documentos/${doc.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                    <Icon icon="line-md:document" width={16} height={16} className="text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{doc.label}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    doc.status === "final"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-secondary/10 text-secondary"
                  }`}>
                    {doc.status === "final" ? "Finalizado" : "Rascunho"}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
