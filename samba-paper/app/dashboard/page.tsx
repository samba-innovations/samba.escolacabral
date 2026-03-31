import { getSession } from "@/lib/auth";
import { getMyDocuments } from "@/lib/actions";
import { Icon } from "@iconify/react";
import Link from "next/link";

export const metadata = { title: "Visão Geral" };

const TYPE_LABELS: Record<string, string> = {
  plano_de_aula: "Plano de Aula",
  guia_de_aprendizagem: "Guia de Aprendizagem",
  pei: "PEI",
  plano_de_eletiva: "Plano de Eletiva",
  plano_ema: "Plano EMA",
  projeto: "Projeto",
  pdi: "PDI",
};

export default async function DashboardPage() {
  const session = await getSession();
  const docs = await getMyDocuments();

  const total = docs.length;
  const drafts = docs.filter((d) => d.status === "draft").length;
  const finals = docs.filter((d) => d.status === "final").length;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-black text-foreground">
          Olá, {session?.name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Crie e gerencie seus documentos pedagógicos com facilidade.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total de documentos", value: total, icon: "line-md:document", color: "text-primary", bg: "bg-primary/10" },
          { label: "Rascunhos", value: drafts, icon: "line-md:watch", color: "text-secondary", bg: "bg-secondary/10" },
          { label: "Finalizados", value: finals, icon: "line-md:confirm-circle", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border/50 rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{s.label}</p>
                <p className="text-3xl font-black text-foreground">{s.value}</p>
              </div>
              <div className={`${s.bg} p-3 rounded-xl flex items-center justify-center`}>
                <Icon icon={s.icon} width={20} height={20} className={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-4">Criar novo documento</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <Link
              key={type}
              href={`/dashboard/documentos/novo?type=${type}`}
              className="bg-card border border-border/50 hover:border-primary/50 rounded-2xl p-4 text-sm font-semibold text-foreground hover:text-primary transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 flex items-center gap-2"
            >
              <Icon icon="line-md:plus-circle" width={16} height={16} className="shrink-0 text-primary" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent docs */}
      {docs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Documentos recentes</h2>
            <Link href="/dashboard/documentos" className="text-xs font-bold text-primary hover:underline">Ver todos →</Link>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/30">
            {docs.slice(0, 5).map((doc) => (
              <Link
                key={doc.id}
                href={`/dashboard/documentos/${doc.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                  <Icon icon="line-md:document" width={16} height={16} className="text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">{TYPE_LABELS[doc.type]}</p>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  doc.status === "final"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-secondary/10 text-secondary"
                }`}>
                  {doc.status === "final" ? "Finalizado" : "Rascunho"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
