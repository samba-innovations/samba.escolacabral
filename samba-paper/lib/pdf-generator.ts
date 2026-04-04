import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PdfInput {
  type: string
  title: string
  userName: string
  content: Record<string, string>
  createdAt?: string   // ISO string — used to auto-fill data field
}

// ─── Period helpers ───────────────────────────────────────────────────────────

const PERIODO_LABELS: Record<string, string> = {
  por_aula:  'Por aula',
  semanal:   'Semanal',
  quinzenal: 'Quinzenal',
}

function ptDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function computeDataRange(periodo: string, createdAt: string): string {
  const start = new Date(createdAt)
  if (periodo === 'semanal') {
    const end = new Date(start); end.setDate(end.getDate() + 6)
    return `${ptDate(start)} até ${ptDate(end)}`
  }
  if (periodo === 'quinzenal') {
    const end = new Date(start); end.setDate(end.getDate() + 14)
    return `${ptDate(start)} até ${ptDate(end)}`
  }
  return ptDate(start)  // por_aula or unknown
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const PRIMARY    = '#7a1e7a'
const DARK       = '#0f0714'
const LIGHT_BG   = '#f8f3fb'
const BORDER     = '#ddc8e8'
const LABEL_CLR  = '#5a1e6a'
const TEXT_CLR   = '#1a0a1a'
const MUTED      = '#8a6a9a'

const PAGE_W     = 595.28
const PAGE_H     = 841.89
const ML         = 50
const MR         = 50
const CONTENT_W  = PAGE_W - ML - MR
const GOVT_H     = 80
const APP_H      = 38
const HEADER_H   = GOVT_H + APP_H
const BOTTOM_M   = 55

// ─── Helpers ─────────────────────────────────────────────────────────────────

function imgPath(name: string): string {
  return path.join(process.cwd(), 'public', 'imgs', name)
}

function hasImg(name: string): boolean {
  try { fs.accessSync(imgPath(name)); return true } catch { return false }
}

/** Add a new page if less than `neededH` px remain on the current page. */
function ensureSpace(doc: PDFKit.PDFDocument, neededH: number) {
  if (doc.y + neededH > PAGE_H - BOTTOM_M) {
    doc.addPage()
  }
}

// ─── Government letterhead header ────────────────────────────────────────────

function govtHeader(doc: PDFKit.PDFDocument) {
  doc.rect(0, 0, PAGE_W, GOVT_H).fill('#ffffff')
  doc.moveTo(ML, GOVT_H - 0.5).lineTo(PAGE_W - MR, GOVT_H - 0.5)
    .strokeColor(BORDER).lineWidth(0.8).stroke()

  const logoW = 52
  const eiW   = 54
  const logoY = (GOVT_H - logoW * 0.7) / 2
  const eiY   = (GOVT_H - eiW) / 2

  // SP Educação logo (left)
  if (hasImg('logo_sp.png')) {
    doc.image(imgPath('logo_sp.png'), ML, logoY, { width: logoW })
  } else {
    doc.font('Helvetica-Bold').fontSize(15).fillColor('#cc0000')
    doc.text('SP', ML, 22, { lineBreak: false })
    doc.font('Helvetica-Bold').fontSize(7).fillColor(DARK)
    doc.text('Educação', ML, 42, { lineBreak: false })
  }

  // Ensino Integral logo (right)
  const eiX = PAGE_W - MR - eiW
  if (hasImg('logo_integral.png')) {
    doc.image(imgPath('logo_integral.png'), eiX, eiY, { width: eiW })
  } else {
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#c8860a')
    doc.text('ENSINO\nINTEGRAL', eiX, 30, { width: eiW, align: 'center' })
  }

  // Centered institutional text
  const textX = ML + logoW + 12
  const textW = PAGE_W - textX - eiW - MR - 12

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(DARK)
  doc.text('GOVERNO DO ESTADO DE SÃO PAULO – SECRETARIA DE ESTADO DA EDUCAÇÃO',
    textX, 12, { width: textW, align: 'center', lineBreak: false })
  doc.font('Helvetica').fontSize(7).fillColor(DARK)
  doc.text('UNIDADE REGIONAL DE ENSINO – REGIÃO BAURU – EE PROF. CHRISTINO CABRAL',
    textX, 26, { width: textW, align: 'center', lineBreak: false })
  doc.text('Rua Gerson França, 19-165 – Jardim Estoril II – CEP: 17016-000',
    textX, 39, { width: textW, align: 'center', lineBreak: false })
  doc.text('Telefones: (14) 3223-3855 (WhatsApp); (14) 3227-4664 – E-mail: e625598a@educacao.sp.gov.br',
    textX, 52, { width: textW, align: 'center', lineBreak: false })
}

// ─── samba-paper dark bar ────────────────────────────────────────────────────

function appBar(doc: PDFKit.PDFDocument, docType: string, userName: string, periodoLabel?: string) {
  doc.rect(0, GOVT_H, PAGE_W, APP_H).fill(DARK)
  doc.rect(0, GOVT_H + APP_H, PAGE_W, 2).fill(PRIMARY)

  // "samba paper" label
  doc.font('Helvetica-Bold').fontSize(8).fillColor(PRIMARY)
  doc.text('samba paper', ML, GOVT_H + 8, { lineBreak: false })

  // doc type
  doc.font('Helvetica').fontSize(7).fillColor('#9a6aaa')
  doc.text(docType.toUpperCase(), ML + 80, GOVT_H + 9, { lineBreak: false })

  // period label (optional)
  if (periodoLabel) {
    doc.font('Helvetica').fontSize(6.5).fillColor('#7a5a8a')
    doc.text(`· ${periodoLabel}`, ML + 80 + 72, GOVT_H + 9.5, { lineBreak: false })
  }

  // userName — fixed box ending at right margin
  const nameW = 140
  doc.font('Helvetica').fontSize(7).fillColor('#b090c0')
  doc.text(userName, PAGE_W - MR - nameW, GOVT_H + 9, {
    width: nameW, align: 'right', lineBreak: false,
  })
}

// ─── Subsequent-page mini header ─────────────────────────────────────────────

function miniHeader(doc: PDFKit.PDFDocument, docType: string) {
  doc.rect(0, 0, PAGE_W, 28).fill(DARK)
  doc.rect(0, 28, PAGE_W, 2).fill(PRIMARY)
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(PRIMARY)
  doc.text('samba paper', ML, 10, { lineBreak: false })
  doc.font('Helvetica').fontSize(7).fillColor('#9a6aaa')
  doc.text(` · ${docType}`, ML + 70, 10, { lineBreak: false })
}

// ─── Footer (drawn at absolute position — does NOT trigger new page) ──────────

function footer(doc: PDFKit.PDFDocument) {
  const y = PAGE_H - 36
  // Temporarily remove bottom margin so drawing near page end doesn't add a page
  const savedBottom = doc.page.margins.bottom
  doc.page.margins.bottom = 0

  doc.moveTo(ML, y).lineTo(PAGE_W - MR, y).strokeColor(BORDER).lineWidth(0.5).stroke()
  const date = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.font('Helvetica').fontSize(7).fillColor(MUTED)
  doc.text(
    `Gerado em ${date}  ·  EE Prof. Christino Cabral  ·  samba paper`,
    ML, y + 8, { width: CONTENT_W, align: 'center', lineBreak: false }
  )

  doc.page.margins.bottom = savedBottom
}

// ─── Section title ────────────────────────────────────────────────────────────

function sectionTitle(doc: PDFKit.PDFDocument, text: string) {
  ensureSpace(doc, 70)
  doc.moveDown(0.7)
  const y = doc.y
  doc.rect(ML, y, CONTENT_W, 18).fill(PRIMARY)
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff')
  doc.text(text.toUpperCase(), ML + 8, y + 5, { characterSpacing: 1, lineBreak: false })
  doc.y = y + 22
}

// ─── Sub-section label (for habilidades, etc.) ────────────────────────────────

function subLabel(doc: PDFKit.PDFDocument, text: string) {
  const pad = 6
  const y0  = doc.y
  doc.rect(ML, y0, CONTENT_W, 16).fill(LIGHT_BG)
  doc.rect(ML, y0, CONTENT_W, 16).strokeColor(BORDER).lineWidth(0.3).stroke()
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(LABEL_CLR)
  doc.text(text, ML + pad, y0 + 4, { lineBreak: false })
  doc.y = y0 + 16
}

// ─── Info table (grid of label+value cells) ───────────────────────────────────

type Cell = { label: string; value: string; span?: number }

function infoRow(doc: PDFKit.PDFDocument, cells: Cell[]) {
  const colW   = CONTENT_W / 2
  const pad    = 6
  const labelH = 10
  const minH   = 26

  // Calculate heights per cell
  const heights = cells.map((cell) => {
    if (!cell.value?.trim()) return minH
    const w = (cell.span === 2 ? CONTENT_W : colW) - pad * 2
    doc.font('Helvetica').fontSize(9)
    const h = doc.heightOfString(cell.value, { width: w }) + labelH + pad * 2
    return Math.max(h, minH)
  })
  const rowH   = Math.max(...heights)
  ensureSpace(doc, rowH)
  const startY = doc.y

  let x = ML
  cells.forEach((cell) => {
    const w = cell.span === 2 ? CONTENT_W : colW

    doc.rect(x, startY, w, rowH).fill(LIGHT_BG)
    doc.rect(x, startY, w, rowH).strokeColor(BORDER).lineWidth(0.4).stroke()

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(LABEL_CLR)
    doc.text(cell.label, x + pad, startY + pad, { width: w - pad * 2, lineBreak: false })

    doc.font('Helvetica').fontSize(9.5).fillColor(TEXT_CLR)
    doc.text(cell.value?.trim() || '—', x + pad, startY + pad + labelH, { width: w - pad * 2, lineGap: 1.5 })

    x += w
  })

  doc.y = startY + rowH
}

// ─── 2-column habilidades table ───────────────────────────────────────────────

function habilidadesTable(doc: PDFKit.PDFDocument, raw: string) {
  if (!raw?.trim()) return

  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  const rows: { code: string; desc: string }[] = lines.map((line) => {
    // Format: (EM13CNT204) description
    const m = line.match(/^\(([^)]+)\)\s*(.+)$/)
    if (m) return { code: m[1], desc: m[2] }
    // Format: EM13CNT204 description  OR  EM13CNT204 (code only)
    const parts = line.split(/\s+/)
    if (parts.length === 1 || /^[A-Z]{2,4}\d/.test(parts[0])) {
      return { code: parts[0], desc: parts.slice(1).join(' ') || '' }
    }
    return { code: '', desc: line }
  })

  const codeW = 95
  const descW = CONTENT_W - codeW
  const pad   = 6

  // Sub-label bar
  subLabel(doc, 'Habilidades BNCC / Currículo Paulista')

  // Pre-calculate total table height to avoid mid-table breaks
  doc.font('Helvetica').fontSize(9)
  const headerH = 18
  let totalH = headerH
  const rowHeights = rows.map((row) => {
    const descH = row.desc ? doc.heightOfString(row.desc, { width: descW - pad * 2 }) : 0
    return Math.max(descH + pad * 2, 22)
  })
  totalH += rowHeights.reduce((a, b) => a + b, 0)

  // If table doesn't fit, move to new page
  ensureSpace(doc, Math.min(totalH, 120))

  const y0 = doc.y

  // Header row
  doc.rect(ML, y0, codeW, headerH).fill(PRIMARY)
  doc.rect(ML + codeW, y0, descW, headerH).fill(PRIMARY)
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff')
  doc.text('CÓDIGO', ML + pad, y0 + 5, { width: codeW - pad, lineBreak: false })
  doc.text('DESCRIÇÃO', ML + codeW + pad, y0 + 5, { width: descW - pad, lineBreak: false })

  let rowY = y0 + headerH

  rows.forEach((row, i) => {
    const rowH = rowHeights[i]

    // If this row won't fit, add page and redraw header
    if (rowY + rowH > PAGE_H - BOTTOM_M) {
      doc.addPage()
      rowY = doc.y
      doc.rect(ML, rowY, codeW, headerH).fill(PRIMARY)
      doc.rect(ML + codeW, rowY, descW, headerH).fill(PRIMARY)
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff')
      doc.text('CÓDIGO', ML + pad, rowY + 5, { width: codeW - pad, lineBreak: false })
      doc.text('DESCRIÇÃO', ML + codeW + pad, rowY + 5, { width: descW - pad, lineBreak: false })
      rowY += headerH
    }

    const bg = i % 2 === 0 ? '#ffffff' : LIGHT_BG
    doc.rect(ML, rowY, codeW, rowH).fill(bg).strokeColor(BORDER).lineWidth(0.3).stroke()
    doc.rect(ML + codeW, rowY, descW, rowH).fill(bg).strokeColor(BORDER).lineWidth(0.3).stroke()

    if (row.code) {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(PRIMARY)
      doc.text(row.code, ML + pad, rowY + pad, { width: codeW - pad * 2, lineBreak: false })
    }

    doc.font('Helvetica').fontSize(9).fillColor(TEXT_CLR)
    doc.text(row.desc || '—', ML + codeW + pad, rowY + pad, { width: descW - pad * 2, lineGap: 1.5 })

    rowY += rowH
  })

  doc.y = rowY + 4
}

