import PDFDocument from 'pdfkit'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PdfInput {
  type: string
  title: string
  userName: string
  content: Record<string, string>
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const YELLOW = '#FCE31D'
const DARK   = '#0f0714'
const GRAY   = '#7a4a7a'
const BLACK  = '#1a0a1a'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function header(doc: PDFKit.PDFDocument, title: string, docType: string, userName: string) {
  // Header bar
  doc.rect(0, 0, doc.page.width, 60).fill(DARK)
  doc.rect(0, 60, doc.page.width, 4).fill(YELLOW)

  // App name
  doc.font('Helvetica-Bold').fontSize(9).fillColor(YELLOW)
  doc.text('samba paper', 40, 15)

  // Doc type
  doc.font('Helvetica').fontSize(8).fillColor('#a07ab0')
  doc.text(docType.replace(/_/g, ' ').toUpperCase(), 40, 28)

  // Professor
  doc.font('Helvetica').fontSize(8).fillColor('#c0b0c8')
  doc.text(userName, 40, 41)

  // Title
  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').fontSize(16).fillColor(BLACK)
  doc.text(title, 40, 80, { width: doc.page.width - 80 })

  // Divider
  const y = doc.y + 10
  doc.moveTo(40, y).lineTo(doc.page.width - 40, y).strokeColor('#e0c8e8').lineWidth(1).stroke()
  doc.moveDown(1)
}

function sectionTitle(doc: PDFKit.PDFDocument, text: string) {
  doc.moveDown(0.8)
  doc.font('Helvetica-Bold').fontSize(9).fillColor(GRAY)
  doc.text(text.toUpperCase(), { characterSpacing: 1.5 })
  doc.moveTo(40, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).strokeColor('#e0c8e8').lineWidth(0.5).stroke()
  doc.moveDown(0.5)
}

function field(doc: PDFKit.PDFDocument, label: string, value: string) {
  if (!value?.trim()) return
  doc.font('Helvetica-Bold').fontSize(9).fillColor(GRAY)
  doc.text(label)
  doc.font('Helvetica').fontSize(10).fillColor(BLACK)
  doc.text(value, { lineGap: 2 })
  doc.moveDown(0.6)
}

function footer(doc: PDFKit.PDFDocument) {
  const y = doc.page.height - 36
  doc.moveTo(40, y).lineTo(doc.page.width - 40, y).strokeColor('#e0c8e8').lineWidth(0.5).stroke()
  doc.font('Helvetica').fontSize(7).fillColor('#a07ab0')
  const date = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.text(`Gerado em ${date} · EE Prof. Christino Cabral · samba paper`, 40, y + 8, {
    width: doc.page.width - 80,
    align: 'center',
  })
}

// ─── Document renderers ───────────────────────────────────────────────────────

function renderPlanoDeAula(doc: PDFKit.PDFDocument, c: Record<string, string>) {
  sectionTitle(doc, 'Identificação')
  field(doc, 'Turma', c.turma)
  field(doc, 'Disciplina', c.disciplina)
  field(doc, 'Bimestre', c.bimestre)
  field(doc, 'Data', c.data)
  field(doc, 'Tema / Título da Aula', c.tema)

  sectionTitle(doc, 'Objetivos e Habilidades')
  field(doc, 'Objetivo Geral', c.objetivo_geral)
  field(doc, 'Habilidades BNCC / Currículo Paulista', c.habilidades)

  sectionTitle(doc, 'Desenvolvimento da Aula')
  field(doc, 'Momento Inicial', c.desenvolvimento_inicial)
  field(doc, 'Desenvolvimento', c.desenvolvimento_principal)
  field(doc, 'Fechamento / Sistematização', c.desenvolvimento_fechamento)

  sectionTitle(doc, 'Recursos e Avaliação')
  field(doc, 'Recursos e Materiais', c.recursos_materiais)
  field(doc, 'Avaliação', c.avaliacao)
}

function renderGuiaAprendizagem(doc: PDFKit.PDFDocument, c: Record<string, string>) {
  sectionTitle(doc, 'Identificação')
  field(doc, 'Turma', c.turma)
  field(doc, 'Disciplina', c.disciplina)
  field(doc, 'Bimestre', c.bimestre)
  field(doc, 'Ano Letivo', c.ano_letivo)
  field(doc, 'Tema', c.tema)

  sectionTitle(doc, 'Conteúdo Curricular')
  field(doc, 'Competências Gerais (BNCC)', c.competencias)
  field(doc, 'Habilidades Específicas', c.habilidades)
  field(doc, 'Conteúdos Programáticos', c.conteudos)

  sectionTitle(doc, 'Metodologia e Avaliação')
  field(doc, 'Estratégias Didáticas', c.estrategias)
  field(doc, 'Recursos e Materiais', c.recursos)
  field(doc, 'Avaliação Bimestral', c.avaliacao)
  field(doc, 'Referências', c.referencias)
}

function renderPei(doc: PDFKit.PDFDocument, c: Record<string, string>) {
  sectionTitle(doc, 'Identificação do Aluno')
  field(doc, 'Aluno', c.aluno)
  field(doc, 'RA', c.ra_aluno)
  field(doc, 'Turma', c.turma)
  field(doc, 'Bimestre', c.bimestre)
  field(doc, 'Data de Elaboração', c.data_elaboracao)

  sectionTitle(doc, 'Diagnóstico e Necessidades')
  field(doc, 'Diagnóstico Funcional / CID', c.diagnostico)
  field(doc, 'Áreas de Apoio Necessárias', c.areas_apoio)

  sectionTitle(doc, 'Plano de Ação')
  field(doc, 'Objetivos Específicos', c.objetivos)
  field(doc, 'Estratégias e Recursos Pedagógicos', c.estrategias)
  field(doc, 'Avaliação do Processo', c.avaliacao)

  sectionTitle(doc, 'Família e Profissionais')
  field(doc, 'Responsáveis / Família', c.responsaveis)
  field(doc, 'Profissionais Envolvidos', c.profissionais)
  field(doc, 'Data da Próxima Revisão', c.proxima_revisao)
}

function renderPlanoEletiva(doc: PDFKit.PDFDocument, c: Record<string, string>) {
  sectionTitle(doc, 'Identificação')
  field(doc, 'Nome da Eletiva', c.nome_eletiva)
  field(doc, 'Turmas Atendidas', c.turmas)
  field(doc, 'Semestre', c.semestre)
  field(doc, 'Carga Horária Semanal', c.carga_horaria)

  sectionTitle(doc, 'Proposta Pedagógica')
  field(doc, 'Justificativa', c.justificativa)
  field(doc, 'Objetivos', c.objetivos)
  field(doc, 'Conteúdo Programático', c.conteudo)

  sectionTitle(doc, 'Metodologia e Avaliação')
  field(doc, 'Metodologia', c.metodologia)
  field(doc, 'Avaliação', c.avaliacao)
  field(doc, 'Materiais e Recursos', c.materiais)
}

function renderPlanoEma(doc: PDFKit.PDFDocument, c: Record<string, string>) {
  sectionTitle(doc, 'Identificação')
  field(doc, 'Modalidade', c.modalidade)
  field(doc, 'Bimestre', c.bimestre)
  field(doc, 'Turmas Atendidas', c.turmas)
  field(doc, 'Carga Horária Semanal', c.carga_horaria)
  field(doc, 'Tema / Projeto', c.tema)

  sectionTitle(doc, 'Planejamento')
  field(doc, 'Objetivos', c.objetivos)
  field(doc, 'Conteúdos', c.conteudos)
  field(doc, 'Metodologia', c.metodologia)
  field(doc, 'Avaliação', c.avaliacao)
  field(doc, 'Materiais e Equipamentos', c.materiais)
}

function renderProjeto(doc: PDFKit.PDFDocument, c: Record<string, string>) {
  sectionTitle(doc, 'Identificação do Projeto')
  field(doc, 'Título do Projeto', c.titulo)
  field(doc, 'Turmas Participantes', c.turmas)
  field(doc, 'Período de Realização', c.periodo)
  field(doc, 'Disciplinas Envolvidas', c.disciplinas)

  sectionTitle(doc, 'Proposta')
  field(doc, 'Justificativa', c.justificativa)
  field(doc, 'Objetivos Gerais', c.objetivos_gerais)
  field(doc, 'Objetivos Específicos', c.objetivos_especificos)

  sectionTitle(doc, 'Desenvolvimento e Avaliação')
  field(doc, 'Etapas de Desenvolvimento', c.etapas)
  field(doc, 'Produto Final Esperado', c.produto_final)
  field(doc, 'Avaliação', c.avaliacao)
  field(doc, 'Apresentação / Culminância', c.apresentacao)
}

function renderPdi(doc: PDFKit.PDFDocument, c: Record<string, string>) {
  sectionTitle(doc, 'Identificação')
  field(doc, 'Período de Referência', c.periodo)
  field(doc, 'Data de Elaboração', c.data_elaboracao)

  sectionTitle(doc, 'Autoavaliação')
  field(doc, 'Avaliação das Competências Profissionais', c.autoavaliacao)
  field(doc, 'Principais Desafios Enfrentados', c.desafios)

  sectionTitle(doc, 'Metas e Desenvolvimento')
  field(doc, 'Metas Profissionais', c.metas)
  field(doc, 'Formações Realizadas / Desejadas', c.formacoes)
  field(doc, 'Estratégias para Alcançar as Metas', c.estrategias)
  field(doc, 'Indicadores de Sucesso', c.indicadores)
}

// ─── Main entry ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  plano_de_aula: 'Plano de Aula',
  guia_de_aprendizagem: 'Guia de Aprendizagem',
  pei: 'Plano Educacional Individualizado (PEI)',
  plano_de_eletiva: 'Plano de Eletiva',
  plano_ema: 'Plano EMA',
  projeto: 'Template de Projeto',
  pdi: 'Plano de Desenvolvimento Individual (PDI)',
}

export function generatePdf(input: PdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 80, bottom: 60, left: 40, right: 40 },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const docType = TYPE_LABELS[input.type] ?? input.type

    header(doc, input.title, docType, input.userName)

    const c = input.content

    switch (input.type) {
      case 'plano_de_aula':        renderPlanoDeAula(doc, c);        break
      case 'guia_de_aprendizagem': renderGuiaAprendizagem(doc, c);   break
      case 'pei':                  renderPei(doc, c);                 break
      case 'plano_de_eletiva':     renderPlanoEletiva(doc, c);        break
      case 'plano_ema':            renderPlanoEma(doc, c);            break
      case 'projeto':              renderProjeto(doc, c);             break
      case 'pdi':                  renderPdi(doc, c);                 break
    }

    footer(doc)
    doc.end()
  })
}
