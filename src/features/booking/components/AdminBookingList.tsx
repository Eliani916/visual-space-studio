"use client";

import { useEffect, useState } from "react";
import { getAdminBookings, confirmPendingCashBooking, confirmRemainingCashPayment } from "../actions/admin-booking.actions";
import { checkInCustomer } from "@/features/queue/actions/queue.actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ChevronDown, Wallet, Check, Clock, CreditCard, List, RefreshCw } from "lucide-react";

export default function AdminBookingList() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");

  const fetchBookings = async () => {
    setLoading(true);
    const res = await getAdminBookings();
    if (res.success) {
      setBookings(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCheckIn = async (bookingId: string) => {
    if (!confirm("Check-in pelanggan ini ke antrean?")) return;
    const res = await checkInCustomer(bookingId);
    if (res.success) {
      toast.success(res.message);
      fetchBookings();
    } else {
      toast.error(res.message);
    }
  };

  const handleConfirmPendingCash = async (bookingId: string) => {
    if (!confirm("Konfirmasi pembayaran cash dan check-in pelanggan ini?")) return;
    const res = await confirmPendingCashBooking(bookingId);
    if (res.success) {
      toast.success(res.message);
      fetchBookings();
    } else {
      toast.error(res.message);
    }
  };

  const handleConfirmRemainingCash = async (bookingId: string) => {
    if (!confirm("Selesaikan pelunasan sisa pembayaran cash untuk booking ini?")) return;
    const res = await confirmRemainingCashPayment(bookingId);
    if (res.success) {
      toast.success(res.message);
      fetchBookings();
    } else {
      toast.error(res.message);
    }
  };

  // Stats calculation
  const getStats = () => {
    let menungguDp = 0;
    let dikonfirmasi = 0;
    let dalamProses = 0;
    let lunas = 0;
    let totalBookings = bookings.length;

    bookings.forEach((b) => {
      if (b.status === "PENDING") {
        menungguDp++;
      }
      if (b.status === "CONFIRMED") {
        dikonfirmasi++;
      }
      if (b.status === "ON_PROGRESS") {
        dalamProses++;
      }
      if (b.payment?.status === "LUNAS") {
        lunas++;
      }
    });

    return { menungguDp, dikonfirmasi, dalamProses, lunas, totalBookings };
  };

  const stats = getStats();

  // Filter logic
  const filteredBookings = bookings.filter((b) => {
    // 1. Search Query Filter (name, email, package name)
    const query = searchQuery.toLowerCase().trim();
    if (query !== "") {
      const nameMatch = b.user?.name?.toLowerCase().includes(query);
      const emailMatch = b.user?.email?.toLowerCase().includes(query);
      const pkgMatch = b.package?.name?.toLowerCase().includes(query);
      if (!nameMatch && !emailMatch && !pkgMatch) {
        return false;
      }
    }

    // 2. Status Filter
    if (statusFilter !== "ALL") {
      if (statusFilter === "PENDING" && b.status !== "PENDING") return false;
      if (statusFilter === "CONFIRMED" && b.status !== "CONFIRMED") return false;
      if (statusFilter === "ON_PROGRESS" && b.status !== "ON_PROGRESS") return false;
      if (statusFilter === "COMPLETED" && b.status !== "COMPLETED") return false;
      if (statusFilter === "EXPIRED" && b.status !== "EXPIRED") return false;
      if (statusFilter === "CANCELLED" && b.status !== "CANCELLED") return false;
    }

    // 3. Date Filter
    if (dateFilter !== "ALL") {
      const bookingDate = new Date(b.bookingDate);
      const today = new Date();
      
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const bookingStart = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
      
      const diffTime = bookingStart.getTime() - todayStart.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (dateFilter === "TODAY") {
        if (diffDays !== 0) return false;
      } else if (dateFilter === "TOMORROW") {
        if (diffDays !== 1) return false;
      } else if (dateFilter === "WEEK") {
        // Current calendar week (Monday to Sunday)
        const currentDay = today.getDay();
        const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(todayStart);
        monday.setDate(todayStart.getDate() + distanceToMonday);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        if (bookingStart < monday || bookingStart > sunday) {
          return false;
        }
      } else if (dateFilter === "MONTH") {
        if (bookingDate.getMonth() !== today.getMonth() || bookingDate.getFullYear() !== today.getFullYear()) {
          return false;
        }
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900/40 p-4 rounded-2xl border border-slate-200/60 dark:border-zinc-800/40 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Daftar Booking</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Kelola jadwal booking dan antrean pelanggan secara real-time</p>
        </div>
        <Button onClick={fetchBookings} disabled={loading} variant="outline" size="sm" className="gap-2 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Card 1: MENUNGGU DP */}
        <div className="bg-slate-900 dark:bg-zinc-900 border border-slate-805 dark:border-zinc-800 text-white p-5 rounded-2xl flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.02] hover:border-slate-700 shadow-lg">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            <span>MENUNGGU DP</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight mt-2 text-white">
            {stats.menungguDp}
          </div>
        </div>

        {/* Card 2: DIKONFIRMASI */}
        <div className="bg-slate-900 dark:bg-zinc-900 border border-slate-805 dark:border-zinc-800 text-white p-5 rounded-2xl flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.02] hover:border-slate-700 shadow-lg">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            <span>DIKONFIRMASI</span>
            <Check className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight mt-2 text-white">
            {stats.dikonfirmasi}
          </div>
        </div>

        {/* Card 3: DALAM PROSES */}
        <div className="bg-slate-900 dark:bg-zinc-900 border border-slate-805 dark:border-zinc-800 text-white p-5 rounded-2xl flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.02] hover:border-slate-700 shadow-lg">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            <span>DALAM PROSES</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight mt-2 text-white">
            {stats.dalamProses}
          </div>
        </div>

        {/* Card 4: LUNAS */}
        <div className="bg-slate-900 dark:bg-zinc-900 border border-slate-805 dark:border-zinc-800 text-white p-5 rounded-2xl flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.02] hover:border-slate-700 shadow-lg">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            <span>LUNAS</span>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight mt-2 text-white">
            {stats.lunas}
          </div>
        </div>

        {/* Card 5: TOTAL BOOKINGS */}
        <div className="bg-slate-900 dark:bg-zinc-900 border border-slate-805 dark:border-zinc-800 text-white p-5 rounded-2xl flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.02] hover:border-slate-700 shadow-lg">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            <span>TOTAL BOOKINGS</span>
            <List className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight mt-2 text-white">
            {stats.totalBookings}
          </div>
        </div>
      </div>

      {/* FILTER ROW */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="CARI ARSIP: NAMA, EMAIL, PAKET..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 rounded-full text-xs font-semibold uppercase tracking-wider focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all dark:bg-zinc-900 dark:border-zinc-850/80"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative w-full md:w-auto text-white">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none w-full md:w-56 h-11 px-6 pr-10 bg-slate-900 border border-slate-800 text-white rounded-full text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer dark:bg-zinc-900 dark:border-zinc-850/80"
          >
            <option value="ALL">SEMUA STATUS</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">DIKONFIRMASI</option>
            <option value="ON_PROGRESS">DALAM PROSES</option>
            <option value="COMPLETED">SELESAI</option>
            <option value="EXPIRED">KEDALUWARSA</option>
            <option value="CANCELLED">DIBATALKAN</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-455 pointer-events-none" />
        </div>

        {/* Date Dropdown */}
        <div className="relative w-full md:w-auto text-white">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="appearance-none w-full md:w-56 h-11 px-6 pr-10 bg-slate-900 border border-slate-800 text-white rounded-full text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer dark:bg-zinc-900 dark:border-zinc-850/80"
          >
            <option value="ALL">SEMUA TANGGAL</option>
            <option value="TODAY">HARI INI</option>
            <option value="TOMORROW">BESOK</option>
            <option value="WEEK">MINGGU INI</option>
            <option value="MONTH">BULAN INI</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-455 pointer-events-none" />
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="border rounded-2xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
              <TableHead className="font-semibold text-slate-700 dark:text-zinc-300">Tgl / Jam</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-zinc-300">Pelanggan</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-zinc-300">Paket</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-zinc-300">Status Booking</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-zinc-300">Pembayaran</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-zinc-300 text-right">Aksi (Antrean)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500 dark:text-zinc-400">Loading...</TableCell>
              </TableRow>
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500 dark:text-zinc-400">Belum ada booking.</TableCell>
              </TableRow>
            ) : filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500 dark:text-zinc-400">Tidak ada booking yang sesuai dengan kriteria filter.</TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((b) => (
                <TableRow key={b.id} className="border-b border-slate-100 dark:border-zinc-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <TableCell>
                    {new Date(b.bookingDate).toLocaleDateString('id-ID')} <br/>
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">{b.bookingTime}</span>
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="text-slate-800 dark:text-zinc-200">{b.user.name}</span> <br/>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">{b.user.email}</span>
                  </TableCell>
                  <TableCell className="text-slate-700 dark:text-zinc-300">{b.package.name}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/30' :
                      b.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/30' :
                      b.status === 'ON_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/30' :
                      b.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/30' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/30'
                    }`}>
                      {b.status === 'PENDING' ? 'PENDING' :
                       b.status === 'CONFIRMED' ? 'DIKONFIRMASI' :
                       b.status === 'ON_PROGRESS' ? 'PROSES' :
                       b.status === 'COMPLETED' ? 'SELESAI' :
                       b.status === 'EXPIRED' ? 'KEDALUWARSA' : 'DIBATALKAN'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {b.payment ? (
                      <div className="text-slate-700 dark:text-zinc-300 text-xs">
                        <span className="font-semibold uppercase">{b.payment.method}</span> - <span className={`font-bold ${b.payment.status === 'LUNAS' ? 'text-emerald-650 dark:text-emerald-450' : 'text-amber-500 dark:text-amber-400'}`}>{b.payment.status}</span>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {b.status === 'PENDING' && b.payment?.method === 'CASH' && (
                      <Button size="sm" onClick={() => handleConfirmPendingCash(b.id)} className="h-8 text-xs font-semibold px-4 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white border-0">Konfirmasi & Check-In (Cash)</Button>
                    )}
                    {b.payment?.status === 'DP' && (
                      <Button size="sm" onClick={() => handleConfirmRemainingCash(b.id)} className="h-8 text-xs font-semibold px-4 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white border-0">Selesaikan Pembayaran Cash</Button>
                    )}
                    {b.status === 'CONFIRMED' && !b.queue && (
                      <Button size="sm" onClick={() => handleCheckIn(b.id)} className="h-8 text-xs font-semibold px-4 cursor-pointer">Check-In</Button>
                    )}
                    {b.queue && (
                      <span className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 px-2.5 py-1 rounded-full">Antrean ({b.queue.status})</span>
                    )}
                    {!b.queue && b.status !== 'CONFIRMED' && !(b.status === 'PENDING' && b.payment?.method === 'CASH') && b.payment?.status !== 'DP' && (
                      <span className="text-xs text-slate-400 dark:text-zinc-550">Tidak ada aksi</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
