import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDocument, getMyClasses, getDisciplinasByProfesor, getAeeStudents } from "@/lib/actions";
import { DocumentoEditor } from "@/components/dashboard/documentos/DocumentoEditor";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getDocument(Number(id));
  return { title: doc?.title ?? "Documento" };
}

export default async function DocumentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const doc = await getDocument(Number(id));
  if (!doc) notFound();

  const [classes, disciplines, students] = await Promise.all([
    getMyClasses(),
    getDisciplinasByProfesor(),
    doc.type === "pei" ? getAeeStudents() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/documentos" className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft size={16} className="text-muted-foreground" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-foreground truncate">{doc.title}</h1>
          <p className="text-xs text-muted-foreground capitalize">{doc.type.replace(/_/g, " ")}</p>
        </div>
        <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full shrink-0 ${
          doc.status === "final"
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-secondary/10 text-secondary"
        }`}>
          {doc.status === "final" ? "Finalizado" : "Rascunho"}
        </span>
      </div>

      <DocumentoEditor
        doc={{
          id: doc.id,
          type: doc.type as string,
          title: doc.title,
          content: (doc.content ?? {}) as Record<string, string>,
          pdfPath: doc.pdfPath ?? null,
          status: doc.status as string,
        }}
        userName={session.name}
        classes={classes.map((c) => ({
          id: c.id,
          name: c.name,
          grade: c.grade.label,
          section: c.section.label,
          ciclo: c.grade.level as string,
          serie: String(c.grade.yearNumber),
        }))}
        disciplines={disciplines.map((d) => ({ id: d.id, name: d.name, type: d.disciplineType, aulasNome: d.aulasDisciplinaNome ?? null }))}
        students={students.map((s) => ({
          id: s.id,
          name: s.name,
          ra: s.ra,
          className: s.schoolClass ? `${s.schoolClass.grade.label}${s.schoolClass.section.label}` : "",
        }))}
      />
    </div>
  );
}
