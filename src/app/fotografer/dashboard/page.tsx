import QueueDashboard from "@/features/queue/components/QueueDashboard";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard Fotografer | Visual Space",
};

export default async function FotograferDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "FOTOGRAFER") {
    redirect("/login");
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      <QueueDashboard />
    </div>
  );
}
