"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { AnimatedIcon } from "./AnimatedIcon";

const ACCESS_URL = process.env.NEXT_PUBLIC_URL_ACCESS ?? "https://acesso.escolacabral.com.br";

const DOC_TYPES = [
  { icon: "line-md:document-list-twotone", name: "Plano de Aula",        color: "#b64c96" },
  { icon: "line-md:document",              name: "Guia de Aprendizagem", color: "#d4609e" },
  { icon: "line-md:account-small",         name: "PEI",                  color: "#8b3a7a" },
  { icon: "line-md:star-pulsating-loop",   name: "Plano de Eletiva",     color: "#c45090" },
  { icon: "line-md:text-box-multiple",     name: "Plano EMA",            color: "#9e4488" },
  { icon: "line-md:list",                  name: "Projeto",              color: "#b64c96" },
  { icon: "line-md:pencil",               name: "PDI",                  color: "#8b3a7a" },
];

export function Hero() {
  return (
    <section className="relative min-h-dvh flex items-center pt-28 pb-16 lg:pt-32 overflow-hidden bg-background">
      <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} style={{ willChange: "transform" }} className="pointer-events-none absolute -top-[10%] -left-[10%] w-[50%] h-[50%] z-0">
        <div className="w-full h-full bg-primary/25 dark:bg-primary/15 rounded-[40%_60%_70%_30%] blur-[120px]" style={{ minWidth: "400px", minHeight: "400px" }} />
      </motion.div>
      <motion.div animate={{ x: [0, -50, 0], y: [0, 50, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} style={{ willChange: "transform" }} className="pointer-events-none absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] z-0">
        <div className="w-full h-full min-w-75 min-h-75 bg-secondary/30 dark:bg-secondary/15 rounded-full blur-[100px]" />
      </motion.div>
      <motion.div animate={{ x: [0, 80, 0], y: [0, -60, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }} style={{ willChange: "transform" }} className="pointer-events-none absolute top-[20%] left-[30%] w-[30%] h-[30%] z-0">
        <div className="w-full h-full min-w-50 min-h-50 bg-primary/15 dark:bg-primary/10 rounded-full blur-[90px]" />
      </motion.div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-[55%] text-left">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-semibold mb-6 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_#b64c96]" />
              Documentação Pedagógica Digital
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: "backOut" }} className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-tight mb-8">
              Planejamento <span className="text-primary block mt-2">pedagógico</span> sem esforço.
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: "backOut" }} className="text-xl text-muted-foreground leading-relaxed mb-10 max-w-xl">
              Crie planos de aula, guias, PEI, projetos e muito mais em minutos. Com os dados da escola já integrados e PDF pronto para usar.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: "backOut" }} className="flex flex-col sm:flex-row gap-4 mb-10">
              <a href={ACCESS_URL} className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-primary/25 hover:-translate-y-0.5 text-sm">
                Criar meu primeiro documento
                <AnimatedIcon icon="line-md:arrow-right" width={18} height={18} />
              </a>
              <a href="#solucao" className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all text-sm">
                Ver como funciona
              </a>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-wrap gap-5 text-sm text-muted-foreground">
              {["7 tipos de documentos", "PDF profissional", "Dados integrados"].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <AnimatedIcon icon="line-md:confirm-circle" width={16} height={16} className="text-primary shrink-0" />
                  {f}
                </div>
              ))}
            </motion.div>
          </div>

          <div className="lg:w-[45%] w-full">
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "backOut" }} className="relative w-full max-w-lg mx-auto">
              <div className="bg-card rounded-[2.5rem] border border-border shadow-2xl overflow-hidden">
                <div className="w-full h-14 border-b border-border bg-muted/30 flex items-center justify-between px-5 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Image src="/imgs/paper-logo2.svg" alt="samba paper" width={18} height={18} />
                    <span className="text-xs font-bold text-foreground">samba paper</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Novo documento</span>
                </div>
                <div className="p-5 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Selecione o tipo de documento</p>
                  {DOC_TYPES.map((doc, i) => (
                    <motion.div key={doc.name} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.07 }} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${doc.color}20` }}>
                        <AnimatedIcon icon={doc.icon} width={17} height={17} style={{ color: doc.color }} />
                      </div>
                      <span className="text-sm font-semibold text-foreground flex-1">{doc.name}</span>
                      <AnimatedIcon icon="line-md:chevron-right" width={14} height={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 2 }} className="absolute -right-6 bottom-24 bg-card border border-border p-4 rounded-2xl shadow-xl flex items-center gap-3 z-20">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                  <AnimatedIcon icon="line-md:confirm-circle" width={20} height={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">PDF gerado!</div>
                  <div className="text-xs text-muted-foreground">Plano de Aula · agora</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