// ─── Simple text block ────────────────────────────────────────────────────────

function textBlock(doc: PDFKit.PDFDocument, label: string, value: string) {
  if (!value?.trim()) return
  const pad = 6

  // Estimate height to avoid orphaned headers
  doc.font('Helvetica').fontSize(9.5)
  const bodyH = doc.heightOfString(value.trim(), { width: CONTENT_W - pad * 2 })
  ensureSpace(doc, Math.min(16 + bodyH + pad * 2 + 4, 80))

  const y0 = doc.y
  doc.rect(ML, y0, CONTENT_W, 16).fill(LIGHT_BG)
  doc.rect(ML, y0, CONTENT_W, 16).strokeColor(BORDER).lineWidth(0.3).stroke()
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(LABEL_CLR)
  doc.text(label, ML + pad, y0 + 4, { lineBreak: false })

  const bodyY = y0 + 16
  doc.rect(ML, bodyY, CONTENT_W, 1).fill(BORDER)

  doc.font('Helvetica').fontSize(9.5).fillColor(TEXT_CLR)
  doc.text(value.trim(), ML + pad, bodyY + pad, { width: CONTENT_W - pad * 2, lineGap: 2 })
  const endY = doc.y + pad
  doc.rect(ML, bodyY + 1, CONTENT_W, endY - bodyY - 1).strokeColor(BORDER).lineWidth(0.3).stroke()

  doc.y = endY + 2
}

