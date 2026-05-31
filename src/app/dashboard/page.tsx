import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  Camera, 
  Sparkles,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "PELANGGAN") {
    redirect("/login");
  }

  // Get active bookings
  const bookings = await prisma.booking.findMany({
    where: { 
      userId: session.user.id,
      status: { in: ["PENDING", "CONFIRMED", "ON_PROGRESS"] },
      deletedAt: null
    },
    include: { package: true, payment: true },
    orderBy: { createdAt: "desc" },
  });

  // Calculate Stats for Active Bookings
  const totalActive = bookings.length;
  const pendingCount = bookings.filter(b => b.status === "PENDING").length;
  const confirmedCount = bookings.filter(b => b.status === "CONFIRMED").length;
  const onProgressCount = bookings.filter(b => b.status === "ON_PROGRESS").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/20";
      case "CONFIRMED":
        return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200/20";
      case "ON_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/20";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getPaymentBadge = (status?: string) => {
    switch (status) {
      case "PENDING":
        return "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-455 border border-orange-200/20";
      case "DP":
        return "bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400 border border-sky-200/20";
      case "LUNAS":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/20";
      case "GAGAL":
        return "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/20";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200/20";
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Booking Aktif Saya
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Pantau status pemesanan foto aktif Anda dan selesaikan pembayaran.
          </p>
        </div>
        <Link href="/booking">
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Booking Studio Baru
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-550 uppercase tracking-wider font-semibold">Total Booking Aktif</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mt-2">{totalActive}</h3>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm border-l-4 border-l-amber-500 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-550 uppercase tracking-wider font-semibold">Menunggu Pembayaran</p>
          <h3 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">{pendingCount}</h3>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm border-l-4 border-l-green-500 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-550 uppercase tracking-wider font-semibold">Terkonfirmasi</p>
          <h3 className="text-2xl sm:text-3xl font-black text-green-600 dark:text-green-400 mt-2">{confirmedCount}</h3>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm border-l-4 border-l-blue-500 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-550 uppercase tracking-wider font-semibold">Sedang Foto</p>
          <h3 className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">{onProgressCount}</h3>
        </div>
      </div>

      {/* Booking List Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Daftar Booking Aktif</h3>

        {bookings.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-850 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-slate-400 dark:text-zinc-500 animate-pulse" />
            </div>
            <div>
              <p className="text-slate-700 dark:text-zinc-300 font-medium">Tidak ada booking aktif saat ini</p>
              <p className="text-slate-400 dark:text-zinc-500 text-xs mt-1">
                Silakan buat booking baru untuk memesan slot pemotretan.
              </p>
            </div>
            <Link href="/booking" className="inline-block pt-2">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl cursor-pointer">
                Booking Studio Sekarang
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4.5">
            {bookings.map((b) => (
              <Link key={b.id} href={`/dashboard/${b.id}`}>
                <div className="group bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200/85 dark:border-zinc-800/85 hover:border-indigo-500/50 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/10 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-white group-hover:text-indigo-500 transition duration-200">{b.package.name}</h4>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-455 dark:text-zinc-400 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(b.bookingDate).toLocaleDateString("id-ID", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {b.bookingTime}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-500 dark:text-zinc-400">
                          Total: Rp {Number(b.totalPrice).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t border-slate-100 dark:border-zinc-800/40 md:border-0 pt-3 md:pt-0 gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xxs font-bold uppercase tracking-wider ${getStatusBadge(b.status)}`}>
                        Booking: {b.status === "PENDING" ? "MENUNGGU" : b.status === "CONFIRMED" ? "DIKONFIRMASI" : "SEDANG FOTO"}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xxs font-bold uppercase tracking-wider ${getPaymentBadge(b.payment?.status)}`}>
                        Bayar: {b.payment?.status === "LUNAS" ? "LUNAS" : b.payment?.status === "DP" ? "DP 50%" : b.payment?.status === "PENDING" ? "BELUM BAYAR" : "GAGAL"}
                      </span>
                    </div>

                    <span className="text-xs text-indigo-550 dark:text-indigo-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Detail Sesi
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
