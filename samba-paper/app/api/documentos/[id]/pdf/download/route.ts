import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import fs from 'fs/promises'
import path from 'path'

const STORAGE_DIR = process.env.STORAGE_DIR ?? '/app/storage'

// GET /api/documentos/[id]/pdf/download — stream PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const docId = Number(id)

  const doc = await prisma.document.findFirst({
    where: { id: docId, userId: session.id },
    select: { pdfPath: true, title: true },
  })

  if (!doc?.pdfPath) return NextResponse.json({ error: 'PDF não encontrado' }, { status: 404 })

  try {
    const filePath = path.join(STORAGE_DIR, doc.pdfPath)
    const buffer = await fs.readFile(filePath)
    const safeTitle = doc.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').slice(0, 80)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Arquivo não encontrado no servidor' }, { status: 404 })
  }
}
