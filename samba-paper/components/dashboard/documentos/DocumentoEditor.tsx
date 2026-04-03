"use client";

import { useState, useTransition, Fragment } from "react";
import { saveDocument, getAulasCurriculo, getSkillsByCodigos } from "@/lib/actions";
import { toast } from "sonner";
import { Loader2, Upload, Download, Check, ChevronDown, Calendar } from "lucide-react";

interface DocData {
  id: number;
  type: string;
  title: string;
  content: Record<string, string>;
  pdfPath: string | null;
  status: string;
}

type AulaRecord = {
  id: number;
  aulaNum: number;
  titulo: string;
  eixo: string | null;
  unidadeTematica: string | null;
  habilidadeCodigo: string | null;
  habilidadeTexto: string | null;
  objetoConhecimento: string | null;
  conteudo: string | null;
  objetivos: string | null;
  bloco: string | null;
};

interface Props {
  doc: DocData;
  userName: string;
  classes: { id: number; name: string; grade: string; section: string; ciclo: string; serie: string }[];
  disciplines: { id: number; name: string; type: string; aulasNome: string | null }[];
  students: { id: number; name: string; ra: string; className: string }[];
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-background border border-border/50 focus:border-primary rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors resize-none";

function TextInput({
  name,
  value,
  onChange,
  placeholder,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  );
}

function TextArea({
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={inputCls}
    />
  );
}

function SelectInput({
  name,
  value,
  onChange,
  options,
  placeholder,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} cursor-pointer`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Chip multi-select ───────────────────────────────────────────────────────

function ChipSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  if (options.length === 0) return null;
  const selected = new Set(
    value ? value.split("\n").map((s) => s.trim()).filter(Boolean) : options
  );
  const toggle = (opt: string) => {
    const s = new Set(selected);
    s.has(opt) ? s.delete(opt) : s.add(opt);
    onChange(options.filter((o) => s.has(o)).join("\n"));
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            selected.has(opt)
              ? "bg-primary/10 border-primary text-primary"
              : "bg-background border-border/40 text-muted-foreground line-through opacity-40 hover:opacity-70"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Checkbox list ────────────────────────────────────────────────────────────

function CheckboxList({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = new Set(
    value ? value.split(", ").map((s) => s.trim()).filter(Boolean) : []
  );
  const toggle = (opt: string) => {
    const s = new Set(selected);
    s.has(opt) ? s.delete(opt) : s.add(opt);
    onChange(options.filter((o) => s.has(o)).join(", "));
  };
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={selected.has(opt)}
            onChange={() => toggle(opt)}
            className="w-4 h-4 rounded accent-primary cursor-pointer"
          />
          <span className="text-sm text-foreground group-hover:text-primary transition-colors">{opt}</span>
        </label>
      ))}
    </div>
  );
}

// ─── Predefined options ───────────────────────────────────────────────────────

const MOMENTOS_INICIAIS = [
  { id:  1, nome: "Situação-problema contextualizada",  descritor: "Apresenta problema real para mobilizar conhecimentos prévios e levantar hipóteses." },
  { id:  2, nome: "Pergunta geradora aberta",           descritor: "Propõe questão ampla que estimula reflexão e revela repertório inicial dos alunos." },
  { id:  3, nome: "Brainstorm estruturado",             descritor: "Levanta ideias prévias dos alunos para identificar conhecimentos e concepções alternativas." },
  { id:  4, nome: "Mapa conceitual inicial",            descritor: "Solicita organização de conceitos para diagnosticar relações cognitivas existentes." },
  { id:  5, nome: "Quiz diagnóstico rápido",            descritor: "Aplica questões objetivas para verificar conhecimentos prévios de forma imediata." },
  { id:  6, nome: "Estudo de caso curto",               descritor: "Apresenta situação concreta para análise, avaliando interpretação e raciocínio inicial." },
  { id:  7, nome: "Demonstração discrepante",           descritor: "Exibe fenômeno inesperado para gerar conflito cognitivo e curiosidade investigativa." },
  { id:  8, nome: "Levantamento de hipóteses",          descritor: "Incentiva previsões dos alunos para avaliar compreensão inicial de causalidade." },
  { id:  9, nome: "Análise de erro",                   descritor: "Explora resolução incorreta para identificar entendimento e promover pensamento crítico." },
  { id: 10, nome: "Conexão com o cotidiano",            descritor: "Relaciona o tema à vivência dos alunos para ativar conhecimentos prévios." },
  { id: 11, nome: "Mini desafio imediato",              descritor: "Propõe problema rápido sem instrução prévia para observar estratégias espontâneas." },
  { id: 12, nome: "Think-Pair-Share",                  descritor: "Estimula discussão em etapas para favorecer participação e explicitação do pensamento." },
  { id: 13, nome: "Nuvem de palavras",                 descritor: "Coleta palavras-chave dos alunos para mapear repertório coletivo inicial." },
  { id: 14, nome: "Classificação/organização",         descritor: "Solicita agrupamento de elementos para diagnosticar critérios de organização mental." },
  { id: 15, nome: "Linha do tempo conceitual",         descritor: "Organiza eventos ou conceitos em sequência para avaliar noção de processo." },
  { id: 16, nome: "Pergunta com posicionamento",       descritor: "Solicita opinião justificada para identificar capacidade argumentativa inicial." },
  { id: 17, nome: "Uso de dados reais",                descritor: "Apresenta dados para interpretação inicial, verificando leitura e análise." },
  { id: 18, nome: "Gamificação inicial",               descritor: "Introduz narrativa ou desafio para engajar e contextualizar a aprendizagem." },
  { id: 19, nome: "Autoavaliação inicial",             descritor: "Incentiva o aluno a refletir sobre seu próprio nível de conhecimento." },
  { id: 20, nome: "Integração com tecnologia",         descritor: "Utiliza recursos tecnológicos para despertar interesse e diagnosticar familiaridade." },
];

const DESENVOLVIMENTO_OPTS = [
  { id:  1, nome: "Resolução orientada de problemas",       descritor: "Desenvolve conceitos por meio da resolução guiada de situações-problema." },
  { id:  2, nome: "Aprendizagem baseada em problemas (PBL)", descritor: "Investiga problema complexo em grupo, articulando teoria e prática." },
  { id:  3, nome: "Aprendizagem baseada em projetos (PjBL)", descritor: "Desenvolve produto ou solução ao longo da atividade com aplicação real." },
  { id:  4, nome: "Estudo de caso aprofundado",             descritor: "Analisa situação detalhada, propondo soluções fundamentadas." },
  { id:  5, nome: "Experimentação prática",                 descritor: "Realiza experimentos para observar fenômenos e validar hipóteses." },
  { id:  6, nome: "Modelagem matemática/científica",        descritor: "Representa situações reais por meio de modelos matemáticos ou computacionais." },
  { id:  7, nome: "Programação aplicada",                   descritor: "Desenvolve algoritmos/códigos para resolver problemas específicos." },
  { id:  8, nome: "Rotação por estações",                   descritor: "Alterna atividades em diferentes estações com foco em habilidades diversas." },
  { id:  9, nome: "Sala de aula invertida (aplicação)",     descritor: "Aplica conhecimentos previamente estudados em atividades práticas." },
  { id: 10, nome: "Aprendizagem colaborativa estruturada",  descritor: "Resolve tarefas em grupo com papéis definidos e interdependência." },
  { id: 11, nome: "Resolução em níveis (progressão)",       descritor: "Trabalha atividades com dificuldade crescente para consolidar aprendizagem." },
  { id: 12, nome: "Análise e interpretação de dados",       descritor: "Explora dados reais para extrair padrões, conclusões e inferências." },
  { id: 13, nome: "Simulação (digital ou analógica)",       descritor: "Utiliza simulações para compreender sistemas complexos." },
  { id: 14, nome: "Construção de protótipos",               descritor: "Desenvolve artefatos físicos ou digitais para testar ideias." },
  { id: 15, nome: "Debate estruturado",                     descritor: "Discute ideias com base em evidências e argumentação lógica." },
  { id: 16, nome: "Ensino entre pares (peer instruction)",  descritor: "Alunos explicam conceitos entre si com mediação do professor." },
  { id: 17, nome: "Resolução comentada (metacognição)",     descritor: "Explicita o raciocínio durante a resolução de problemas." },
  { id: 18, nome: "Gamificação aplicada",                   descritor: "Utiliza mecânicas de jogo para engajar na resolução de desafios." },
  { id: 19, nome: "Investigação guiada (inquiry-based)",    descritor: "Conduz investigação com orientação parcial do professor." },
  { id: 20, nome: "Uso de tecnologias digitais interativas",descritor: "Utiliza softwares, sensores ou plataformas para exploração ativa." },
];

const FECHAMENTO_OPTS = [
  { id:  1, nome: "Síntese coletiva mediada",               descritor: "Organiza os principais conceitos da aula com participação dos alunos." },
  { id:  2, nome: "Retomada da questão inicial",            descritor: "Revisa o problema gerador à luz dos conhecimentos construídos." },
  { id:  3, nome: "Construção de mapa conceitual final",    descritor: "Sistematiza conceitos e relações após a aprendizagem." },
  { id:  4, nome: "Registro estruturado (caderno/portfólio)",descritor: "Formaliza os aprendizados em formato organizado e pessoal." },
  { id:  5, nome: "Resposta escrita reflexiva",             descritor: "Elabora síntese individual com base na compreensão adquirida." },
  { id:  6, nome: "Metacognição guiada",                    descritor: "Reflete sobre o que e como aprendeu durante a aula." },
  { id:  7, nome: "Correção comentada",                     descritor: "Analisa soluções destacando estratégias e possíveis erros." },
  { id:  8, nome: "Generalização do conceito",              descritor: "Amplia o conhecimento para outros contextos ou situações." },
  { id:  9, nome: "Aplicação rápida (transferência)",       descritor: "Resolve novo problema para verificar consolidação do aprendizado." },
  { id: 10, nome: "Autoavaliação final",                    descritor: "Avalia o próprio desempenho e nível de compreensão." },
  { id: 11, nome: "Exit ticket",                            descritor: "Responde questão breve para evidenciar aprendizagem imediata." },
  { id: 12, nome: "Socialização de resultados",             descritor: "Compartilha soluções, produtos ou conclusões com a turma." },
  { id: 13, nome: "Construção de resumo coletivo",          descritor: "Produz síntese conjunta dos conteúdos abordados." },
  { id: 14, nome: "Comparação 'antes e depois'",            descritor: "Confronta ideias iniciais com o conhecimento atual." },
  { id: 15, nome: "Conexão interdisciplinar",               descritor: "Relaciona o conteúdo com outras áreas do conhecimento." },
  { id: 16, nome: "Proposição de continuidade (gancho)",    descritor: "Indica desdobramentos ou próximos passos da aprendizagem." },
  { id: 17, nome: "Elaboração de pergunta final",           descritor: "Formula novas questões a partir do que foi aprendido." },
  { id: 18, nome: "Checklist de aprendizagem",              descritor: "Verifica objetivos atingidos durante a aula." },
  { id: 19, nome: "Feedback imediato do professor",         descritor: "Oferece devolutiva clara sobre o desempenho da turma." },
  { id: 20, nome: "Validação coletiva de conceitos-chave",  descritor: "Confirma, com a turma, os conhecimentos essenciais construídos." },
];

// ─── TecnicaBadge — badge compacto com tooltip e painel de detalhe ───────────

type TecnicaItem = { id: number; nome: string; descritor: string };

function TecnicaBadge({
  item,
  selected,
  onSelect,
}: {
  item: TecnicaItem;
  selected: boolean;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="relative group/tb">
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all whitespace-nowrap active:scale-95 ${
          selected
            ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30"
            : "bg-background border-border/50 text-foreground hover:border-primary/60 hover:bg-primary/5"
        }`}
      >
        <span className={`mr-1 font-black text-[10px] ${selected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {item.id.toString().padStart(2, "0")}
        </span>
        {item.nome}
      </button>
      {/* Tooltip — desktop only */}
      <div className="absolute bottom-full left-0 mb-2 hidden md:group-hover/tb:flex flex-col z-[100] pointer-events-none w-64">
        <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-2xl text-xs drop-shadow-xl">
          <p className="font-bold text-foreground mb-0.5">{item.nome}</p>
          <p className="text-muted-foreground leading-relaxed">{item.descritor}</p>
        </div>
        <div className="w-2 h-2 bg-card border-r border-b border-border rotate-45 ml-3 -mt-1.5 shrink-0" />
      </div>
    </div>
  );
}

function TecnicaDetailPanel({ item }: { item: TecnicaItem }) {
  return (
    <div className="mt-2 border border-primary/20 bg-primary/5 rounded-xl px-4 py-3">
      <p className="text-xs font-black text-primary uppercase tracking-wider mb-1">{item.nome}</p>
      <p className="text-xs text-foreground leading-relaxed">{item.descritor}</p>
    </div>
  );
}

const RECURSOS_OPTS = [
  "Livro didático",
  "Quadro branco",
  "Projetor / Datashow",
  "Caderno de atividades",
  "Material impresso / Xerox",
  "Material manipulável",
  "Vídeo / Recurso audiovisual",
  "Computador / Tablet",
  "Acesso à internet",
];

const AVALIACAO_OPTS = [
  "Observação e participação",
  "Atividade em sala",
  "Exercícios no caderno",
  "Tarefa de casa",
  "Trabalho em grupo",
  "Apresentação oral",
  "Avaliação escrita / Prova",
  "Autoavaliação",
];

function parseCodeList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/\n+/)
    .map((s) => s.replace(/^[\s\-•*–]+/, "").trim())
    .filter((s) => s.length > 2 && s.length < 80);
}

function parseBulletList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/\n+/)
    .map((s) => s.replace(/^[\s\-•*–]+/, "").trim())
    .filter((s) => s.length > 3);
}

// ─── Section title ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">{title}</h3>
        <div className="flex-1 h-px bg-border/50" />
      </div>
      {children}
    </div>
  );
}

// ─── Date picker ─────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAY_HEADERS = ["D","S","T","Q","Q","S","S"];

function todayStr() {
  const t = new Date();
  return `${String(t.getDate()).padStart(2,"0")}/${String(t.getMonth()+1).padStart(2,"0")}/${t.getFullYear()}`;
}

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const effectiveValue = value || todayStr();
  const [nav, setNav] = useState(() => {
    const p = effectiveValue.split("/");
    return p.length === 3 && !isNaN(+p[2]) ? new Date(+p[2], +p[1] - 1, 1) : new Date();
  });

  const daysInMonth = new Date(nav.getFullYear(), nav.getMonth() + 1, 0).getDate();
  const firstDow = new Date(nav.getFullYear(), nav.getMonth(), 1).getDay();

  function selectDay(day: number) {
    const d = String(day).padStart(2, "0");
    const m = String(nav.getMonth() + 1).padStart(2, "0");
    onChange(`${d}/${m}/${nav.getFullYear()}`);
    setOpen(false);
  }

  function isSelected(day: number) {
    const p = effectiveValue.split("/");
    return (
      p.length === 3 &&
      +p[0] === day &&
      +p[1] === nav.getMonth() + 1 &&
      +p[2] === nav.getFullYear()
    );
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={effectiveValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="dd/mm/aaaa"
          className={`${inputCls} flex-1`}
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="px-3 border border-border/50 rounded-xl text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors bg-background"
        >
          <Calendar size={15} />
        </button>
      </div>
      {open && (
        <div className="absolute z-50 top-full mt-1 right-0 bg-card border border-border rounded-2xl p-3 shadow-xl w-64">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setNav(new Date(nav.getFullYear(), nav.getMonth() - 1, 1))}
              className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              ‹
            </button>
            <span className="text-xs font-bold text-foreground">
              {MONTH_NAMES[nav.getMonth()]} {nav.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setNav(new Date(nav.getFullYear(), nav.getMonth() + 1, 1))}
              className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 text-center mb-1">
            {DAY_HEADERS.map((d, i) => (
              <span key={i} className="text-xs text-muted-foreground font-bold py-1">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDow }).map((_, i) => <span key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const sel = isSelected(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`text-xs py-1.5 rounded-lg transition-all hover:bg-primary/10 ${
                    sel ? "bg-primary text-primary-foreground font-bold" : "text-foreground"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Form fields per document type ───────────────────────────────────────────

const BIMESTRES_OPTS = [
  { value: "1", label: "1º Bimestre" },
  { value: "2", label: "2º Bimestre" },
  { value: "3", label: "3º Bimestre" },
  { value: "4", label: "4º Bimestre" },
];

const PERIODO_OPTS = [
  { value: "por_aula",   label: "Por aula",    desc: "Uma aula específica do currículo" },
  { value: "semanal",    label: "Semanal",     desc: "Plano para as aulas da semana" },
  { value: "quinzenal",  label: "Quinzenal",   desc: "Plano para duas semanas" },
  { value: "bimestral",  label: "Bimestral",   desc: "Plano para o bimestre completo" },
];

// ─── Step indicator (navegável) ───────────────────────────────────────────────

function StepIndicator({
  step,
  onGoTo,
}: {
  step: number;
  onGoTo: (s: number) => void;
}) {
  const labels = ["Período", "Aulas", "Formulário"];
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((n, i) => {
        const done = n < step;
        const active = n === step;
        return (
          <Fragment key={n}>
            <button
              type="button"
              onClick={() => done && onGoTo(n)}
              className={`flex items-center gap-1.5 ${done ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                done   ? "bg-primary border-primary text-primary-foreground" :
                active ? "bg-primary/10 border-primary text-primary" :
                         "bg-background border-border/40 text-muted-foreground"
              }`}>
                {done ? <Check size={11} /> : n}
              </div>
              <span className={`text-xs font-semibold hidden sm:block transition-colors ${
                active ? "text-foreground" : done ? "text-primary/80 hover:text-primary" : "text-muted-foreground"
              }`}>
                {labels[i]}
              </span>
            </button>
            {i < 2 && <div className="w-8 h-px bg-border/40 mx-1" />}
          </Fragment>
        );
      })}
    </div>
  );
}

// ─── AulaBadge + AulaDetailPanel ─────────────────────────────────────────────

function AulaBadge({
  aula,
  selected,
  multiSelect,
  onToggle,
}: {
  aula: AulaRecord;
  selected: boolean;
  multiSelect: boolean;
  onToggle: (id: number) => void;
}) {
  return (
    <div className="relative group/badge">
      <button
        type="button"
        onClick={() => onToggle(aula.id)}
        className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all whitespace-nowrap active:scale-95 ${
          selected
            ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30"
            : "bg-background border-border/50 text-foreground hover:border-primary/60 hover:bg-primary/5"
        } ${multiSelect && selected ? "ring-2 ring-primary/20" : ""}`}
      >
        {multiSelect && selected && <span className="mr-1">✓</span>}
        Aula {aula.aulaNum}
      </button>
      {/* Tooltip on hover — desktop only */}
      <div className="absolute bottom-full left-0 mb-2 hidden md:group-hover/badge:flex flex-col z-[100] pointer-events-none w-56">
        <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-2xl text-xs drop-shadow-xl">
          <p className="font-bold text-foreground">{aula.titulo}</p>
          {aula.unidadeTematica && (
            <p className="text-muted-foreground mt-0.5 line-clamp-2">{aula.unidadeTematica}</p>
          )}
        </div>
        <div className="w-2 h-2 bg-card border-r border-b border-border rotate-45 ml-4 -mt-1.5 shrink-0" />
      </div>
    </div>
  );
}

function AulaDetailPanel({ aulas }: { aulas: AulaRecord[] }) {
  if (aulas.length === 0) return null;
  const habs = [...new Set(aulas.flatMap((a) =>
    parseBulletList(a.habilidadeTexto).concat(parseCodeList(a.habilidadeCodigo))
  ))];
  const cont = [...new Set(aulas.flatMap((a) => parseBulletList(a.conteudo)))];
  return (
    <div className="mt-3 border border-primary/20 bg-primary/5 rounded-xl px-4 py-3 space-y-3">
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs font-black text-primary uppercase tracking-wider">
          {aulas.length === 1 ? `Aula ${aulas[0].aulaNum}` : `${aulas.length} aulas`}
        </span>
        {aulas.map((a) => (
          <span key={a.id} className="text-xs text-foreground font-medium">{aulas.length > 1 ? `${a.aulaNum}. ${a.titulo}` : a.titulo}</span>
        ))}
      </div>
      {habs.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Habilidades BNCC</p>
          <div className="space-y-1">
            {habs.slice(0, 6).map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                <span className="text-xs text-foreground leading-relaxed">{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {cont.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Conteúdo</p>
          <div className="flex flex-wrap gap-1.5">
            {cont.slice(0, 8).map((ct, i) => (
              <span key={i} className="text-xs bg-background border border-border/50 rounded-lg px-2 py-1 text-foreground">{ct}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlanoDeAulaForm({
  c,
  set,
  classes,
  disciplines,
}: {
  c: Record<string, string>;
  set: (k: string, v: string) => void;
  classes: Props["classes"];
  disciplines: Props["disciplines"];
}) {
  const [step, setStep] = useState(1);
  const [aulas, setAulas] = useState<AulaRecord[]>([]);
  const [loadingAulas, setLoadingAulas] = useState(false);
  const [noAulas, setNoAulas] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [habilidadeOpcoes, setHabilidadeOpcoes] = useState<string[]>([]);
  const [conteudoOpcoes, setConteudoOpcoes] = useState<string[]>([]);
  const [momentoId, setMomentoId] = useState<number | null>(null);
  const [desenvolvimentoId, setDesenvolvimentoId] = useState<number | null>(null);
  const [fechamentoId, setFechamentoId] = useState<number | null>(null);
  const [selectedTurmas, setSelectedTurmas] = useState<string[]>(
    c.turma ? [c.turma] : []
  );

  const periodo = c.periodo ?? "por_aula";
  const multiSelect = periodo !== "por_aula";
  const primaryTurma = selectedTurmas[0] ?? "";
  const selectedClass = classes.find((cl) => cl.name === primaryTurma);
  const nivelLabel = selectedClass
    ? selectedClass.ciclo === "fundamental" ? "Anos Finais (EF)" : "Ensino Médio"
    : null;

  async function loadAulas(turmaName: string, disciplina: string, bimStr: string) {
    const cl = classes.find((x) => x.name === turmaName);
    if (!cl || !disciplina || !bimStr) { setAulas([]); setNoAulas(false); return; }
    const disc = disciplines.find((d) => d.name === disciplina);
    const disciplinaNome = disc?.aulasNome ?? disciplina;
    setLoadingAulas(true);
    setNoAulas(false);
    try {
      const rows = await getAulasCurriculo(cl.ciclo, cl.serie, disciplinaNome, Number(bimStr));
      setAulas(rows);
      if (rows.length === 0) setNoAulas(true);
    } finally {
      setLoadingAulas(false);
    }
  }

  function toggleTurma(name: string) {
    setSelectedTurmas((prev) => {
      const next = prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name];
      set("turma", next[0] ?? "");
      set("turmas", next.join(", "));
      if (next[0] !== prev[0]) loadAulas(next[0] ?? "", c.disciplina ?? "", c.bimestre ?? "");
      return next;
    });
  }

  function toggleAula(id: number) {
    setSelectedIds((prev) =>
      !multiSelect ? [id] : prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // Barra de navegação sticky — sempre visível
  function NavBar() {
    const canNext =
      step === 1 ? primaryTurma !== "" && !!c.disciplina && !!c.bimestre
      : step === 2 ? selectedIds.length > 0
      : false;

    return (
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-card/95 backdrop-blur-sm border-b border-border/20 flex items-center gap-2 sm:gap-3 mb-5">
        <StepIndicator step={step} onGoTo={(s) => s < step && setStep(s)} />
        <div className="flex gap-2 ml-auto shrink-0">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              ← Voltar
            </button>
          )}
          {step < 3 && (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => { if (step === 1) setStep(2); else applyAulas(); }}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              {step === 1 ? "Ver aulas →" : "Usar seleção →"}
            </button>
          )}
        </div>
      </div>
    );
  }

  async function applyAulas() {
    const selected = aulas.filter((a) => selectedIds.includes(a.id));
    if (selected.length === 0) return;

    if (!multiSelect) {
      const a = selected[0];
      set("aula_id", String(a.id));
      set("aula_num", String(a.aulaNum));
      set("tema", a.titulo);
      set("eixo", a.eixo ?? "");
      set("unidade_tematica", a.unidadeTematica ?? "");
      set("objeto_conhecimento", a.objetoConhecimento ?? "");
      set("objetivo_geral", a.objetivos ?? "");

      const codigos = parseCodeList(a.habilidadeCodigo);
      const textos = parseBulletList(a.habilidadeTexto);
      const fallback = codigos.length > 0 ? codigos : textos;
      setHabilidadeOpcoes(fallback);
      set("habilidades", fallback.join("\n"));
      if (codigos.length > 0) {
        getSkillsByCodigos(codigos).then((skills) => {
          if (skills.length > 0) {
            const habOpcoes = skills.map((s) => `(${s.code}) ${s.description}`);
            setHabilidadeOpcoes(habOpcoes);
            set("habilidades", habOpcoes.join("\n"));
          }
        }).catch(() => {});
      }
      const contItems = parseBulletList(a.conteudo);
      setConteudoOpcoes(contItems);
      set("conteudo", contItems.join("\n"));
    } else {
      set("aula_ids", selectedIds.join(","));
      set("aula_nums", selected.map((a) => String(a.aulaNum)).join(", "));
      set("tema", selected.map((a) => a.titulo).join(" | "));

      const allCodigos = [...new Set(selected.flatMap((a) => parseCodeList(a.habilidadeCodigo)))];
      const allTextos  = [...new Set(selected.flatMap((a) => parseBulletList(a.habilidadeTexto)))];
      const fallback = allCodigos.length > 0 ? allCodigos : allTextos;
      setHabilidadeOpcoes(fallback);
      set("habilidades", fallback.join("\n"));
      if (allCodigos.length > 0) {
        getSkillsByCodigos(allCodigos).then((skills) => {
          if (skills.length > 0) {
            const habOpcoes = skills.map((s) => `(${s.code}) ${s.description}`);
            setHabilidadeOpcoes(habOpcoes);
            set("habilidades", habOpcoes.join("\n"));
          }
        }).catch(() => {});
      }
      const allCont = [...new Set(selected.flatMap((a) => parseBulletList(a.conteudo)))];
      setConteudoOpcoes(allCont);
      set("conteudo", allCont.join("\n"));
      const allObj = [...new Set(selected.flatMap((a) => parseBulletList(a.objetivos)))];
      if (allObj.length > 0) set("objetivo_geral", allObj.join("\n"));
    }

    setStep(3);
  }

  // ── Step 1: Período + Identificação ──────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="space-y-5">
        <NavBar />
        <Section title="Tipo de plano">
          <div className="grid grid-cols-2 gap-3">
            {PERIODO_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("periodo", opt.value)}
                className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                  periodo === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border/40 bg-background hover:border-primary/40"
                }`}
              >
                <p className="font-bold text-sm text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Turma(s)">
          <p className="text-xs text-muted-foreground -mt-2 mb-2">
            Selecione uma ou mais turmas (mesmo plano para 1ªA, 1ªB, 1ªC…)
          </p>
          <div className="flex flex-wrap gap-2">
            {classes.map((cl) => {
              const sel = selectedTurmas.includes(cl.name);
              return (
                <button
                  key={cl.id}
                  type="button"
                  onClick={() => toggleTurma(cl.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                    sel
                      ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : "bg-background border-border/50 text-foreground hover:border-primary/60 hover:bg-primary/5"
                  }`}
                >
                  {cl.name}
                </button>
              );
            })}
          </div>
          {nivelLabel && (
            <p className="text-xs text-primary font-semibold mt-2">{nivelLabel}</p>
          )}
        </Section>

        <Section title="Disciplina, Bimestre e Data">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Disciplina">
              <SelectInput
                name="disciplina"
                value={c.disciplina ?? ""}
                onChange={(v) => { set("disciplina", v); loadAulas(primaryTurma, v, c.bimestre ?? ""); }}
                options={disciplines
                  .filter((d) => {
                    if (!selectedClass) return true;
                    // EM: só base_comum sem "ciências" e sem componentes exclusivos de EF
                    // EF: exclui disciplinas exclusivas de EM (sem serie de EM no nome)
                    // Usa disciplineType: "base_comum" e "itinerario" para EM, só "base_comum" para EF
                    if (selectedClass.ciclo === "medio" && d.type === "base_comum") return true;
                    if (selectedClass.ciclo === "medio" && d.type === "itinerario") return true;
                    if (selectedClass.ciclo === "fundamental" && d.type === "base_comum") return true;
                    return false;
                  })
                  .map((d) => ({ value: d.name, label: d.name }))}
                placeholder="Selecione a disciplina"
              />
            </Field>
            <Field label="Bimestre">
              <SelectInput
                name="bimestre"
                value={c.bimestre ?? ""}
                onChange={(v) => { set("bimestre", v); loadAulas(primaryTurma, c.disciplina ?? "", v); }}
                options={BIMESTRES_OPTS}
                placeholder="Selecione o bimestre"
              />
            </Field>
            <Field label="Data" hint="Digite ou clique no calendário">
              <DatePicker value={c.data ?? ""} onChange={(v) => set("data", v)} />
            </Field>
          </div>
        </Section>
      </div>
    );
  }

  // ── Step 2: Seleção de aulas ──────────────────────────────────────────────────
  if (step === 2) {
    const selectedAulaObjs = aulas.filter((a) => selectedIds.includes(a.id));
    return (
      <div className="space-y-5">
        <NavBar />

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="font-bold text-foreground">{c.disciplina}</span>
          <span>·</span>
          <span>{BIMESTRES_OPTS.find((b) => b.value === c.bimestre)?.label}</span>
          <span>·</span>
          <span>{PERIODO_OPTS.find((p) => p.value === periodo)?.label}</span>
          {nivelLabel && <><span>·</span><span className="text-primary font-semibold">{nivelLabel}</span></>}
          {multiSelect && <span className="text-muted-foreground italic">— selecione múltiplas aulas</span>}
        </div>

        {loadingAulas ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 size={16} className="animate-spin" />
            Carregando aulas…
          </div>
        ) : noAulas ? (
          <div className="border border-destructive/30 bg-destructive/5 rounded-xl px-4 py-4 text-center space-y-2">
            <p className="text-sm font-bold text-destructive">Nenhuma aula encontrada</p>
            <p className="text-xs text-muted-foreground">
              Verifique a combinação de turma, disciplina e bimestre. Volte ao passo anterior para ajustar.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {aulas.map((a) => (
                <AulaBadge
                  key={a.id}
                  aula={a}
                  selected={selectedIds.includes(a.id)}
                  multiSelect={multiSelect}
                  onToggle={toggleAula}
                />
              ))}
            </div>
            <AulaDetailPanel aulas={selectedAulaObjs} />
          </>
        )}
      </div>
    );
  }

  // ── Step 3: Formulário ────────────────────────────────────────────────────────
  const selectedAulas = aulas.filter((a) => selectedIds.includes(a.id));
  return (
    <div className="space-y-5">
      <NavBar />

      {selectedAulas.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black text-primary uppercase tracking-wider mb-1">
              {selectedAulas.length === 1 ? `Aula ${selectedAulas[0].aulaNum}` : `${selectedAulas.length} aulas`}
              {selectedTurmas.length > 1 && ` · ${selectedTurmas.length} turmas`}
            </p>
            {selectedAulas.map((a) => (
              <p key={a.id} className="text-xs text-foreground">{a.aulaNum}. {a.titulo}</p>
            ))}
            {selectedTurmas.length > 1 && (
              <p className="text-xs text-muted-foreground mt-1">{selectedTurmas.join(", ")}</p>
            )}
          </div>
          <button type="button" onClick={() => setStep(2)} className="text-xs text-primary hover:text-primary/80 font-bold shrink-0 transition-colors">
            Alterar
          </button>
        </div>
      )}

      <Section title="Identificação">
        <Field label="Tema / Título da aula">
          <TextInput name="tema" value={c.tema ?? ""} onChange={(v) => set("tema", v)} placeholder="Ex: Funções do 1º Grau" />
        </Field>
      </Section>

      <Section title="Objetivos e Habilidades">
        <Field label="Objetivo geral">
          <TextArea name="objetivo_geral" value={c.objetivo_geral ?? ""} onChange={(v) => set("objetivo_geral", v)} placeholder="O que o aluno deverá ser capaz de fazer ao final da aula?" rows={3} />
        </Field>
        <Field
          label="Habilidades BNCC / Currículo Paulista"
          hint="Preenchido automaticamente ao selecionar a aula"
        >
          {habilidadeOpcoes.length > 0 ? (
            <div className="flex flex-col gap-2">
              {habilidadeOpcoes.map((h, i) => (
                <div key={i} className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                  <span className="mt-0.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span className="text-sm text-foreground leading-relaxed">{h}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-xl px-4 py-3 border border-border/40">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/40 shrink-0" />
              Preenchido automaticamente ao selecionar a aula
            </div>
          )}
        </Field>
        {c.objeto_conhecimento && (
          <Field label="Objeto de conhecimento">
            <TextInput name="objeto_conhecimento" value={c.objeto_conhecimento ?? ""} onChange={(v) => set("objeto_conhecimento", v)} placeholder="" />
          </Field>
        )}
      </Section>

      <Section title="Conteúdo e Desenvolvimento">
        <Field
          label="Conteúdo"
          hint={conteudoOpcoes.length > 0 ? "Clique para incluir ou excluir cada conteúdo" : "Pré-preenchido ao selecionar a aula"}
        >
          {conteudoOpcoes.length > 0 ? (
            <ChipSelect
              options={conteudoOpcoes}
              value={c.conteudo ?? ""}
              onChange={(v) => set("conteudo", v)}
            />
          ) : (
            <TextArea name="conteudo" value={c.conteudo ?? ""} onChange={(v) => set("conteudo", v)} placeholder="Conteúdos a serem trabalhados..." rows={4} />
          )}
        </Field>
        <Field label="Momento inicial" hint="10–15 min — passe o mouse para ver detalhes, clique para selecionar">
          <div className="flex flex-wrap gap-2">
            {MOMENTOS_INICIAIS.map((m) => (
              <TecnicaBadge
                key={m.id}
                item={m}
                selected={momentoId === m.id}
                onSelect={(id) => {
                  setMomentoId(id);
                  const found = MOMENTOS_INICIAIS.find((x) => x.id === id);
                  if (found) set("desenvolvimento_inicial", `${found.nome} — ${found.descritor}`);
                }}
              />
            ))}
          </div>
          {momentoId !== null && (
            <>
              <TecnicaDetailPanel item={MOMENTOS_INICIAIS.find((x) => x.id === momentoId)!} />
              <TextArea
                name="desenvolvimento_inicial"
                value={c.desenvolvimento_inicial ?? ""}
                onChange={(v) => set("desenvolvimento_inicial", v)}
                placeholder="Descreva como aplicará esta técnica nesta aula…"
                rows={3}
              />
            </>
          )}
        </Field>
        <Field label="Desenvolvimento" hint="25–30 min — atividade principal">
          <div className="flex flex-wrap gap-2">
            {DESENVOLVIMENTO_OPTS.map((m) => (
              <TecnicaBadge
                key={m.id}
                item={m}
                selected={desenvolvimentoId === m.id}
                onSelect={(id) => {
                  setDesenvolvimentoId(id);
                  const found = DESENVOLVIMENTO_OPTS.find((x) => x.id === id);
                  if (found) set("desenvolvimento_principal", `${found.nome} — ${found.descritor}`);
                }}
              />
            ))}
          </div>
          {desenvolvimentoId !== null && (
            <>
              <TecnicaDetailPanel item={DESENVOLVIMENTO_OPTS.find((x) => x.id === desenvolvimentoId)!} />
              <TextArea
                name="desenvolvimento_principal"
                value={c.desenvolvimento_principal ?? ""}
                onChange={(v) => set("desenvolvimento_principal", v)}
                placeholder="Descreva como aplicará esta técnica nesta aula…"
                rows={4}
              />
            </>
          )}
        </Field>
        <Field label="Fechamento / Sistematização" hint="~10 min">
          <div className="flex flex-wrap gap-2">
            {FECHAMENTO_OPTS.map((m) => (
              <TecnicaBadge
                key={m.id}
                item={m}
                selected={fechamentoId === m.id}
                onSelect={(id) => {
                  setFechamentoId(id);
                  const found = FECHAMENTO_OPTS.find((x) => x.id === id);
                  if (found) set("desenvolvimento_fechamento", `${found.nome} — ${found.descritor}`);
                }}
              />
            ))}
          </div>
          {fechamentoId !== null && (
            <>
              <TecnicaDetailPanel item={FECHAMENTO_OPTS.find((x) => x.id === fechamentoId)!} />
              <TextArea
                name="desenvolvimento_fechamento"
                value={c.desenvolvimento_fechamento ?? ""}
                onChange={(v) => set("desenvolvimento_fechamento", v)}
                placeholder="Descreva como aplicará esta técnica nesta aula…"
                rows={3}
              />
            </>
          )}
        </Field>
      </Section>

      <Section title="Recursos e Avaliação">
        <Field label="Recursos e materiais">
          <CheckboxList
            options={RECURSOS_OPTS}
            value={c.recursos_materiais ?? ""}
            onChange={(v) => set("recursos_materiais", v)}
          />
        </Field>
        <Field label="Avaliação">
          <CheckboxList
            options={AVALIACAO_OPTS}
            value={c.avaliacao ?? ""}
            onChange={(v) => set("avaliacao", v)}
          />
        </Field>
      </Section>
    </div>
  );
}

function GuiaAprendizagemForm({
  c,
  set,
  classes,
  disciplines,
}: {
  c: Record<string, string>;
  set: (k: string, v: string) => void;
  classes: Props["classes"];
  disciplines: Props["disciplines"];
}) {
  const [loadingAulas, setLoadingAulas] = useState(false);
  const [estrategiaId, setEstrategiaId] = useState<number | null>(null);
  const selectedTurmas = c.turmas ? c.turmas.split(", ").filter(Boolean) : c.turma ? [c.turma] : [];

  function toggleTurma(name: string) {
    const prev = selectedTurmas;
    const next = prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name];
    set("turma", next[0] ?? "");
    set("turmas", next.join(", "));
    if (next[0] !== prev[0]) autoFillBimestre(next[0] ?? "", c.disciplina ?? "", c.bimestre ?? "");
  }

  async function autoFillBimestre(turmaName: string, disciplina: string, bimStr: string) {
    const cl = classes.find((x) => x.name === turmaName);
    if (!cl || !disciplina || !bimStr) return;
    const disc = disciplines.find((d) => d.name === disciplina);
    const disciplinaNome = disc?.aulasNome ?? disciplina;
    setLoadingAulas(true);
    try {
      const rows = await getAulasCurriculo(cl.ciclo, cl.serie, disciplinaNome, Number(bimStr));
      if (rows.length === 0) return;
      const habs = rows.map((a) => [a.habilidadeCodigo, a.habilidadeTexto].filter(Boolean).join(" ")).filter(Boolean).join("\n");
      const conts = rows.map((a) => a.conteudo).filter(Boolean).join("\n");
      const objs = rows.map((a) => a.objetivos).filter(Boolean).join("\n");
      if (habs) set("habilidades", habs);
      if (conts) set("conteudos", conts);
      if (objs) set("objetivos_gerais", objs);
      if (rows[0].unidadeTematica) set("tema", rows[0].unidadeTematica);
    } finally {
      setLoadingAulas(false);
    }
  }

  const primaryTurma = selectedTurmas[0] ?? "";
  const primaryClass = classes.find((cl) => cl.name === primaryTurma);
  const filteredDisciplines = disciplines.filter((d) => {
    if (!primaryClass) return true;
    if (primaryClass.ciclo === "medio") return d.type === "base_comum" || d.type === "itinerario";
    return d.type === "base_comum";
  });

  return (
    <>
      <Section title="Identificação">
        <Field label="Turma(s)" hint="Selecione uma ou mais turmas">
          <div className="flex flex-wrap gap-2">
            {classes.map((cl) => {
              const sel = selectedTurmas.includes(cl.name);
              return (
                <button key={cl.id} type="button" onClick={() => toggleTurma(cl.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${sel ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30" : "bg-background border-border/50 text-foreground hover:border-primary/60 hover:bg-primary/5"}`}>
                  {cl.name}
                </button>
              );
            })}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Disciplina">
            <SelectInput name="disciplina" value={c.disciplina ?? ""} onChange={(v) => { set("disciplina", v); autoFillBimestre(primaryTurma, v, c.bimestre ?? ""); }} options={filteredDisciplines.map((d) => ({ value: d.name, label: d.name }))} placeholder="Selecione a disciplina" />
          </Field>
          <Field label="Bimestre">
            <SelectInput name="bimestre" value={c.bimestre ?? ""} onChange={(v) => { set("bimestre", v); autoFillBimestre(primaryTurma, c.disciplina ?? "", v); }} options={BIMESTRES_OPTS} placeholder="Selecione" />
          </Field>
          <Field label="Ano letivo">
            <TextInput name="ano_letivo" value={c.ano_letivo ?? "2026"} onChange={(v) => set("ano_letivo", v)} placeholder="2026" />
          </Field>
        </div>
        {loadingAulas && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            Carregando dados do currículo…
          </div>
        )}
      </Section>

