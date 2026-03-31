import { createDocument } from "@/lib/actions";
import { Icon } from "@iconify/react";
import Link from "next/link";

export const metadata = { title: "Novo Documento" };

const TYPES = [
  { value: "plano_de_aula",        label: "Plano de Aula",        desc: "Planejamento de aula com conteúdos, habilidades e metodologia" },
  { value: "guia_de_aprendizagem", label: "Guia de Aprendizagem", desc: "Guia bimestral com título, conteúdos, objetivos e avaliação" },
  { value: "pei",                  label: "PEI",                  desc: "Plano Educacional Individualizado para alunos da Educação Especial" },
  { value: "plano_de_eletiva",     label: "Plano de Eletiva",     desc: "Planejamento semestral da disciplina eletiva" },
  { value: "plano_ema",            label: "Plano EMA",            desc: "Plano de Esporte, Música ou Arte" },
  { value: "projeto",              label: "Projeto",              desc: "Template completo para projetos pedagógicos" },
  { value: "pdi",                  label: "PDI",                  desc: "Plano de Desenvolvimento Individual do professor" },
];

export default async function NovoDocumentoPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: preselected } = await searchParams;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/documentos" className="p-2 rounded-xl hover:bg-muted transition-colors">
          <Icon icon="line-md:arrow-left" width={16} height={16} className="text-muted-foreground" />
        </Link>
        <h1 className="text-xl font-black text-foreground">Novo Documento</h1>
      </div>

      <form action={createDocument} className="space-y-6">
        {/* Type selection */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-foreground">Tipo de documento</label>
          <div className="grid grid-cols-1 gap-2">
            {TYPES.map((t) => (
              <label key={t.value} className="cursor-pointer">
                <input type="radio" name="type" value={t.value} defaultChecked={preselected === t.value} className="sr-only peer" required />
                <div className="border border-border/50 peer-checked:border-primary peer-checked:bg-primary/5 rounded-2xl p-4 transition-all hover:border-primary/50">
                  <p className="font-bold text-foreground text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">Título do documento</label>
          <input
            type="text"
            name="title"
            required
            placeholder="Ex: Plano de Aula — Funções do 1º Bimestre"
            className="w-full bg-card border border-border/50 focus:border-primary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3 rounded-2xl transition-colors"
        >
          Criar e preencher documento
        </button>
      </form>
    </div>
  );
}
