import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { Solution } from "@/components/Solution";
import { Benefits } from "@/components/Benefits";
import { HowItWorks } from "@/components/HowItWorks";
import { Demo } from "@/components/Demo";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "samba paper",
  description: "Gerador de planos de aula, guias, PEI, eletivas, EMA, projetos e PDI para a EE Prof. Christino Cabral.",
};

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  return (
    <main className="min-h-screen flex flex-col relative w-full overflow-hidden">
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <Benefits />
      <HowItWorks />
      <Demo />
      <Contact />
      <Footer />
    </main>
  );
}