      <Section title="Conteúdo Curricular">
        <Field label="Tema / Título do Guia">
          <TextInput name="tema" value={c.tema ?? ""} onChange={(v) => set("tema", v)} placeholder="Ex: Funções Afim e Quadrática" />
        </Field>
        <Field label="Competências gerais (BNCC)">
          <TextArea name="competencias" value={c.competencias ?? ""} onChange={(v) => set("competencias", v)} placeholder="Competências gerais que serão desenvolvidas..." rows={3} />
        </Field>
        <Field label="Habilidades específicas" hint="Preenchido automaticamente ao selecionar turma, disciplina e bimestre">
          <TextArea name="habilidades" value={c.habilidades ?? ""} onChange={(v) => set("habilidades", v)} placeholder="(EF09MA06) Compreender funções como relações de dependência..." rows={4} />
        </Field>
        <Field label="Conteúdos programáticos" hint="Preenchido automaticamente">
          <TextArea name="conteudos" value={c.conteudos ?? ""} onChange={(v) => set("conteudos", v)} placeholder="Liste os conteúdos a serem trabalhados no bimestre" rows={4} />
        </Field>
      </Section>

      <Section title="Metodologia e Avaliação">
        <Field label="Estratégias didáticas" hint="Passe o mouse para ver detalhes, clique para selecionar">
          <div className="flex flex-wrap gap-2">
            {DESENVOLVIMENTO_OPTS.map((m) => (
              <TecnicaBadge key={m.id} item={m} selected={estrategiaId === m.id}
                onSelect={(id) => { setEstrategiaId(id); const f = DESENVOLVIMENTO_OPTS.find((x) => x.id === id); if (f) set("estrategias", `${f.nome} — ${f.descritor}`); }} />
            ))}
          </div>
          {estrategiaId !== null && (
            <>
              <TecnicaDetailPanel item={DESENVOLVIMENTO_OPTS.find((x) => x.id === estrategiaId)!} />
              <TextArea name="estrategias" value={c.estrategias ?? ""} onChange={(v) => set("estrategias", v)} placeholder="Descreva como aplicará esta estratégia no bimestre…" rows={3} />
            </>
          )}
        </Field>
        <Field label="Recursos e materiais">
          <CheckboxList options={RECURSOS_OPTS} value={c.recursos ?? ""} onChange={(v) => set("recursos", v)} />
        </Field>
        <Field label="Avaliação bimestral">
          <CheckboxList options={AVALIACAO_OPTS} value={c.avaliacao ?? ""} onChange={(v) => set("avaliacao", v)} />
        </Field>
        <Field label="Referências">
          <TextArea name="referencias" value={c.referencias ?? ""} onChange={(v) => set("referencias", v)} placeholder="Livros, sites, materiais de apoio utilizados" rows={2} />
        </Field>
      </Section>
    </>
  );
}

