import { getSession } from "@/lib/auth";
import { getMyDocuments } from "@/lib/actions";
import Link from "next/link";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const metadata = { title: "Visão Geral | samba paper" };

const TYPE_LABELS: Record<string, string> = {
  plano_de_aula:         "Plano de Aula",
  guia_de_aprendizagem:  "Guia de Aprendizagem",
  pei:                   "PEI",
  plano_de_eletiva:      "Plano de Eletiva",
  plano_ema:             "Plano EMA",
  projeto:               "Projeto",
  pdi:                   "PDI",
};

export default async function DashboardPage() {
  const session = await getSession();
  const docs = await getMyDocuments();

  const total  = docs.length;
  const drafts = docs.filter((d) => d.status === "draft").length;
  const finals = docs.filter((d) => d.status === "final").length;

  const stats = [
    { label: "Total de documentos", value: total,  icon: "document", color: "text-primary",      bg: "bg-primary/10"      },
    { label: "Rascunhos",           value: drafts, icon: "clock",    color: "text-secondary",    bg: "bg-secondary/10"    },
    { label: "Finalizados",         value: finals, icon: "check",    color: "text-emerald-500",  bg: "bg-emerald-500/10"  },
  ];

  const recentDocs = docs.slice(0, 5).map((doc) => ({
    id:     doc.id,
    title:  doc.title,
    type:   doc.type,
    status: doc.status,
    label:  TYPE_LABELS[doc.type] ?? doc.type,
  }));

  return (
    <DashboardClient
      firstName={session?.name.split(" ")[0] ?? ""}
      stats={stats}
      typeLabels={TYPE_LABELS}
      recentDocs={recentDocs}
      totalDocs={total}
    />
  );
}
