"use server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import path from "path";
import fs from "fs/promises";

const STORAGE_DIR = process.env.STORAGE_DIR ?? "/app/storage";

const ALLOWED_TYPES = new Set([
  "plano_de_aula", "guia_de_aprendizagem", "pei",
  "plano_de_eletiva", "plano_ema", "projeto", "pdi"
]);

export async function getMyDocuments() {
  const session = await getSession();
  if (!session) return [];
  return prisma.document.findMany({
    where: { userId: session.id },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getDocument(id: number) {
  const session = await getSession();
  if (!session) return null;
  return prisma.document.findFirst({
    where: { id, userId: session.id },
  });
}

export async function createDocument(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const type = formData.get("type") as string;
  const title = formData.get("title") as string;

  if (!ALLOWED_TYPES.has(type)) throw new Error("Tipo inválido");
  if (!title?.trim()) throw new Error("Título obrigatório");

  const doc = await prisma.document.create({
    data: {
      userId: session.id,
      type: type as any,
      title: title.trim(),
      content: {},
      status: "draft",
    },
  });

  redirect(`/dashboard/documentos/${doc.id}`);
}

export async function saveDocument(id: number, content: Record<string, unknown>) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const doc = await prisma.document.findFirst({ where: { id, userId: session.id } });
  if (!doc) throw new Error("Documento não encontrado");

  await prisma.document.update({
    where: { id },
    data: { content: content as object, updatedAt: new Date() },
  });

  revalidatePath(`/dashboard/documentos/${id}`);
  return { ok: true };
}

export async function savePdfPath(id: number, pdfPath: string) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  await prisma.document.update({
    where: { id, userId: session.id },
    data: { pdfPath, status: "final", updatedAt: new Date() },
  });
  revalidatePath(`/dashboard/documentos/${id}`);
}

export async function deleteDocument(id: number) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const doc = await prisma.document.findFirst({ where: { id, userId: session.id } });
  if (!doc) throw new Error("Documento não encontrado");

  if (doc.pdfPath) {
    try {
      await fs.unlink(path.join(STORAGE_DIR, doc.pdfPath));
    } catch { /* arquivo já não existe */ }
  }

  await prisma.document.delete({ where: { id } });
  revalidatePath("/dashboard/documentos");
}

export async function getMyClasses() {
  const session = await getSession();
  if (!session) return [];
  return prisma.schoolClass.findMany({
    include: { grade: true, section: true },
    orderBy: { name: "asc" },
  });
}

export async function getDisciplines() {
  return prisma.discipline.findMany({ orderBy: { name: "asc" } });
}

export async function getAeeStudents() {
  // Returns students from AEE list (all students for now, filtered by class)
  return prisma.student.findMany({
    where: { isActive: true },
    include: { schoolClass: { include: { grade: true, section: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getAulasCurriculo(
  ciclo: string,
  serie: string,
  disciplinaNome: string,
  bimestre: number
) {
  return prisma.aula.findMany({
    where: { ciclo, serie, disciplinaNome, bimestre },
    orderBy: { aulaNum: "asc" },
    select: {
      id: true, aulaNum: true, titulo: true, eixo: true,
      unidadeTematica: true, habilidadeCodigo: true, habilidadeTexto: true,
      objetoConhecimento: true, conteudo: true, objetivos: true, bloco: true,
    },
  });
}

export async function getDisciplinasByProfesor() {
  const session = await getSession();
  if (!session) return [];
  // Returns disciplines linked to this teacher; falls back to all disciplines
  const vincs = await prisma.professorDisciplina.findMany({
    where: { userId: session.id },
  });
  if (vincs.length === 0) return prisma.discipline.findMany({ orderBy: { name: "asc" } });
  return prisma.discipline.findMany({
    where: { id: { in: vincs.map((v) => v.disciplineId) } },
    orderBy: { name: "asc" },
  });
}
