import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Image from "next/image";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const { error } = await searchParams;
  const accessUrl = process.env.NEXT_PUBLIC_URL_ACCESS ?? "http://localhost:3002";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-8 p-8">
        <div className="flex items-center justify-center gap-4">
          <Image src="/imgs/paper-logo2.svg" alt="samba paper" width={52} height={52} />
          <div className="text-left">
            <p className="text-2xl font-black text-foreground">samba <span className="text-primary">paper</span></p>
            <p className="text-xs text-muted-foreground">Gerador de documentos pedagógicos</p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-xl">
            Erro ao autenticar. Tente novamente.
          </p>
        )}

        <a
          href={accessUrl}
          className="block w-full bg-primary hover:bg-primary/90 text-black font-bold py-3 px-6 rounded-2xl transition-colors"
        >
          Entrar com Samba Access
        </a>
      </div>
    </div>
  );
}