function PeiForm({
  c,
  set,
  classes,
  students,
}: {
  c: Record<string, string>;
  set: (k: string, v: string) => void;
  classes: Props["classes"];
  students: Props["students"];
}) {
  return (
    <>
      <Section title="Identificação do Aluno">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Aluno">
            <SelectInput
              name="aluno"
              value={c.aluno ?? ""}
              onChange={(v) => {
                set("aluno", v);
                const s = students.find((st) => st.name === v);
                if (s) { set("ra_aluno", s.ra); set("turma_aluno", s.className); }
              }}
              options={students.map((s) => ({ value: s.name, label: `${s.name} (${s.className})` }))}
              placeholder="Selecione o aluno"
            />
          </Field>
          <Field label="RA">
            <TextInput name="ra_aluno" value={c.ra_aluno ?? ""} onChange={(v) => set("ra_aluno", v)} placeholder="Número do RA" />
          </Field>
          <Field label="Turma">
            <SelectInput name="turma" value={c.turma ?? ""} onChange={(v) => set("turma", v)} options={classes.map((cl) => ({ value: cl.name, label: cl.name }))} placeholder="Selecione" />
          </Field>
          <Field label="Bimestre">
            <SelectInput name="bimestre" value={c.bimestre ?? ""} onChange={(v) => set("bimestre", v)} options={BIMESTRES_OPTS} placeholder="Selecione" />
          </Field>
        </div>
        <Field label="Data de elaboração">
          <DatePicker value={c.data_elaboracao ?? ""} onChange={(v) => set("data_elaboracao", v)} />
        </Field>
      </Section>

      <Section title="Diagnóstico e Necessidades">
        <Field label="Diagnóstico funcional / CID" hint="Informe o diagnóstico e/ou laudo se houver">
          <TextArea name="diagnostico" value={c.diagnostico ?? ""} onChange={(v) => set("diagnostico", v)} placeholder="Ex: TEA (CID F84.0) — Laudo de 15/03/2024..." rows={3} />
        </Field>
        <Field label="Áreas de apoio necessárias">
          <TextArea name="areas_apoio" value={c.areas_apoio ?? ""} onChange={(v) => set("areas_apoio", v)} placeholder="Comunicação, motricidade, cognição, comportamento..." rows={3} />
        </Field>
      </Section>

      <Section title="Plano de Ação">
        <Field label="Objetivos específicos">
          <TextArea name="objetivos" value={c.objetivos ?? ""} onChange={(v) => set("objetivos", v)} placeholder="O que este aluno deve alcançar neste bimestre?" rows={4} />
        </Field>
        <Field label="Estratégias e recursos pedagógicos">
          <TextArea name="estrategias" value={c.estrategias ?? ""} onChange={(v) => set("estrategias", v)} placeholder="Adaptações curriculares, recursos de comunicação alternativa, tecnologias assistivas..." rows={4} />
        </Field>
        <Field label="Avaliação do processo">
          <TextArea name="avaliacao" value={c.avaliacao ?? ""} onChange={(v) => set("avaliacao", v)} placeholder="Como será monitorado o progresso do aluno?" rows={3} />
        </Field>
      </Section>

      <Section title="Família e Profissionais">
        <Field label="Responsáveis / Família">
          <TextInput name="responsaveis" value={c.responsaveis ?? ""} onChange={(v) => set("responsaveis", v)} placeholder="Nome dos responsáveis" />
        </Field>
        <Field label="Profissionais envolvidos">
          <TextArea name="profissionais" value={c.profissionais ?? ""} onChange={(v) => set("profissionais", v)} placeholder="Psicólogo, fonoaudiólogo, terapeuta ocupacional..." rows={2} />
        </Field>
        <Field label="Data da próxima revisão">
          <DatePicker value={c.proxima_revisao ?? ""} onChange={(v) => set("proxima_revisao", v)} />
        </Field>
      </Section>
    </>
  );
}

