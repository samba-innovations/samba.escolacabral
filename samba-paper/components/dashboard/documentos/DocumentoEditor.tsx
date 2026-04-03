"use client";

import { useState, useTransition, Fragment } from "react";
import { saveDocument, getAulasCurriculo, getSkillsByCodigos } from "@/lib/actions";
import { toast } from "sonner";
import { Loader2, Upload, Download, Check, ChevronDown } from "lucide-react";

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

// ─── MomentoInicialCard ───────────────────────────────────────────────────────

function MomentoInicialCard({
  item,
  selected,
  onSelect,
}: {
  item: typeof MOMENTOS_INICIAIS[number];
  selected: boolean;
  onSelect: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`border rounded-xl transition-all ${
      selected ? "border-primary bg-primary/5" : "border-border/50 bg-background"
    }`}>
      <div className="flex items-start gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            selected ? "bg-primary border-primary" : "border-border/60 hover:border-primary/60"
          }`}
        >
          {selected && <Check size={11} className="text-primary-foreground" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 cursor-pointer" onClick={() => onSelect(item.id)}>
              <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                {item.id.toString().padStart(2, "0")}
              </span>
              <p className="text-sm font-bold text-foreground mt-0.5">{item.nome}</p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all shrink-0"
            >
              <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>
          {expanded && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{item.descritor}</p>
          )}
        </div>
      </div>
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

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  const labels = ["Período", "Aulas", "Formulário"];
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <Fragment key={n}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                done   ? "bg-primary border-primary text-primary-foreground" :
                active ? "bg-primary/10 border-primary text-primary" :
                         "bg-background border-border/40 text-muted-foreground"
              }`}>
                {done ? <Check size={13} /> : n}
              </div>
              <span className={`text-xs font-bold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {labels[i]}
              </span>
            </div>
            {i < total - 1 && <div className="flex-1 h-px bg-border/40" />}
          </Fragment>
        );
      })}
    </div>
  );
}

// ─── AulaCard ────────────────────────────────────────────────────────────────

function AulaCard({
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
  const [expanded, setExpanded] = useState(false);
  const habs = parseBulletList(aula.habilidadeTexto).concat(parseCodeList(aula.habilidadeCodigo));
  const cont = parseBulletList(aula.conteudo);

  return (
    <div className={`border rounded-xl transition-all ${
      selected ? "border-primary bg-primary/5" : "border-border/50 bg-background"
    }`}>
      <div className="flex items-start gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => onToggle(aula.id)}
          className={`mt-0.5 shrink-0 w-5 h-5 ${multiSelect ? "rounded" : "rounded-full"} border-2 flex items-center justify-center transition-all ${
            selected ? "bg-primary border-primary" : "border-border/60 hover:border-primary/60"
          }`}
        >
          {selected && <Check size={11} className="text-primary-foreground" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 cursor-pointer" onClick={() => onToggle(aula.id)}>
              <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                Aula {aula.aulaNum}
              </span>
              <p className="text-sm font-bold text-foreground mt-0.5">{aula.titulo}</p>
              {aula.unidadeTematica && !expanded && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{aula.unidadeTematica}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all shrink-0"
            >
              <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-3 space-y-3 border-t border-border/30 ml-8">
          {aula.unidadeTematica && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Unidade Temática</p>
              <p className="text-xs text-foreground">{aula.unidadeTematica}</p>
            </div>
          )}
          {habs.length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Habilidades BNCC</p>
              <div className="space-y-1">
                {habs.slice(0, 5).map((h, i) => (
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
              <div className="space-y-1">
                {cont.slice(0, 5).map((ct, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span className="text-xs text-foreground leading-relaxed">{ct}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {aula.objetivos && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Objetivos</p>
              <p className="text-xs text-foreground line-clamp-3">{aula.objetivos}</p>
            </div>
          )}
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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [habilidadeOpcoes, setHabilidadeOpcoes] = useState<string[]>([]);
  const [conteudoOpcoes, setConteudoOpcoes] = useState<string[]>([]);
  const [momentoId, setMomentoId] = useState<number | null>(null);

  const periodo = c.periodo ?? "por_aula";
  const multiSelect = periodo !== "por_aula";
  const selectedClass = classes.find((cl) => cl.name === c.turma);

  async function loadAulas(turmaName: string, disciplina: string, bimStr: string) {
    const cl = classes.find((x) => x.name === turmaName);
    if (!cl || !disciplina || !bimStr) { setAulas([]); return; }
    const disc = disciplines.find((d) => d.name === disciplina);
    const disciplinaNome = disc?.aulasNome ?? disciplina;
    setLoadingAulas(true);
    try {
      const rows = await getAulasCurriculo(cl.ciclo, cl.serie, disciplinaNome, Number(bimStr));
      setAulas(rows);
    } finally {
      setLoadingAulas(false);
    }
  }

  function toggleAula(id: number) {
    if (!multiSelect) {
      setSelectedIds([id]);
    } else {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
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
      <>
        <StepIndicator step={1} total={3} />
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

        <Section title="Identificação">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Turma">
              <SelectInput
                name="turma"
                value={c.turma ?? ""}
                onChange={(v) => { set("turma", v); loadAulas(v, c.disciplina ?? "", c.bimestre ?? ""); }}
                options={classes.map((cl) => ({ value: cl.name, label: cl.name }))}
                placeholder="Selecione a turma"
              />
            </Field>
            <Field label="Disciplina">
              <SelectInput
                name="disciplina"
                value={c.disciplina ?? ""}
                onChange={(v) => { set("disciplina", v); loadAulas(c.turma ?? "", v, c.bimestre ?? ""); }}
                options={disciplines.map((d) => ({ value: d.name, label: d.name }))}
                placeholder="Selecione a disciplina"
              />
            </Field>
            <Field label="Bimestre">
              <SelectInput
                name="bimestre"
                value={c.bimestre ?? ""}
                onChange={(v) => { set("bimestre", v); loadAulas(c.turma ?? "", c.disciplina ?? "", v); }}
                options={BIMESTRES_OPTS}
                placeholder="Selecione o bimestre"
              />
            </Field>
            <Field label="Data">
              <TextInput name="data" value={c.data ?? ""} onChange={(v) => set("data", v)} placeholder="dd/mm/aaaa" />
            </Field>
          </div>
        </Section>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={!c.turma || !c.disciplina || !c.bimestre}
            onClick={() => setStep(2)}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            Próximo →
          </button>
        </div>
      </>
    );
  }

  // ── Step 2: Seleção de aulas ──────────────────────────────────────────────────
  if (step === 2) {
    return (
      <>
        <StepIndicator step={2} total={3} />
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-foreground">
              {selectedClass ? `${selectedClass.grade} · ${c.disciplina}` : c.disciplina}
            </p>
            <p className="text-xs text-muted-foreground">
              {BIMESTRES_OPTS.find((b) => b.value === c.bimestre)?.label}
              {" · "}
              {PERIODO_OPTS.find((p) => p.value === periodo)?.label}
              {multiSelect && " — selecione múltiplas aulas"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Alterar
          </button>
        </div>

        {loadingAulas ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 size={16} className="animate-spin" />
            Carregando aulas...
          </div>
        ) : aulas.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhuma aula encontrada para essa seleção.
          </p>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {aulas.map((a) => (
              <AulaCard
                key={a.id}
                aula={a}
                selected={selectedIds.includes(a.id)}
                multiSelect={multiSelect}
                onToggle={toggleAula}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border/40 hover:border-border transition-colors"
          >
            ← Voltar
          </button>
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={applyAulas}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            Preencher formulário →
          </button>
        </div>
      </>
    );
  }

  // ── Step 3: Formulário ────────────────────────────────────────────────────────
  const selectedAulas = aulas.filter((a) => selectedIds.includes(a.id));
  return (
    <>
      <StepIndicator step={3} total={3} />

      {selectedAulas.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-2 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black text-primary uppercase tracking-wider mb-1">
              {selectedAulas.length === 1
                ? `Aula ${selectedAulas[0].aulaNum}`
                : `${selectedAulas.length} aulas selecionadas`}
            </p>
            {selectedAulas.map((a) => (
              <p key={a.id} className="text-xs text-foreground">{a.aulaNum}. {a.titulo}</p>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="text-xs text-primary hover:text-primary/80 font-bold shrink-0 transition-colors"
          >
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
        <Field label="Momento inicial (Motivação / Diagnóstico)" hint="Aproximadamente 10–15 min — selecione uma técnica">
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {MOMENTOS_INICIAIS.map((m) => (
              <MomentoInicialCard
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
            <TextArea
              name="desenvolvimento_inicial"
              value={c.desenvolvimento_inicial ?? ""}
              onChange={(v) => set("desenvolvimento_inicial", v)}
              placeholder="Descreva como a técnica será aplicada nesta aula..."
              rows={3}
            />
          )}
        </Field>
        <Field label="Desenvolvimento" hint="Atividade principal — Aproximadamente 25–30 min">
          <TextArea name="desenvolvimento_principal" value={c.desenvolvimento_principal ?? ""} onChange={(v) => set("desenvolvimento_principal", v)} placeholder="Descrição detalhada das atividades de ensino e aprendizagem" rows={5} />
        </Field>
        <Field label="Fechamento / Sistematização" hint="Aproximadamente 10 min">
          <TextArea name="desenvolvimento_fechamento" value={c.desenvolvimento_fechamento ?? ""} onChange={(v) => set("desenvolvimento_fechamento", v)} placeholder="Como a aula será encerrada? Síntese dos conteúdos?" rows={3} />
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
    </>
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

  async function autoFillBimestre(turmaName: string, disciplina: string, bimStr: string) {
    const cl = classes.find((x) => x.name === turmaName);
    if (!cl || !disciplina || !bimStr) return;
    const disc = disciplines.find((d) => d.name === disciplina);
    const disciplinaNome = disc?.aulasNome ?? disciplina;
    setLoadingAulas(true);
    try {
      const rows = await getAulasCurriculo(cl.ciclo, cl.serie, disciplinaNome, Number(bimStr));
      if (rows.length === 0) return;
      // Aggregate all aulas into the guia fields
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

  return (
    <>
      <Section title="Identificação">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Turma">
            <SelectInput name="turma" value={c.turma ?? ""} onChange={(v) => { set("turma", v); autoFillBimestre(v, c.disciplina ?? "", c.bimestre ?? ""); }} options={classes.map((cl) => ({ value: cl.name, label: cl.name }))} placeholder="Selecione a turma" />
          </Field>
          <Field label="Disciplina">
            <SelectInput name="disciplina" value={c.disciplina ?? ""} onChange={(v) => { set("disciplina", v); autoFillBimestre(c.turma ?? "", v, c.bimestre ?? ""); }} options={disciplines.map((d) => ({ value: d.name, label: d.name }))} placeholder="Selecione a disciplina" />
          </Field>
          <Field label="Bimestre">
            <SelectInput name="bimestre" value={c.bimestre ?? ""} onChange={(v) => { set("bimestre", v); autoFillBimestre(c.turma ?? "", c.disciplina ?? "", v); }} options={BIMESTRES_OPTS} placeholder="Selecione" />
          </Field>
          <Field label="Ano letivo">
            <TextInput name="ano_letivo" value={c.ano_letivo ?? "2026"} onChange={(v) => set("ano_letivo", v)} placeholder="2026" />
          </Field>
        </div>
        {loadingAulas && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            Carregando dados do currículo...
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
        <Field label="Habilidades específicas" hint="Códigos e descrições das habilidades abordadas">
          <TextArea name="habilidades" value={c.habilidades ?? ""} onChange={(v) => set("habilidades", v)} placeholder="(EF09MA06) Compreender funções como relações de dependência..." rows={4} />
        </Field>
        <Field label="Conteúdos programáticos">
          <TextArea name="conteudos" value={c.conteudos ?? ""} onChange={(v) => set("conteudos", v)} placeholder="Liste os conteúdos a serem trabalhados no bimestre" rows={4} />
        </Field>
      </Section>

      <Section title="Metodologia e Avaliação">
        <Field label="Estratégias didáticas">
          <TextArea name="estrategias" value={c.estrategias ?? ""} onChange={(v) => set("estrategias", v)} placeholder="Quais metodologias e estratégias serão utilizadas?" rows={4} />
        </Field>
        <Field label="Recursos e materiais">
          <TextArea name="recursos" value={c.recursos ?? ""} onChange={(v) => set("recursos", v)} placeholder="Livro didático, plataformas digitais, materiais de apoio..." rows={2} />
        </Field>
        <Field label="Avaliação bimestral">
          <TextArea name="avaliacao" value={c.avaliacao ?? ""} onChange={(v) => set("avaliacao", v)} placeholder="Como os alunos serão avaliados? (Provas, trabalhos, participação...)" rows={3} />
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
          <TextInput name="data_elaboracao" value={c.data_elaboracao ?? ""} onChange={(v) => set("data_elaboracao", v)} placeholder="dd/mm/aaaa" />
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
          <TextInput name="proxima_revisao" value={c.proxima_revisao ?? ""} onChange={(v) => set("proxima_revisao", v)} placeholder="dd/mm/aaaa" />
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
  return (
    <>
      <Section title="Identificação">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome da Eletiva">
            <TextInput name="nome_eletiva" value={c.nome_eletiva ?? ""} onChange={(v) => set("nome_eletiva", v)} placeholder="Ex: Programação Criativa" />
          </Field>
          <Field label="Turma(s) atendida(s)">
            <TextInput name="turmas" value={c.turmas ?? ""} onChange={(v) => set("turmas", v)} placeholder="Ex: 1ºA, 1ºB" />
          </Field>
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
        <Field label="Metodologia">
          <TextArea name="metodologia" value={c.metodologia ?? ""} onChange={(v) => set("metodologia", v)} placeholder="Como as aulas serão conduzidas? Quais estratégias?" rows={3} />
        </Field>
        <Field label="Avaliação">
          <TextArea name="avaliacao" value={c.avaliacao ?? ""} onChange={(v) => set("avaliacao", v)} placeholder="Como os alunos serão avaliados?" rows={3} />
        </Field>
        <Field label="Materiais e recursos">
          <TextArea name="materiais" value={c.materiais ?? ""} onChange={(v) => set("materiais", v)} placeholder="Materiais, equipamentos, espaços necessários" rows={2} />
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
          <Field label="Turmas atendidas">
            <TextInput name="turmas" value={c.turmas ?? ""} onChange={(v) => set("turmas", v)} placeholder="Ex: 1ºA, 1ºB, 2ºA" />
          </Field>
          <Field label="Carga horária semanal">
            <TextInput name="carga_horaria" value={c.carga_horaria ?? ""} onChange={(v) => set("carga_horaria", v)} placeholder="Ex: 2 aulas / semana" />
          </Field>
        </div>
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
        <Field label="Metodologia">
          <TextArea name="metodologia" value={c.metodologia ?? ""} onChange={(v) => set("metodologia", v)} placeholder="Como as atividades serão organizadas?" rows={3} />
        </Field>
        <Field label="Avaliação">
          <TextArea name="avaliacao" value={c.avaliacao ?? ""} onChange={(v) => set("avaliacao", v)} placeholder="Como será acompanhado o desenvolvimento dos alunos?" rows={3} />
        </Field>
        <Field label="Materiais e equipamentos">
          <TextArea name="materiais" value={c.materiais ?? ""} onChange={(v) => set("materiais", v)} placeholder="Instrumentos, equipamentos esportivos, materiais artísticos..." rows={2} />
        </Field>
      </Section>
    </>
  );
}

function ProjetoForm({
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
  return (
    <>
      <Section title="Identificação do Projeto">
        <Field label="Título do projeto">
          <TextInput name="titulo" value={c.titulo ?? ""} onChange={(v) => set("titulo", v)} placeholder="Ex: Projeto Água: Fonte de Vida" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Turmas participantes">
            <TextInput name="turmas" value={c.turmas ?? ""} onChange={(v) => set("turmas", v)} placeholder="Ex: 2ºA, 2ºB, 3ºA" />
          </Field>
          <Field label="Período de realização">
            <TextInput name="periodo" value={c.periodo ?? ""} onChange={(v) => set("periodo", v)} placeholder="Ex: Março a Junho de 2025" />
          </Field>
        </div>
        <Field label="Disciplinas envolvidas" hint="Componentes curriculares que participarão do projeto">
          <TextInput name="disciplinas" value={c.disciplinas ?? ""} onChange={(v) => set("disciplinas", v)} placeholder="Ex: Ciências, Português, Matemática" />
        </Field>
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
          <TextArea name="avaliacao" value={c.avaliacao ?? ""} onChange={(v) => set("avaliacao", v)} placeholder="Como o projeto e os alunos serão avaliados?" rows={3} />
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
            <TextInput name="data_elaboracao" value={c.data_elaboracao ?? ""} onChange={(v) => set("data_elaboracao", v)} placeholder="dd/mm/aaaa" />
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
      <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-8">
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
