import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  Image as ImageIcon,
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ChevronRight,
  Download,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function CustomerGalleryListPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "PELANGGAN") {
    redirect("/login");
  }

  // Get completed bookings
  const bookings = await prisma.booking.findMany({
    where: { 
      userId: session.user.id,
      status: "COMPLETED",
      deletedAt: null
    },
    include: { package: true, payment: true },
    orderBy: { createdAt: "desc" },
  });

  const totalPhotos = bookings.length;
  const reviewedPhotos = bookings.filter(b => b.reviewComment !== null).length;
  const pendingReviewPhotos = totalPhotos - reviewedPhotos;

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Hasil Foto Sesi Anda
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Lihat soft file, pilih foto untuk dicetak fisik, dan isi ulasan untuk membuka akses download Google Drive.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Total Hasil Foto</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mt-2">{totalPhotos} Sesi</h3>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm border-l-4 border-l-emerald-500 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Akses Download Terbuka</p>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-455 mt-2">{reviewedPhotos} Sesi</h3>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm border-l-4 border-l-amber-500 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Menunggu Ulasan Anda</p>
          <h3 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-455 mt-2">{pendingReviewPhotos} Sesi</h3>
        </div>
      </div>

      {/* List Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Daftar Galeri</h3>

        {bookings.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-850 flex items-center justify-center mx-auto">
              <ImageIcon className="w-6 h-6 text-slate-400 dark:text-zinc-550 animate-pulse" />
            </div>
            <div>
              <p className="text-slate-700 dark:text-zinc-300 font-medium">Belum ada hasil foto yang tersedia</p>
              <p className="text-slate-400 dark:text-zinc-500 text-xs mt-1">
                Hasil foto digital akan muncul di sini setelah sesi foto Anda selesai di studio.
              </p>
            </div>
            <Link href="/dashboard" className="inline-block pt-2">
              <Button className="bg-indigo-650 hover:bg-indigo-700 text-white font-semibold rounded-xl cursor-pointer">
                Periksa Status Pemesanan
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4.5">
            {bookings.map((b) => {
              const hasReviewed = b.reviewComment !== null;
              const hasGDriveLink = b.gdriveLink !== null && b.gdriveLink !== "";
              
              return (
                <div key={b.id} className="group bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200/85 dark:border-zinc-800/85 hover:border-indigo-500/50 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-305 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Section: clickable title & details */}
                  <Link href={`/dashboard/${b.id}`} className="flex-1 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/10 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-5 h-5" />
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
                      </div>
                    </div>
                  </Link>

                  {/* Right Section: Status badge and action buttons */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t border-slate-100 dark:border-zinc-800/40 md:border-0 pt-3 md:pt-0 gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      {/* Review/Unlock status badge */}
                      {hasReviewed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/20">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Sudah Diulas (Akses Terbuka)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold uppercase tracking-wider bg-amber-100 text-amber-850 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/20">
                          <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          Ulas Sesi Untuk Unduh
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      {hasReviewed && hasGDriveLink ? (
                        <>
                          <a href={b.gdriveLink || "#"} target="_blank" rel="noopener noreferrer" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xxs rounded-xl flex items-center gap-1 transition-all shadow-sm">
                            Buka Google Drive
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <Link href={`/dashboard/${b.id}`} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-extrabold text-xxs rounded-xl flex items-center gap-0.5 transition-all">
                            Kelola Cetak Foto
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </>
                      ) : (
                        <Link href={`/dashboard/${b.id}`} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline transition flex items-center gap-0.5">
                          Lihat Galeri & Ulas
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