function PlanoEletivaForm({
  c,
  set,
  classes,
}: {
  c: Record<string, string>;
  set: (k: string, v: string) => void;
  classes: Props["classes"];
}) {
  const [metodologiaId, setMetodologiaId] = useState<number | null>(null);
  const selectedTurmas = c.turmas ? c.turmas.split(", ").filter(Boolean) : [];

  function toggleTurma(name: string) {
    const next = selectedTurmas.includes(name) ? selectedTurmas.filter((x) => x !== name) : [...selectedTurmas, name];
    set("turmas", next.join(", "));
  }

  return (
    <>
      <Section title="Identificação">
        <Field label="Nome da Eletiva">
          <TextInput name="nome_eletiva" value={c.nome_eletiva ?? ""} onChange={(v) => set("nome_eletiva", v)} placeholder="Ex: Programação Criativa" />
        </Field>
        <Field label="Turma(s) atendida(s)" hint="Selecione uma ou mais turmas">
          <div className="flex flex-wrap gap-2">
            {classes.map((cl) => {
              const sel = selectedTurmas.includes(cl.name);
              return (
                <button key={cl.id} type="button" onClick={() => toggleTurma(cl.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${sel ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30" : "bg-background border-border/50 text-foreground hover:border-primary/60 hover:bg-primary/5"}`}>
                  {cl.name}
                </button>
              );
            })}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Semestre">
            <SelectInput name="semestre" value={c.semestre ?? ""} onChange={(v) => set("semestre", v)} options={[{ value: "1º Semestre", label: "1º Semestre" }, { value: "2º Semestre", label: "2º Semestre" }]} placeholder="Selecione" />
          </Field>
          <Field label="Carga horária semanal">
            <TextInput name="carga_horaria" value={c.carga_horaria ?? ""} onChange={(v) => set("carga_horaria", v)} placeholder="Ex: 2 aulas / semana" />
          </Field>
        </div>
      </Section>

      <Section title="Proposta Pedagógica">
        <Field label="Justificativa">
          <TextArea name="justificativa" value={c.justificativa ?? ""} onChange={(v) => set("justificativa", v)} placeholder="Por que esta eletiva é relevante para os alunos?" rows={4} />
        </Field>
        <Field label="Objetivos">
          <TextArea name="objetivos" value={c.objetivos ?? ""} onChange={(v) => set("objetivos", v)} placeholder="O que os alunos vão desenvolver nesta eletiva?" rows={3} />
        </Field>
        <Field label="Conteúdo programático" hint="Organize por aulas, semanas ou blocos temáticos">
          <TextArea name="conteudo" value={c.conteudo ?? ""} onChange={(v) => set("conteudo", v)} placeholder="Aula 1: Introdução ao tema&#10;Aula 2: ..." rows={8} />
        </Field>
      </Section>

      <Section title="Metodologia e Avaliação">
        <Field label="Metodologia" hint="Passe o mouse para ver detalhes, clique para selecionar">
          <div className="flex flex-wrap gap-2">
            {DESENVOLVIMENTO_OPTS.map((m) => (
              <TecnicaBadge key={m.id} item={m} selected={metodologiaId === m.id}
                onSelect={(id) => { setMetodologiaId(id); const f = DESENVOLVIMENTO_OPTS.find((x) => x.id === id); if (f) set("metodologia", `${f.nome} — ${f.descritor}`); }} />
            ))}
          </div>
          {metodologiaId !== null && (
            <>
              <TecnicaDetailPanel item={DESENVOLVIMENTO_OPTS.find((x) => x.id === metodologiaId)!} />
              <TextArea name="metodologia" value={c.metodologia ?? ""} onChange={(v) => set("metodologia", v)} placeholder="Descreva como aplicará esta metodologia…" rows={3} />
            </>
          )}
        </Field>
        <Field label="Avaliação">
          <CheckboxList options={AVALIACAO_OPTS} value={c.avaliacao ?? ""} onChange={(v) => set("avaliacao", v)} />
        </Field>
        <Field label="Materiais e recursos">
          <CheckboxList options={RECURSOS_OPTS} value={c.materiais ?? ""} onChange={(v) => set("materiais", v)} />
        </Field>
      </Section>
    </>
  );
}

function PlanoEmaForm({
  c,
  set,
  classes,
}: {
  c: Record<string, string>;
  set: (k: string, v: string) => void;
  classes: Props["classes"];
}) {
  const [metodologiaId, setMetodologiaId] = useState<number | null>(null);
  const selectedTurmas = c.turmas ? c.turmas.split(", ").filter(Boolean) : [];

  function toggleTurma(name: string) {
    const next = selectedTurmas.includes(name) ? selectedTurmas.filter((x) => x !== name) : [...selectedTurmas, name];
    set("turmas", next.join(", "));
  }

  return (
    <>
      <Section title="Identificação">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Modalidade">
            <SelectInput name="modalidade" value={c.modalidade ?? ""} onChange={(v) => set("modalidade", v)} options={[{ value: "Esporte", label: "Esporte" }, { value: "Música", label: "Música" }, { value: "Arte", label: "Arte" }]} placeholder="Selecione" />
          </Field>
          <Field label="Bimestre">
            <SelectInput name="bimestre" value={c.bimestre ?? ""} onChange={(v) => set("bimestre", v)} options={BIMESTRES_OPTS} placeholder="Selecione" />
          </Field>
          <Field label="Carga horária semanal">
            <TextInput name="carga_horaria" value={c.carga_horaria ?? ""} onChange={(v) => set("carga_horaria", v)} placeholder="Ex: 2 aulas / semana" />
          </Field>
        </div>
        <Field label="Turmas atendidas" hint="Selecione uma ou mais turmas">
          <div className="flex flex-wrap gap-2">
            {classes.map((cl) => {
              const sel = selectedTurmas.includes(cl.name);
              return (
                <button key={cl.id} type="button" onClick={() => toggleTurma(cl.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${sel ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30" : "bg-background border-border/50 text-foreground hover:border-primary/60 hover:bg-primary/5"}`}>
                  {cl.name}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Tema / Projeto do bimestre">
          <TextInput name="tema" value={c.tema ?? ""} onChange={(v) => set("tema", v)} placeholder="Ex: Atletismo Paraolímpico / Canto Coral / Grafite Urbano" />
        </Field>
      </Section>

      <Section title="Planejamento">
        <Field label="Objetivos">
          <TextArea name="objetivos" value={c.objetivos ?? ""} onChange={(v) => set("objetivos", v)} placeholder="O que os alunos vão aprender e desenvolver?" rows={3} />
        </Field>
        <Field label="Conteúdos">
          <TextArea name="conteudos" value={c.conteudos ?? ""} onChange={(v) => set("conteudos", v)} placeholder="Quais conteúdos específicos serão trabalhados?" rows={4} />
        </Field>
        <Field label="Metodologia" hint="Passe o mouse para ver detalhes, clique para selecionar">
          <div className="flex flex-wrap gap-2">
            {DESENVOLVIMENTO_OPTS.map((m) => (
              <TecnicaBadge key={m.id} item={m} selected={metodologiaId === m.id}
                onSelect={(id) => { setMetodologiaId(id); const f = DESENVOLVIMENTO_OPTS.find((x) => x.id === id); if (f) set("metodologia", `${f.nome} — ${f.descritor}`); }} />
            ))}
          </div>
          {metodologiaId !== null && (
            <>
              <TecnicaDetailPanel item={DESENVOLVIMENTO_OPTS.find((x) => x.id === metodologiaId)!} />
              <TextArea name="metodologia" value={c.metodologia ?? ""} onChange={(v) => set("metodologia", v)} placeholder="Descreva como aplicará esta metodologia…" rows={3} />
            </>
          )}
        </Field>
        <Field label="Avaliação">
          <CheckboxList options={AVALIACAO_OPTS} value={c.avaliacao ?? ""} onChange={(v) => set("avaliacao", v)} />
        </Field>
        <Field label="Materiais e equipamentos">
          <CheckboxList options={RECURSOS_OPTS} value={c.materiais ?? ""} onChange={(v) => set("materiais", v)} />
        </Field>
      </Section>
    </>
  );
}

function ProjetoForm({
  c,
  set,
  classes,
}: {
  c: Record<string, string>;
  set: (k: string, v: string) => void;
  classes: Props["classes"];
}) {
  const selectedTurmas = c.turmas ? c.turmas.split(", ").filter(Boolean) : [];

  function toggleTurma(name: string) {
    const next = selectedTurmas.includes(name) ? selectedTurmas.filter((x) => x !== name) : [...selectedTurmas, name];
    set("turmas", next.join(", "));
  }

  return (
    <>
      <Section title="Identificação do Projeto">
        <Field label="Título do projeto">
          <TextInput name="titulo" value={c.titulo ?? ""} onChange={(v) => set("titulo", v)} placeholder="Ex: Projeto Água: Fonte de Vida" />
        </Field>
        <Field label="Turmas participantes" hint="Selecione uma ou mais turmas">
          <div className="flex flex-wrap gap-2">
            {classes.map((cl) => {
              const sel = selectedTurmas.includes(cl.name);
              return (
                <button key={cl.id} type="button" onClick={() => toggleTurma(cl.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${sel ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30" : "bg-background border-border/50 text-foreground hover:border-primary/60 hover:bg-primary/5"}`}>
                  {cl.name}
                </button>
              );
            })}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Período de realização">
            <TextInput name="periodo" value={c.periodo ?? ""} onChange={(v) => set("periodo", v)} placeholder="Ex: Março a Junho de 2025" />
          </Field>
          <Field label="Disciplinas envolvidas">
            <TextInput name="disciplinas" value={c.disciplinas ?? ""} onChange={(v) => set("disciplinas", v)} placeholder="Ex: Ciências, Português, Matemática" />
          </Field>
        </div>
      </Section>

      <Section title="Proposta">
        <Field label="Justificativa">
          <TextArea name="justificativa" value={c.justificativa ?? ""} onChange={(v) => set("justificativa", v)} placeholder="Por que este projeto é relevante? Qual problema ou tema ele aborda?" rows={4} />
        </Field>
        <Field label="Objetivos gerais">
          <TextArea name="objetivos_gerais" value={c.objetivos_gerais ?? ""} onChange={(v) => set("objetivos_gerais", v)} placeholder="O que o projeto pretende alcançar de forma ampla?" rows={3} />
        </Field>
        <Field label="Objetivos específicos">
          <TextArea name="objetivos_especificos" value={c.objetivos_especificos ?? ""} onChange={(v) => set("objetivos_especificos", v)} placeholder="Metas concretas e mensuráveis do projeto" rows={3} />
        </Field>
      </Section>

      <Section title="Desenvolvimento e Avaliação">
        <Field label="Etapas de desenvolvimento" hint="Descreva cronologicamente as atividades">
          <TextArea name="etapas" value={c.etapas ?? ""} onChange={(v) => set("etapas", v)} placeholder="Etapa 1 (Mês/Semana): ...&#10;Etapa 2: ...&#10;Etapa 3: ..." rows={6} />
        </Field>
        <Field label="Produto final esperado">
          <TextArea name="produto_final" value={c.produto_final ?? ""} onChange={(v) => set("produto_final", v)} placeholder="O que será produzido/entregue? (Cartaz, vídeo, exposição, relatório...)" rows={2} />
        </Field>
        <Field label="Avaliação">
          <CheckboxList options={AVALIACAO_OPTS} value={c.avaliacao ?? ""} onChange={(v) => set("avaliacao", v)} />
        </Field>
        <Field label="Apresentação / Culminância">
          <TextArea name="apresentacao" value={c.apresentacao ?? ""} onChange={(v) => set("apresentacao", v)} placeholder="Como e quando o projeto será apresentado à comunidade?" rows={2} />
        </Field>
      </Section>
    </>
  );
}

function PdiForm({
  c,
  set,
}: {
  c: Record<string, string>;
  set: (k: string, v: string) => void;
}) {
  const ANO_LETIVO = new Date().getFullYear().toString();
  return (
    <>
      <Section title="Identificação">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Período de referência">
            <TextInput name="periodo" value={c.periodo ?? ""} onChange={(v) => set("periodo", v)} placeholder={`Ex: 1º Semestre ${ANO_LETIVO}`} />
          </Field>
          <Field label="Data de elaboração">
            <DatePicker value={c.data_elaboracao ?? ""} onChange={(v) => set("data_elaboracao", v)} />
          </Field>
        </div>
      </Section>

      <Section title="Autoavaliação">
        <Field label="Avaliação das competências profissionais" hint="Reflita sobre seus pontos fortes e aspectos a desenvolver">
          <TextArea name="autoavaliacao" value={c.autoavaliacao ?? ""} onChange={(v) => set("autoavaliacao", v)} placeholder="Pontos fortes:&#10;- ...&#10;&#10;Aspectos a melhorar:&#10;- ..." rows={5} />
        </Field>
        <Field label="Principais desafios enfrentados">
          <TextArea name="desafios" value={c.desafios ?? ""} onChange={(v) => set("desafios", v)} placeholder="Dificuldades encontradas no trabalho docente durante o período" rows={3} />
        </Field>
      </Section>

      <Section title="Metas e Desenvolvimento">
        <Field label="Metas profissionais para o próximo período">
          <TextArea name="metas" value={c.metas ?? ""} onChange={(v) => set("metas", v)} placeholder="Meta 1: ...&#10;Meta 2: ...&#10;Meta 3: ..." rows={4} />
        </Field>
        <Field label="Formações realizadas / desejadas">
          <TextArea name="formacoes" value={c.formacoes ?? ""} onChange={(v) => set("formacoes", v)} placeholder="Cursos, formações continuadas, leituras realizadas ou planejadas" rows={3} />
        </Field>
        <Field label="Estratégias para alcançar as metas">
          <TextArea name="estrategias" value={c.estrategias ?? ""} onChange={(v) => set("estrategias", v)} placeholder="Que ações concretas vou adotar?" rows={3} />
        </Field>
        <Field label="Indicadores de sucesso">
          <TextArea name="indicadores" value={c.indicadores ?? ""} onChange={(v) => set("indicadores", v)} placeholder="Como vou saber que alcancei minhas metas?" rows={3} />
        </Field>
      </Section>
    </>
  );
}

// ─── Main editor component ────────────────────────────────────────────────────

export function DocumentoEditor({ doc, userName, classes, disciplines, students }: Props) {
  const [content, setContent] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(doc.content).map(([k, v]) => [k, String(v ?? "")]))
  );
  const [pdfPath, setPdfPath] = useState<string | null>(doc.pdfPath);
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);

  function set(key: string, value: string) {
    setContent((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveDocument(doc.id, content);
      if (result?.ok) toast.success("Rascunho salvo!");
      else toast.error("Erro ao salvar.");
    });
  }

  async function handleGeneratePdf() {
    setIsGenerating(true);
    try {
      // Save first
      await saveDocument(doc.id, content);

      const res = await fetch(`/api/documentos/${doc.id}/pdf`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao gerar PDF");
      }
      const { pdfPath: newPath } = await res.json();
      setPdfPath(newPath);
      toast.success("PDF gerado com sucesso!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar PDF");
    } finally {
      setIsGenerating(false);
    }
  }

  const formProps = { c: content, set, classes, disciplines, students };

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 space-y-8">
        {doc.type === "plano_de_aula" && <PlanoDeAulaForm {...formProps} />}
        {doc.type === "guia_de_aprendizagem" && <GuiaAprendizagemForm {...formProps} />}
        {doc.type === "pei" && <PeiForm {...formProps} />}
        {doc.type === "plano_de_eletiva" && <PlanoEletivaForm {...formProps} />}
        {doc.type === "plano_ema" && <PlanoEmaForm {...formProps} />}
        {doc.type === "projeto" && <ProjetoForm {...formProps} />}
        {doc.type === "pdi" && <PdiForm {...formProps} />}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSave}
          disabled={isPending || isGenerating}
          className="flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-bold px-6 py-3 rounded-2xl transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          Salvar rascunho
        </button>

        <button
          onClick={handleGeneratePdf}
          disabled={isPending || isGenerating}
          className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-bold px-6 py-3 rounded-2xl transition-colors disabled:opacity-50"
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {isGenerating ? "Gerando PDF..." : "Gerar PDF"}
        </button>

        {pdfPath && (
          <a
            href={`/api/documentos/${doc.id}/pdf/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3 rounded-2xl transition-colors"
          >
            <Download size={16} />
            Baixar PDF
          </a>
        )}
      </div>

      {pdfPath && (
        <p className="text-xs text-muted-foreground">
          Documento finalizado. Gere novamente para atualizar com os dados mais recentes.
        </p>
      )}
    </div>
  );
}
