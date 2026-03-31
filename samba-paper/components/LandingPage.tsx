"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  BookOpen, Map, UserCog, Sparkles, ClipboardList,
  FolderOpen, Target, ArrowRight, Download, Database,
  Layers, CheckCircle2, ChevronRight, Plus,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const ACCESS_URL = process.env.NEXT_PUBLIC_URL_ACCESS ?? "https://acesso.escolacabral.com.br";

const DOC_TYPES = [
  {
    icon: BookOpen,
    name: "Plano de Aula",
    color: "#FCE31D",
    desc: "Estruture aulas com objetivos, conteúdos, metodologias e avaliação de forma rápida e padronizada.",
  },
  {
    icon: Map,
    name: "Guia de Aprendizagem",
    color: "#f59e0b",
    desc: "Roteiros pedagógicos que promovem autonomia e protagonismo nos estudantes.",
  },
  {
    icon: UserCog,
    name: "PEI",
    color: "#b64c96",
    desc: "Plano Educacional Individualizado para alunos com necessidades educacionais específicas.",
  },
  {
    icon: Sparkles,
    name: "Plano de Eletiva",
    color: "#ec4899",
    desc: "Organize disciplinas optativas com justificativa, objetivos e cronograma completo.",
  },
  {
    icon: ClipboardList,
    name: "Plano EMA",
    color: "#8b5cf6",
    desc: "Ensino Médio em Ação com planejamento integrado às metodologias ativas.",
  },
  {
    icon: FolderOpen,
    name: "Projeto",
    color: "#06b6d4",
    desc: "Projetos interdisciplinares integrados ao currículo com etapas e avaliação definidas.",
  },
  {
    icon: Target,
    name: "PDI",
    color: "#10b981",
    desc: "Plano de Desenvolvimento Individual com metas, estratégias e monitoramento do aluno.",
  },
];

const FEATURES = [
  {
    icon: Download,
    title: "PDF pronto para imprimir",
    desc: "Exportação direta em PDF com identidade visual padronizada, pronto para protocolo ou arquivo.",
  },
  {
    icon: Database,
    title: "Dados da escola integrados",
    desc: "Turmas, disciplinas e alunos carregados automaticamente. Zero retrabalho ou digitação manual.",
  },
  {
    icon: Layers,
    title: "7 tipos de documentos",
    desc: "Do plano diário ao PEI anual. Tudo em um lugar, com o mesmo padrão de qualidade.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[15%] -left-[10%] w-[55%] h-[55%] rounded-full blur-[160px] bg-primary/20 dark:bg-primary/10" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[50%] rounded-full blur-[140px]" style={{ backgroundColor: "#b64c9622" }} />
        <div className="absolute top-[40%] left-[45%] w-[30%] h-[35%] rounded-full blur-[120px] bg-primary/10 dark:bg-primary/5" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-50 sticky top-0 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/imgs/paper-logo2.svg" alt="samba paper" width={36} height={36} />
            <span className="font-black text-foreground text-sm tracking-wide">
              samba <span style={{ color: "#b64c96" }}>paper</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a
              href={ACCESS_URL}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shrink-0"
              style={{ background: "linear-gradient(135deg, #FCE31D 0%, #d4a020 100%)" }}
            >
              Acessar Plataforma <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20 flex flex-col lg:flex-row items-center gap-16">

        {/* Left text */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "backOut" }}
          className="lg:w-1/2"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/60 text-muted-foreground text-xs font-semibold mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            Documentação pedagógica digital — EE Prof. Christino Cabral
          </motion.div>

          <h1 className="text-5xl lg:text-[3.75rem] font-extrabold tracking-tight leading-[1.08] text-foreground mb-6">
            Planejamento
            <span
              className="block mt-1"
              style={{
                backgroundImage: "linear-gradient(135deg, #FCE31D, #b64c96)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              pedagógico
            </span>
            <span className="block">sem esforço.</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-md">
            Crie planos de aula, guias, PEI, projetos e muito mais em minutos.
            Com os dados da escola já integrados e PDF pronto para usar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <a
              href={ACCESS_URL}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold text-black transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #FCE31D 0%, #d4a020 100%)" }}
            >
              Criar meu primeiro documento <ArrowRight size={17} />
            </a>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
            {["7 tipos de documentos", "PDF profissional", "Dados integrados"].map((f) => (
              <div key={f} className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-primary shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right — doc type preview card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "backOut" }}
          className="lg:w-1/2 w-full"
        >
          <div className="bg-card rounded-3xl border border-border shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <Image src="/imgs/paper-logo2.svg" alt="samba paper" width={32} height={32} className="shrink-0" />
              <div>
                <div className="text-xs font-black text-foreground">samba paper</div>
                <div className="text-[10px] text-muted-foreground">Selecione o tipo de documento</div>
              </div>
            </div>

            <div className="space-y-2">
              {DOC_TYPES.map((doc, i) => (
                <motion.div
                  key={doc.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${doc.color}20` }}
                  >
                    <doc.icon size={17} style={{ color: doc.color }} />
                  </div>
                  <span className="text-sm font-semibold text-foreground flex-1">{doc.name}</span>
                  <ChevronRight size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features strip ── */}
      <section className="relative z-10 border-y border-border/50 bg-muted/20 dark:bg-muted/10">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col gap-4"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #FCE31D18, #b64c9618)" }}
              >
                <feat.icon size={22} style={{ color: "#b64c96" }} />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Document Types grid ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Documentos disponíveis</p>
          <h2 className="text-4xl font-extrabold text-foreground mb-4">
            Um sistema para todos os documentos
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Sete tipos de documentos pedagógicos em um único lugar, com padrão visual e dados da sua escola.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {DOC_TYPES.map((doc, i) => (
            <motion.div
              key={doc.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4 hover:shadow-lg transition-all"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${doc.color}18` }}
              >
                <doc.icon size={22} style={{ color: doc.color }} />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1.5 text-sm">{doc.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{doc.desc}</p>
              </div>
            </motion.div>
          ))}

          {/* Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 7 * 0.06 }}
            className="bg-muted/30 rounded-2xl border border-dashed border-border p-5 flex flex-col items-center justify-center text-center gap-3 min-h-[150px]"
          >
            <Plus size={20} className="text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground/60 font-medium leading-relaxed">
              Mais modelos<br />em breve
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-20">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-3xl p-12 shadow-2xl text-center"
          >
            <div className="flex justify-center mb-6">
              <Image src="/imgs/paper-logo2.svg" alt="samba paper" width={56} height={56} />
            </div>
            <h2 className="text-3xl font-extrabold text-foreground mb-4">
              Pronto para começar?
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
              Acesse o samba paper com seu login institucional e comece a criar documentos pedagógicos hoje mesmo.
            </p>
            <a
              href={ACCESS_URL}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold text-black transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #FCE31D 0%, #d4a020 100%)" }}
            >
              Acessar Plataforma <ArrowRight size={17} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/imgs/paper-logo2.svg" alt="samba paper" width={26} height={26} />
            <span className="text-sm text-muted-foreground">
              samba paper — EE Prof. Christino Cabral
            </span>
          </div>
          <span className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()} samba innovations
          </span>
        </div>
      </footer>
    </div>
  );
}
