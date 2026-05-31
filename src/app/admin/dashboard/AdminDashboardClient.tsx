"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight,
  TrendingDown,
  DollarSign
} from "lucide-react";

interface PaymentItem {
  amount: number;
  createdAt: string;
}

interface BookingItem {
  id: string;
  user: { name: string };
  package: { name: string };
  bookingDate: string;
  bookingTime: string;
  status: string;
}

interface AdminDashboardClientProps {
  totalRevenue: number;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  recentBookings: BookingItem[];
  payments: PaymentItem[];
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
];

export default function AdminDashboardClient({
  totalRevenue,
  totalBookings,
  completedBookings,
  pendingBookings,
  recentBookings,
  payments
}: AdminDashboardClientProps) {
  // Extract all unique years from payments
  const years = Array.from(
    new Set(
      payments.map((p) => new Date(p.createdAt).getFullYear())
    )
  ).sort((a, b) => b - a); // descending

  // If no payments exist, default to current year
  const currentYearDefault = years.length > 0 ? years[0] : new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYearDefault);

  // Filter payments for the selected year
  const paymentsForYear = payments.filter(
    (p) => new Date(p.createdAt).getFullYear() === selectedYear
  );

  // Group by month (0-11)
  const monthlyRevenue = Array(12).fill(0);
  paymentsForYear.forEach((p) => {
    const month = new Date(p.createdAt).getMonth();
    monthlyRevenue[month] += p.amount;
  });

  const yearTotalRevenue = monthlyRevenue.reduce((sum, val) => sum + val, 0);
  const activeMonthsCount = monthlyRevenue.filter(v => v > 0).length || 1;
  const yearMonthlyAverage = yearTotalRevenue / 12;

  const maxMonthlyRevenue = Math.max(...monthlyRevenue, 1000000); // at least 1,000,000 for scaling

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Dashboard Analitik</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-semibold">
          Ringkasan performa finansial, volume pemesanan, dan aktivitas terbaru di studio.
        </p>
      </div>

      {/* Top Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Revenue */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-205 dark:border-zinc-800/80 shadow-sm flex items-center gap-4.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Total Pendapatan</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
              Rp {totalRevenue.toLocaleString("id-ID")}
            </h3>
          </div>
        </div>

        {/* Card 2: Total Bookings */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-205 dark:border-zinc-800/80 shadow-sm flex items-center gap-4.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Total Booking</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
              {totalBookings} Sesi
            </h3>
          </div>
        </div>

        {/* Card 3: Completed Bookings */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-205 dark:border-zinc-800/80 shadow-sm flex items-center gap-4.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Sesi Selesai</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
              {completedBookings} Sesi
            </h3>
          </div>
        </div>

        {/* Card 4: Pending Bookings */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-205 dark:border-zinc-800/80 shadow-sm flex items-center gap-4.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Belum Bayar</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
              {pendingBookings} Booking
            </h3>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-zinc-800/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800/60 pb-5">
          <div>
            <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Grafik Pemasukan Bulanan
            </h3>
            <p className="text-xxs text-slate-400 dark:text-zinc-550 font-bold uppercase tracking-wider mt-0.5">
              Tahun: {selectedYear} &bull; Total: Rp {yearTotalRevenue.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Year Selector */}
            {years.length > 0 ? (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="flex h-9 w-28 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 font-bold"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    Tahun {y}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-slate-400 font-semibold">Tahun {selectedYear}</span>
            )}
          </div>
        </div>

        {/* Stat Highlights on selected year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-zinc-950/20 p-4 rounded-2xl border border-slate-100 dark:border-zinc-850/50">
          <div className="text-xs">
            <span className="text-slate-400 dark:text-zinc-500 block font-semibold mb-1">Rata-rata Pendapatan Bulanan</span>
            <span className="font-black text-sm text-slate-700 dark:text-zinc-300">
              Rp {Math.round(yearMonthlyAverage).toLocaleString("id-ID")}
            </span>
          </div>
          <div className="text-xs">
            <span className="text-slate-400 dark:text-zinc-500 block font-semibold mb-1">Pemasukan Tahun Ini</span>
            <span className="font-black text-sm text-indigo-600 dark:text-indigo-400">
              Rp {yearTotalRevenue.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Custom SVG/Tailwind Bar Chart */}
        <div className="relative w-full h-80 flex flex-col justify-end pt-10">
          {/* Grid lines (Background) */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-10">
            <div className="border-t border-dashed border-slate-100 dark:border-zinc-800/40 w-full relative">
              <span className="absolute -top-2.5 right-0 text-[9px] font-bold text-slate-400 dark:text-zinc-600">
                Rp {Math.round(maxMonthlyRevenue).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="border-t border-dashed border-slate-100 dark:border-zinc-800/40 w-full relative">
              <span className="absolute -top-2.5 right-0 text-[9px] font-bold text-slate-400 dark:text-zinc-600">
                Rp {Math.round(maxMonthlyRevenue * 0.75).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="border-t border-dashed border-slate-100 dark:border-zinc-800/40 w-full relative">
              <span className="absolute -top-2.5 right-0 text-[9px] font-bold text-slate-400 dark:text-zinc-600">
                Rp {Math.round(maxMonthlyRevenue * 0.5).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="border-t border-dashed border-slate-100 dark:border-zinc-800/40 w-full relative">
              <span className="absolute -top-2.5 right-0 text-[9px] font-bold text-slate-400 dark:text-zinc-600">
                Rp {Math.round(maxMonthlyRevenue * 0.25).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Bar Columns Container */}
          <div className="relative w-full h-full flex items-end justify-between gap-1 sm:gap-2 z-10 pb-8">
            {monthlyRevenue.map((val, idx) => {
              const percent = (val / maxMonthlyRevenue) * 100;
              return (
                <div 
                  key={idx} 
                  className="group flex flex-col items-center flex-1 h-full justify-end relative"
                >
                  {/* Tooltip on Hover */}
                  <div className="group-hover:opacity-100 opacity-0 absolute -top-8 bg-slate-950 dark:bg-zinc-850 border border-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded-xl shadow-lg pointer-events-none transition-opacity duration-200 whitespace-nowrap z-20">
                    Rp {val.toLocaleString("id-ID")}
                  </div>

                  {/* Vertical bar */}
                  <div 
                    style={{ height: `${Math.max(percent, 2)}%` }} // minimum 2% height so it has clickable target
                    className={`w-full max-w-[32px] rounded-t-md transition-all duration-300 hover:scale-x-105 ${
                      val > 0 
                        ? "bg-gradient-to-t from-indigo-500/80 to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:from-indigo-600 hover:to-purple-550 cursor-pointer" 
                        : "bg-slate-100 dark:bg-zinc-800/60"
                    }`}
                  />
                  
                  {/* Axis Label */}
                  <span className="absolute bottom-[-24px] text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-tight">
                    {MONTH_LABELS[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Bookings Section */}
      <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-zinc-800/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Pemesanan Terbaru
          </h3>
          
          <Link 
            href="/admin/bookings" 
            className="text-xs font-bold text-indigo-550 dark:text-indigo-400 hover:underline transition flex items-center gap-0.5"
          >
            Semua Booking
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700">
                  <th className="px-5 py-3">Pelanggan</th>
                  <th className="px-5 py-3">Paket</th>
                  <th className="px-5 py-3">Jadwal Foto</th>
                  <th className="px-5 py-3 text-right">Status Sesi</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => {
                  const statusColors = 
                    b.status === "COMPLETED" ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/20" :
                    b.status === "PENDING" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/20" :
                    "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200/20";
                  
                  return (
                    <tr key={b.id} className="border-b last:border-0 border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 transition duration-150">
                      <td className="px-5 py-4 font-bold text-slate-800 dark:text-zinc-200">{b.user.name}</td>
                      <td className="px-5 py-4 text-slate-650 dark:text-zinc-350">{b.package.name}</td>
                      <td className="px-5 py-4 text-slate-500 dark:text-zinc-400">
                        {new Date(b.bookingDate).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}{" "}
                        &bull; {b.bookingTime}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusColors}`}>
                          {b.status === "PENDING" ? "MENUNGGU" : b.status === "CONFIRMED" ? "DIKONFIRMASI" : b.status === "ON_PROGRESS" ? "SEDANG FOTO" : b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {recentBookings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-zinc-500 italic">
                      Belum ada data booking.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
