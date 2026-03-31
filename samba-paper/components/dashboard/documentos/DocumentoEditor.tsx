"use client";

import { useState, useTransition } from "react";
import { saveDocument } from "@/lib/actions";
import { toast } from "sonner";
import { Save, FileDown, Loader2 } from "lucide-react";

interface DocData {
  id: number;
  type: string;
  title: string;
  content: Record<string, string>;
  pdfPath: string | null;
  status: string;
}

interface Props {
  doc: DocData;
  userName: string;
  classes: { id: number; name: string; grade: string; section: string }[];
  disciplines: { id: number; name: string; type: string }[];
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
  const BIMESTRES = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"];

  return (
    <>
      <Section title="Identificação">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Turma">
            <SelectInput
              name="turma"
              value={c.turma ?? ""}
              onChange={(v) => set("turma", v)}
              options={classes.map((cl) => ({ value: cl.name, label: cl.name }))}
              placeholder="Selecione a turma"
            />
          </Field>
          <Field label="Disciplina">
            <SelectInput
              name="disciplina"
              value={c.disciplina ?? ""}
              onChange={(v) => set("disciplina", v)}
              options={disciplines.map((d) => ({ value: d.name, label: d.name }))}
              placeholder="Selecione a disciplina"
            />
          </Field>
          <Field label="Bimestre">
            <SelectInput
              name="bimestre"
              value={c.bimestre ?? ""}
              onChange={(v) => set("bimestre", v)}
              options={BIMESTRES.map((b) => ({ value: b, label: b }))}
              placeholder="Selecione o bimestre"
            />
          </Field>
          <Field label="Data">
            <TextInput name="data" value={c.data ?? ""} onChange={(v) => set("data", v)} placeholder="dd/mm/aaaa" />
          </Field>
        </div>
        <Field label="Tema / Título da aula">
          <TextInput name="tema" value={c.tema ?? ""} onChange={(v) => set("tema", v)} placeholder="Ex: Funções do 1º Grau" />
        </Field>
      </Section>

      <Section title="Objetivos e Habilidades">
        <Field label="Objetivo geral">
          <TextArea name="objetivo_geral" value={c.objetivo_geral ?? ""} onChange={(v) => set("objetivo_geral", v)} placeholder="O que o aluno deverá ser capaz de fazer ao final da aula?" rows={3} />
        </Field>
        <Field label="Habilidades BNCC / Currículo Paulista" hint="Informe os códigos e descrições (ex: EF09MA06)">
          <TextArea name="habilidades" value={c.habilidades ?? ""} onChange={(v) => set("habilidades", v)} placeholder="(EF09MA06) Compreender as funções como relações de dependência..." rows={4} />
        </Field>
      </Section>

      <Section title="Desenvolvimento da Aula">
        <Field label="Momento inicial (Motivação / Diagnóstico)" hint="Aproximadamente 10–15 min">
          <TextArea name="desenvolvimento_inicial" value={c.desenvolvimento_inicial ?? ""} onChange={(v) => set("desenvolvimento_inicial", v)} placeholder="Como a aula será iniciada? Qual estratégia de engajamento?" rows={4} />
        </Field>
        <Field label="Desenvolvimento" hint="Atividade principal — Aproximadamente 25–30 min">
          <TextArea name="desenvolvimento_principal" value={c.desenvolvimento_principal ?? ""} onChange={(v) => set("desenvolvimento_principal", v)} placeholder="Descrição detalhada das atividades de ensino e aprendizagem" rows={6} />
        </Field>
        <Field label="Fechamento / Sistematização" hint="Aproximadamente 10 min">
          <TextArea name="desenvolvimento_fechamento" value={c.desenvolvimento_fechamento ?? ""} onChange={(v) => set("desenvolvimento_fechamento", v)} placeholder="Como a aula será encerrada? Síntese dos conteúdos?" rows={3} />
        </Field>
      </Section>

      <Section title="Recursos e Avaliação">
        <Field label="Recursos e materiais">
          <TextArea name="recursos_materiais" value={c.recursos_materiais ?? ""} onChange={(v) => set("recursos_materiais", v)} placeholder="Livro didático, quadro, projetor, materiais manipuláveis..." rows={2} />
        </Field>
        <Field label="Avaliação">
          <TextArea name="avaliacao" value={c.avaliacao ?? ""} onChange={(v) => set("avaliacao", v)} placeholder="Como será avaliada a aprendizagem? (Observação, exercícios, participação...)" rows={3} />
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
  const BIMESTRES = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"];
  return (
    <>
      <Section title="Identificação">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Turma">
            <SelectInput name="turma" value={c.turma ?? ""} onChange={(v) => set("turma", v)} options={classes.map((cl) => ({ value: cl.name, label: cl.name }))} placeholder="Selecione a turma" />
          </Field>
          <Field label="Disciplina">
            <SelectInput name="disciplina" value={c.disciplina ?? ""} onChange={(v) => set("disciplina", v)} options={disciplines.map((d) => ({ value: d.name, label: d.name }))} placeholder="Selecione a disciplina" />
          </Field>
          <Field label="Bimestre">
            <SelectInput name="bimestre" value={c.bimestre ?? ""} onChange={(v) => set("bimestre", v)} options={BIMESTRES.map((b) => ({ value: b, label: b }))} placeholder="Selecione" />
          </Field>
          <Field label="Ano letivo">
            <TextInput name="ano_letivo" value={c.ano_letivo ?? ""} onChange={(v) => set("ano_letivo", v)} placeholder="2025" />
          </Field>
        </div>
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
  const BIMESTRES = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"];
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
            <SelectInput name="bimestre" value={c.bimestre ?? ""} onChange={(v) => set("bimestre", v)} options={BIMESTRES.map((b) => ({ value: b, label: b }))} placeholder="Selecione" />
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
  const BIMESTRES = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"];
  return (
    <>
      <Section title="Identificação">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Modalidade">
            <SelectInput name="modalidade" value={c.modalidade ?? ""} onChange={(v) => set("modalidade", v)} options={[{ value: "Esporte", label: "Esporte" }, { value: "Música", label: "Música" }, { value: "Arte", label: "Arte" }]} placeholder="Selecione" />
          </Field>
          <Field label="Bimestre">
            <SelectInput name="bimestre" value={c.bimestre ?? ""} onChange={(v) => set("bimestre", v)} options={BIMESTRES.map((b) => ({ value: b, label: b }))} placeholder="Selecione" />
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
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar rascunho
        </button>

        <button
          onClick={handleGeneratePdf}
          disabled={isPending || isGenerating}
          className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-bold px-6 py-3 rounded-2xl transition-colors disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {isGenerating ? "Gerando PDF..." : "Gerar PDF"}
        </button>

        {pdfPath && (
          <a
            href={`/api/documentos/${doc.id}/pdf/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3 rounded-2xl transition-colors"
          >
            <FileDown className="w-4 h-4" />
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
