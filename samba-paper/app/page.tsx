import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LandingPage } from "@/components/LandingPage";

export const metadata = {
  title: "samba paper — Documentação Pedagógica",
  description: "Gerador de planos de aula, guias, PEI, eletivas, EMA, projetos e PDI para a EE Prof. Christino Cabral.",
};

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  return <LandingPage />;
}
