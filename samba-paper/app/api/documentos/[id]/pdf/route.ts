import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generatePdf } from '@/lib/pdf-generator'
import fs from 'fs/promises'
import path from 'path'

const STORAGE_DIR = process.env.STORAGE_DIR ?? '/app/storage'

/** Extract BNCC-style codes from a habilidades string (one per line). */
function extractCodes(raw: string): string[] {
  return raw
    .split('\n')
    .map((l) => l.match(/^\(?([A-Z]{2,4}\d+[A-Z]?\d*)\)?/)?.[1] ?? '')
    .filter(Boolean)
}

/** Look up descriptions for habilidade codes in skills + aulas tables. */
async function enrichHabilidades(raw: string): Promise<string> {
  const codes = extractCodes(raw)
  if (codes.length === 0) return raw

  // 1. Try samba_edvance.skills
  const skills = await prisma.skill.findMany({
    where: { code: { in: codes } },
    select: { code: true, description: true },
  })
  const descMap = new Map(skills.map((s) => [s.code, s.description]))

  // 2. Fill missing from samba_paper.aulas.habilidade_texto
  const missing = codes.filter((c) => !descMap.has(c))
  if (missing.length > 0) {
    for (const code of missing) {
      const aula = await prisma.aula.findFirst({
        where: { habilidadeCodigo: { contains: code } },
        select: { habilidadeTexto: true },
      })
      if (aula?.habilidadeTexto) {
        const line = aula.habilidadeTexto
          .split('\n')
          .find((l) => l.includes(code) || l.trim().length > 10)
        if (line) descMap.set(code, line.replace(/^[\s\-•*–]+/, '').trim())
      }
    }
  }

  if (descMap.size === 0) return raw

  // Rebuild lines — add description only when currently missing
  return raw
    .split('\n')
    .map((line) => {
      const m = line.match(/^\(?([A-Z]{2,4}\d+[A-Z]?\d*)\)?\s*(.*)$/)
      if (!m) return line
      const code = m[1]
      const existing = m[2].trim().replace(/^[-–—]\s*/, '')
      if (!existing && descMap.has(code)) {
        return `(${code}) ${descMap.get(code)}`
      }
      return line
    })
    .join('\n')
}

// POST /api/documentos/[id]/pdf — generate PDF
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const docId = Number(id)

  const doc = await prisma.document.findFirst({
    where: { id: docId, userId: session.id },
  })

  if (!doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })

  try {
    const content = (doc.content ?? {}) as Record<string, string>

    // Enrich habilidades with descriptions from DB
    if (content.habilidades?.trim()) {
      content.habilidades = await enrichHabilidades(content.habilidades)
    }

    const buffer = await generatePdf({
      type: doc.type,
      title: doc.title,
      userName: session.name,
      content,
      createdAt: doc.createdAt.toISOString(),
    })

    await fs.mkdir(path.join(STORAGE_DIR, 'pdfs'), { recursive: true })

    const filename = `doc_${docId}_${Date.now()}.pdf`
    const filePath = path.join(STORAGE_DIR, 'pdfs', filename)
    await fs.writeFile(filePath, buffer)

    // Remove old PDF if exists
    if (doc.pdfPath) {
      try { await fs.unlink(path.join(STORAGE_DIR, doc.pdfPath)) } catch { /* já removido */ }
    }

    const relativePath = `pdfs/${filename}`
    await prisma.document.update({
      where: { id: docId },
      data: { pdfPath: relativePath, status: 'final', updatedAt: new Date() },
    })

    return NextResponse.json({ pdfPath: relativePath })
  } catch (e) {
    console.error('PDF generation error:', e)
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
  }
}