// ─── Bullet list block ────────────────────────────────────────────────────────

function bulletBlock(doc: PDFKit.PDFDocument, label: string, value: string) {
  if (!value?.trim()) return
  const items = value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
  if (items.length === 0) return

  const pad = 6
  ensureSpace(doc, 16 + items.length * 14 + pad * 2)

  const y0 = doc.y
  doc.rect(ML, y0, CONTENT_W, 16).fill(LIGHT_BG)
  doc.rect(ML, y0, CONTENT_W, 16).strokeColor(BORDER).lineWidth(0.3).stroke()
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(LABEL_CLR)
  doc.text(label, ML + pad, y0 + 4, { lineBreak: false })

  const bodyY = y0 + 16
  doc.rect(ML, bodyY, CONTENT_W, 1).fill(BORDER)

  let itemY = bodyY + pad
  items.forEach((item) => {
    // Check page space mid-list
    if (itemY + 14 > PAGE_H - BOTTOM_M) {
      doc.addPage()
      itemY = doc.y + pad
    }
    doc.font('Helvetica').fontSize(9).fillColor(PRIMARY)
    doc.text('•', ML + pad, itemY, { lineBreak: false })
    doc.font('Helvetica').fontSize(9).fillColor(TEXT_CLR)
    doc.text(item, ML + pad + 10, itemY, { width: CONTENT_W - pad * 2 - 10, lineGap: 1 })
    itemY = doc.y + 2
  })

  const endY = itemY + pad
  doc.rect(ML, bodyY + 1, CONTENT_W, endY - bodyY - 1).strokeColor(BORDER).lineWidth(0.3).stroke()
  doc.y = endY + 2
}

