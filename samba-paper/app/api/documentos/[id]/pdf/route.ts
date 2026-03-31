import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generatePdf } from '@/lib/pdf-generator'
import fs from 'fs/promises'
import path from 'path'

const STORAGE_DIR = process.env.STORAGE_DIR ?? '/app/storage'

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
    const buffer = await generatePdf({
      type: doc.type,
      title: doc.title,
      userName: session.name,
      content: (doc.content ?? {}) as Record<string, string>,
    })

    await fs.mkdir(path.join(STORAGE_DIR, 'pdfs'), { recursive: true })

    const filename = `doc_${docId}_${Date.now()}.pdf`
    const filePath = path.join(STORAGE_DIR, 'pdfs', filename)
    await fs.writeFile(filePath, buffer)

    // Remove old PDF if exists
    if (doc.pdfPath) {
      try {
        await fs.unlink(path.join(STORAGE_DIR, doc.pdfPath))
      } catch { /* arquivo já não existe */ }
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
