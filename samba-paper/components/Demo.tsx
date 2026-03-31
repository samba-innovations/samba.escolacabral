"use client";

import { motion } from "framer-motion";
import { AnimatedIcon } from "./AnimatedIcon";

const ACCESS_URL = process.env.NEXT_PUBLIC_URL_ACCESS ?? "https://acesso.escolacabral.com.br";

export function Demo() {
  return (
    <section id="demonstracao" className="py-24 bg-primary/5 dark:bg-primary/8 relative">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/2">
            <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="text-3xl md:text-5xl font-extrabold text-foreground mb-6">
              Veja o <span className="text-primary">samba paper</span> em Ação
            </motion.h2>
            <motion.p initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-lg text-muted-foreground mb-8">
              Conheça a interface do editor e entenda como criar um plano de aula completo em menos de 5 minutos, com PDF profissional gerado automaticamente.
            </motion.p>
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-4">
              <a href={ACCESS_URL} className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-primary/25 hover:-translate-y-0.5">
                <AnimatedIcon icon="line-md:document" width={20} height={20} />
                Criar documento agora
              </a>
              <a href="#contato" className="inline-flex items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg">
                Solicitar demonstração
              </a>
            </motion.div>
          </div>

          <div className="lg:w-1/2 w-full">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative w-full aspect-video rounded-3xl bg-slate-900 border-4 border-slate-800 shadow-2xl flex items-center justify-center overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-secondary/10 opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/30 group-hover:scale-110 transition-transform">
                <AnimatedIcon icon="line-md:play" width={36} height={36} />
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-1/4" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