// ─── Document renderers ───────────────────────────────────────────────────────

function renderPlanoDeAula(doc: PDFKit.PDFDocument, c: Record<string, string>, createdAt?: string) {
  // Auto-compute data if blank
  const dataValue = c.data?.trim()
    || (createdAt ? computeDataRange(c.periodo ?? 'por_aula', createdAt) : '—')

  sectionTitle(doc, 'Identificação')
  infoRow(doc, [
    { label: 'Turma', value: c.turmas || c.turma },
    { label: 'Disciplina', value: c.disciplina },
  ])
  infoRow(doc, [
    { label: 'Bimestre', value: c.bimestre ? `${c.bimestre}º Bimestre` : c.bimestre },
    { label: 'Data', value: dataValue },
  ])
  if (c.tema) infoRow(doc, [{ label: 'Tema / Título da Aula', value: c.tema, span: 2 }])

  sectionTitle(doc, 'Objetivos e Habilidades')
  if (c.objetivo_geral) textBlock(doc, 'Objetivo Geral', c.objetivo_geral)
  if (c.habilidades?.trim()) {
    doc.moveDown(0.3)
    habilidadesTable(doc, c.habilidades)
  }
  if (c.objeto_conhecimento) textBlock(doc, 'Objeto de Conhecimento', c.objeto_conhecimento)

  sectionTitle(doc, 'Desenvolvimento da Aula')
  if (c.desenvolvimento_inicial)    textBlock(doc, 'Momento Inicial (10–15 min)', c.desenvolvimento_inicial)
  if (c.desenvolvimento_principal)  textBlock(doc, 'Desenvolvimento (25–30 min)', c.desenvolvimento_principal)
  if (c.desenvolvimento_fechamento) textBlock(doc, 'Fechamento / Sistematização (~10 min)', c.desenvolvimento_fechamento)

  sectionTitle(doc, 'Recursos e Avaliação')
  if (c.recursos_materiais) bulletBlock(doc, 'Recursos e Materiais', c.recursos_materiais)
  if (c.avaliacao)          bulletBlock(doc, 'Avaliação', c.avaliacao)
}

