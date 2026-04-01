import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { avatarUrl: true },
  });

  const profile = {
    name: session.name,
    role: session.role,
    avatarUrl: user?.avatarUrl ?? null,
  };

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  );
}
