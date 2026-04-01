import { getMyDocuments, deleteDocument } from "@/lib/actions";
import { PlusCircle, FileText, Trash2 } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Meus Documentos" };

const TYPE_LABELS: Record<string, string> = {
  plano_de_aula: "Plano de Aula",
  guia_de_aprendizagem: "Guia de Aprendizagem",
  pei: "PEI",
  plano_de_eletiva: "Plano de Eletiva",
  plano_ema: "Plano EMA",
  projeto: "Projeto",
  pdi: "PDI",
};

export default async function DocumentosPage() {
  const docs = await getMyDocuments();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-foreground">Meus Documentos</h1>
        <Link
          href="/dashboard/documentos/novo"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <PlusCircle size={16} />
          Novo documento
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
          <FileText size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-foreground">Nenhum documento ainda</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Crie seu primeiro documento pedagógico.</p>
          <Link
            href="/dashboard/documentos/novo"
            className="inline-flex items-center gap-2 bg-primary text-black font-bold px-4 py-2 rounded-xl text-sm"
          >
            <PlusCircle size={16} />
            Criar documento
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/30">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 px-6 py-4">
              <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                <FileText size={16} className="text-secondary" />
              </div>
              <Link href={`/dashboard/documentos/${doc.id}`} className="flex-1 min-w-0 hover:text-primary transition-colors">
                <p className="font-bold text-foreground text-sm truncate">{doc.title}</p>
                <p className="text-xs text-muted-foreground">
                  {TYPE_LABELS[doc.type]} · {new Date(doc.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              </Link>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                doc.status === "final"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-secondary/10 text-secondary"
              }`}>
                {doc.status === "final" ? "Finalizado" : "Rascunho"}
              </span>
              <form action={async () => { "use server"; await deleteDocument(doc.id); }}>
                <button type="submit" className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 size={16} />
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