function renderGuiaAprendizagem(doc: PDFKit.PDFDocument, c: Record<string, string>) {
  sectionTitle(doc, 'Identificação')
  infoRow(doc, [
    { label: 'Turma(s)', value: c.turmas || c.turma },
    { label: 'Disciplina', value: c.disciplina },
  ])
  infoRow(doc, [
    { label: 'Bimestre', value: c.bimestre },
    { label: 'Ano Letivo', value: c.ano_letivo },
  ])
  if (c.tema) infoRow(doc, [{ label: 'Tema', value: c.tema, span: 2 }])

  sectionTitle(doc, 'Conteúdo Curricular')
  if (c.competencias) textBlock(doc, 'Competências Gerais (BNCC)', c.competencias)
  if (c.habilidades?.trim()) {
    doc.moveDown(0.3)
    habilidadesTable(doc, c.habilidades)
  }
  if (c.conteudos) textBlock(doc, 'Conteúdos Programáticos', c.conteudos)

  sectionTitle(doc, 'Metodologia e Avaliação')
  if (c.estrategias) textBlock(doc, 'Estratégias Didáticas', c.estrategias)
  if (c.recursos)    bulletBlock(doc, 'Recursos e Materiais', c.recursos)
  if (c.avaliacao)   bulletBlock(doc, 'Avaliação Bimestral', c.avaliacao)
  if (c.referencias) textBlock(doc, 'Referências', c.referencias)
}

