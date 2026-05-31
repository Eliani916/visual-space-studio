import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportDashboardClient from "./ReportDashboardClient";
import { getPackagesForFilter } from "@/features/reports/actions/report.actions";

export const metadata = {
  title: "Laporan Keuangan | Admin Visual Space",
};

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Pre-fetch packages for the filter dropdown
  const packagesRes = await getPackagesForFilter();
  const filterPackages = packagesRes.success && packagesRes.data ? packagesRes.data : [];

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Laporan & Analitik Keuangan
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
          Pantau performa penjualan, ekspor data, dan evaluasi paket studio secara real-time.
        </p>
      </div>

      <ReportDashboardClient filterPackages={filterPackages} />
    </div>
  );
}
