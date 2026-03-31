"use client";

import { motion } from "framer-motion";
import { AnimatedIcon } from "./AnimatedIcon";

export function Benefits() {
  const cases = [
    {
      target: "Para Professores",
      icon: "line-md:account-small",
      points: [
        "Redução drástica do tempo de formatação e digitação",
        "Foco no conteúdo pedagógico, não na estrutura do documento",
        "Histórico de todos os documentos criados acessível a qualquer hora",
      ],
      bg: "bg-purple-50 dark:bg-purple-500/10",
      color: "text-primary",
      border: "hover:border-primary/50",
    },
    {
      target: "Para Coordenação",
      icon: "line-md:account",
      points: [
        "Revisão facilitada com documentos padronizados e completos",
        "Acompanhamento do planejamento de toda a equipe docente",
        "Indicadores de produção de documentos por turma e período",
      ],
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      color: "text-emerald-600 dark:text-emerald-400",
      border: "hover:border-emerald-400/50",
    },
    {
      target: "Para a Gestão",
      icon: "line-md:home-md",
      points: [
        "Conformidade com as exigências da SEE-SP sem burocracia extra",
        "Documentação institucional organizada e arquivada digitalmente",
        "Dados consolidados para visitas técnicas e avaliações externas",
      ],
      bg: "bg-blue-50 dark:bg-blue-500/10",
      color: "text-blue-600 dark:text-blue-400",
      border: "hover:border-blue-400/50",
    },
  ];

  return (
    <section id="beneficios" className="py-24 bg-muted/30 border-t border-border/50">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-5xl font-extrabold text-foreground mb-6">
            Impacto em Toda a Equipe
          </motion.h2>
          <p className="text-lg text-muted-foreground">Do professor em sala à gestão da escola, o samba paper simplifica o trabalho de todos.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {cases.map((bnf, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={`p-8 rounded-[2rem] bg-card border border-border shadow-md transition-all duration-300 ${bnf.border} hover:shadow-xl`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${bnf.bg}`}>
                <AnimatedIcon icon={bnf.icon} width={32} height={32} className={bnf.color} />
              </div>
              <h3 className="text-2xl font-bold mb-6 text-foreground">{bnf.target}</h3>
              <ul className="space-y-4">
                {bnf.points.map((pt, j) => (
                  <li key={j} className="flex items-start gap-3 text-muted-foreground font-medium">
                    <div className={`mt-0.5 p-1 rounded-full ${bnf.bg} shrink-0`}>
                      <AnimatedIcon icon="line-md:check-all" width={14} height={14} className={bnf.color} />
                    </div>
                    {pt}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