function renderPei(doc: PDFKit.PDFDocument, c: Record<string, string>) {
  sectionTitle(doc, 'Identificação do Aluno')
  infoRow(doc, [
    { label: 'Aluno', value: c.aluno },
    { label: 'RA', value: c.ra_aluno },
  ])
  infoRow(doc, [
    { label: 'Turma', value: c.turma },
    { label: 'Bimestre', value: c.bimestre },
  ])
  infoRow(doc, [{ label: 'Data de Elaboração', value: c.data_elaboracao, span: 2 }])

  sectionTitle(doc, 'Diagnóstico e Necessidades')
  if (c.diagnostico) textBlock(doc, 'Diagnóstico Funcional / CID', c.diagnostico)
  if (c.areas_apoio) textBlock(doc, 'Áreas de Apoio Necessárias', c.areas_apoio)

  sectionTitle(doc, 'Plano de Ação')
  if (c.objetivos)   textBlock(doc, 'Objetivos Específicos', c.objetivos)
  if (c.estrategias) textBlock(doc, 'Estratégias e Recursos Pedagógicos', c.estrategias)
  if (c.avaliacao)   textBlock(doc, 'Avaliação do Processo', c.avaliacao)

  sectionTitle(doc, 'Família e Profissionais')
  infoRow(doc, [
    { label: 'Responsáveis / Família', value: c.responsaveis },
    { label: 'Data da Próxima Revisão', value: c.proxima_revisao },
  ])
  if (c.profissionais) textBlock(doc, 'Profissionais Envolvidos', c.profissionais)
}

function renderPlanoEletiva(doc: PDFKit.PDFDocument, c: Record<string, string>) {
  sectionTitle(doc, 'Identificação')
  infoRow(doc, [{ label: 'Nome da Eletiva', value: c.nome_eletiva, span: 2 }])
  infoRow(doc, [
    { label: 'Turmas Atendidas', value: c.turmas },
    { label: 'Semestre', value: c.semestre },
  ])
  infoRow(doc, [{ label: 'Carga Horária Semanal', value: c.carga_horaria, span: 2 }])

  sectionTitle(doc, 'Proposta Pedagógica')
  if (c.justificativa) textBlock(doc, 'Justificativa', c.justificativa)
  if (c.objetivos)     textBlock(doc, 'Objetivos', c.objetivos)
  if (c.conteudo)      textBlock(doc, 'Conteúdo Programático', c.conteudo)

  sectionTitle(doc, 'Metodologia e Avaliação')
  if (c.metodologia) textBlock(doc, 'Metodologia', c.metodologia)
  if (c.avaliacao)   bulletBlock(doc, 'Avaliação', c.avaliacao)
  if (c.materiais)   bulletBlock(doc, 'Materiais e Recursos', c.materiais)
}

function renderPlanoEma(doc: PDFKit.PDFDocument, c: Record<string, string>) {
  sectionTitle(doc, 'Identificação')
  infoRow(doc, [
    { label: 'Modalidade', value: c.modalidade },
    { label: 'Bimestre', value: c.bimestre },
  ])
  infoRow(doc, [
    { label: 'Turmas Atendidas', value: c.turmas },
    { label: 'Carga Horária Semanal', value: c.carga_horaria },
  ])
  infoRow(doc, [{ label: 'Tema / Projeto do Bimestre', value: c.tema, span: 2 }])

  sectionTitle(doc, 'Planejamento')
  if (c.objetivos)   textBlock(doc, 'Objetivos', c.objetivos)
  if (c.conteudos)   textBlock(doc, 'Conteúdos', c.conteudos)
  if (c.metodologia) textBlock(doc, 'Metodologia', c.metodologia)
  if (c.avaliacao)   bulletBlock(doc, 'Avaliação', c.avaliacao)
  if (c.materiais)   bulletBlock(doc, 'Materiais e Equipamentos', c.materiais)
}

function renderProjeto(doc: PDFKit.PDFDocument, c: Record<string, string>) {
  sectionTitle(doc, 'Identificação do Projeto')
  infoRow(doc, [{ label: 'Título do Projeto', value: c.titulo, span: 2 }])
  infoRow(doc, [
    { label: 'Turmas Participantes', value: c.turmas },
    { label: 'Período de Realização', value: c.periodo },
  ])
  infoRow(doc, [{ label: 'Disciplinas Envolvidas', value: c.disciplinas, span: 2 }])

  sectionTitle(doc, 'Proposta')
  if (c.justificativa)         textBlock(doc, 'Justificativa', c.justificativa)
  if (c.objetivos_gerais)      textBlock(doc, 'Objetivos Gerais', c.objetivos_gerais)
  if (c.objetivos_especificos) textBlock(doc, 'Objetivos Específicos', c.objetivos_especificos)

  sectionTitle(doc, 'Desenvolvimento e Avaliação')
  if (c.etapas)        textBlock(doc, 'Etapas de Desenvolvimento', c.etapas)
  if (c.produto_final) textBlock(doc, 'Produto Final Esperado', c.produto_final)
  if (c.avaliacao)     bulletBlock(doc, 'Avaliação', c.avaliacao)
  if (c.apresentacao)  textBlock(doc, 'Apresentação / Culminância', c.apresentacao)
}

