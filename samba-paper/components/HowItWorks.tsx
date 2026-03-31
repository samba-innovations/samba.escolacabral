"use client";

import { motion } from "framer-motion";
import { AnimatedIcon } from "./AnimatedIcon";

export function HowItWorks() {
  const tutorial = [
    { title: "Escolher Tipo", desc: "Selecione entre 7 modelos de documentos pedagógicos validados.", icon: "line-md:text-box-multiple" },
    { title: "Preencher",     desc: "Dados da turma e escola já integrados — complete apenas o conteúdo.", icon: "line-md:edit" },
    { title: "Revisar",       desc: "Pré-visualize o documento final antes de gerar o PDF.", icon: "line-md:confirm-circle" },
    { title: "Exportar PDF",  desc: "Baixe o arquivo com identidade visual padronizada em um clique.", icon: "line-md:downloading-loop" },
  ];

  return (
    <section id="comofunciona" className="py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">Como Funciona na Prática</h2>
          <p className="text-lg text-muted-foreground max-w-2xl">Um fluxo intuitivo que elimina o retrabalho e entrega documentos pedagógicos profissionais em minutos.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tutorial.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col items-center text-center hover:border-primary/40 transition-colors group">
              <div className="w-full aspect-video bg-muted rounded-2xl mb-6 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                <AnimatedIcon icon={item.icon} width={48} height={48} className="text-primary/40" />
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">{i + 1}. {item.title}</h4>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
