"use client";

import Image from "next/image";
import { AnimatedIcon } from "./AnimatedIcon";

const ACCESS_URL = process.env.NEXT_PUBLIC_URL_ACCESS ?? "https://acesso.escolacabral.com.br";

export function Footer() {
  return (
    <footer className="relative bg-background pt-24 pb-12 px-6 lg:px-12 border-t border-border/50 overflow-hidden mt-12">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-primary/8 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between bg-card/40 border border-border/50 p-10 lg:p-14 rounded-[2.5rem] mb-20 shadow-xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/8 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 md:w-2/3 mb-8 md:mb-0">
            <h3 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">Pronto para transformar sua escola?</h3>
            <p className="text-muted-foreground text-lg max-w-xl">Junte-se aos professores que já deixaram de perder tempo com formatação e estão focando no que importa: ensinar.</p>
          </div>
          <a href={ACCESS_URL} className="relative z-10 shrink-0 bg-primary hover:bg-primary/90 text-white hover:scale-105 transition-all px-8 py-4 rounded-full font-bold flex items-center gap-3 shadow-lg shadow-primary/25 w-full md:w-auto justify-center">
            Acessar Plataforma
            <AnimatedIcon icon="line-md:arrow-right" width={18} height={18} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          <div className="md:col-span-5 lg:col-span-4 pr-0 lg:pr-12">
            <div className="mb-6">
              <Image src="/imgs/innvtns-logotipo.svg" alt="Logo Samba Innovations" width={160} height={40} className="h-9 w-auto object-contain dark:hidden" priority />
              <Image src="/imgs/innvtns-logotipo2.svg" alt="Logo Samba Innovations" width={160} height={40} className="h-9 w-auto object-contain hidden dark:block" priority />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">A samba innovations resolve processos educacionais complexos através de tecnologia inteligente, simplificando a documentação pedagógica da EE Prof. Christino Cabral.</p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <a href="https://www.instagram.com/sambainnovations/" className="p-3 rounded-full bg-muted/50 hover:bg-primary/20 hover:text-primary transition-all duration-300 hover:-translate-y-1 flex items-center justify-center">
                <AnimatedIcon icon="line-md:instagram" width={18} height={18} />
              </a>
              <a href="https://www.linkedin.com/company/samba-innovations/" className="p-3 rounded-full bg-muted/50 hover:bg-primary/20 hover:text-primary transition-all duration-300 hover:-translate-y-1 flex items-center justify-center">
                <AnimatedIcon icon="line-md:linkedin" width={18} height={18} />
              </a>
            </div>
          </div>

          <div className="md:col-span-7 lg:col-span-8 grid grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-foreground mb-6">Produto</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                {[["#solucao","Funcionalidades"],["#beneficios","Benefícios"],["#comofunciona","Como Funciona"],["#demonstracao","Ver Demonstração"]].map(([href, label]) => (
                  <li key={href}><a href={href} className="hover:text-primary hover:tracking-wide transition-all duration-300 inline-block">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-6">Institucional</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                {[["#","Sobre a Empresa"],["#contato","Fale Conosco"],[ACCESS_URL,"Acessar Plataforma"]].map(([href, label]) => (
                  <li key={label}><a href={href} className="hover:text-primary hover:tracking-wide transition-all duration-300 inline-block">{label}</a></li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <h4 className="font-bold text-foreground mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                {["Política de Privacidade","Termos de Uso","Conformidade LGPD"].map((label) => (
                  <li key={label}><a href="#" className="hover:text-primary hover:tracking-wide transition-all duration-300 inline-block">{label}</a></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-xs lg:text-sm text-muted-foreground/50 border-t border-border/40 pt-8 mt-8">
          <div>© {new Date().getFullYear()} samba innovations. Todos os direitos reservados.</div>
          <div className="mt-4 md:mt-0 flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <span>Status do Sistema: <span className="text-foreground/80 font-medium">Operacional</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