function renderPdi(doc: PDFKit.PDFDocument, c: Record<string, string>) {
  sectionTitle(doc, 'Identificação')
  infoRow(doc, [
    { label: 'Período de Referência', value: c.periodo },
    { label: 'Data de Elaboração', value: c.data_elaboracao },
  ])

  sectionTitle(doc, 'Autoavaliação')
  if (c.autoavaliacao) textBlock(doc, 'Avaliação das Competências Profissionais', c.autoavaliacao)
  if (c.desafios)      textBlock(doc, 'Principais Desafios Enfrentados', c.desafios)

  sectionTitle(doc, 'Metas e Desenvolvimento')
  if (c.metas)       textBlock(doc, 'Metas Profissionais para o Próximo Período', c.metas)
  if (c.formacoes)   textBlock(doc, 'Formações Realizadas / Desejadas', c.formacoes)
  if (c.estrategias) textBlock(doc, 'Estratégias para Alcançar as Metas', c.estrategias)
  if (c.indicadores) textBlock(doc, 'Indicadores de Sucesso', c.indicadores)
}

// ─── Main entry ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  plano_de_aula:        'Plano de Aula',
  guia_de_aprendizagem: 'Guia de Aprendizagem',
  pei:                  'Plano Educacional Individualizado (PEI)',
  plano_de_eletiva:     'Plano de Eletiva',
  plano_ema:            'Plano EMA',
  projeto:              'Projeto Interdisciplinar',
  pdi:                  'Plano de Desenvolvimento Individual (PDI)',
}

export function generatePdf(input: PdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const docType      = TYPE_LABELS[input.type] ?? input.type
    const periodoLabel = input.type === 'plano_de_aula'
      ? (PERIODO_LABELS[input.content.periodo ?? ''] ?? undefined)
      : undefined
    const firstPageTop = HEADER_H + 16

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: firstPageTop, bottom: BOTTOM_M, left: ML, right: MR },
    })

    const chunks: Buffer[] = []
    doc.on('data',  (chunk: Buffer) => chunks.push(chunk))
    doc.on('end',   () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Track whether we are finishing (to skip miniHeader on footer overflow)
    let finishing = false
    doc.on('pageAdded', () => {
      if (!finishing) {
        miniHeader(doc, docType)
        doc.y = 42
      }
    })

    // Page 1 headers
    govtHeader(doc)
    appBar(doc, docType, input.userName, periodoLabel)

    // Document title
    doc.y = firstPageTop
    doc.font('Helvetica-Bold').fontSize(16).fillColor(DARK)
    doc.text(input.title, ML, doc.y, { width: CONTENT_W })
    doc.moveDown(0.6)
    doc.moveTo(ML, doc.y).lineTo(PAGE_W - MR, doc.y).strokeColor(BORDER).lineWidth(0.5).stroke()
    doc.moveDown(0.4)

    // Render content
    const c = input.content
    switch (input.type) {
      case 'plano_de_aula':        renderPlanoDeAula(doc, c, input.createdAt);  break
      case 'guia_de_aprendizagem': renderGuiaAprendizagem(doc, c);  break
      case 'pei':                  renderPei(doc, c);               break
      case 'plano_de_eletiva':     renderPlanoEletiva(doc, c);      break
      case 'plano_ema':            renderPlanoEma(doc, c);          break
      case 'projeto':              renderProjeto(doc, c);           break
      case 'pdi':                  renderPdi(doc, c);               break
    }

    // Footer on last page only (finishing flag prevents new miniHeader)
    finishing = true
    footer(doc)
    doc.end()
  })
}
