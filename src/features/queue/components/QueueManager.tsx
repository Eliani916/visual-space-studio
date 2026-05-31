"use client";

import { useEffect, useState } from "react";
import { getQueueSessions, updateQueueStatus, checkInCustomer } from "../actions/queue.actions";
import { getPusherClient } from "@/lib/pusher";
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
import { List, Clock, Camera, CheckCircle2, Calendar, RefreshCw, Search } from "lucide-react";

export default function QueueManager() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"TODAY" | "TOMORROW" | "UPCOMING" | "ALL">("TODAY");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSessions = async () => {
    setLoading(true);
    const res = await getQueueSessions();
    if (res.success) {
      setSessions(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();

    const pusher = getPusherClient();
    const channel = pusher.subscribe("photographer-dashboard");

    channel.bind("queue-updated", () => {
      fetchSessions();
      toast.info("Pembaruan antrean diterima secara real-time");
    });

    return () => {
      pusher.unsubscribe("photographer-dashboard");
    };
  }, []);

  const handleCheckIn = async (bookingId: string) => {
    if (!confirm("Check-in pelanggan ini ke antrean?")) return;
    setActionLoading(true);
    const res = await checkInCustomer(bookingId);
    if (res.success) {
      toast.success(res.message || "Check-in berhasil.");
      fetchSessions();
    } else {
      toast.error(res.message || "Gagal check-in.");
    }
    setActionLoading(false);
  };

  const handleStartSession = async (queueId: string) => {
    setActionLoading(true);
    const res = await updateQueueStatus(queueId, "IN_PROGRESS");
    if (res.success) {
      toast.success("Sesi foto dimulai.");
      fetchSessions();
    } else {
      toast.error(res.message || "Gagal memulai sesi.");
    }
    setActionLoading(false);
  };

  const handleFinishSession = async (queueId: string) => {
    setActionLoading(true);
    const res = await updateQueueStatus(queueId, "FINISHED");
    if (res.success) {
      toast.success("Sesi foto selesai.");
      fetchSessions();
    } else {
      toast.error(res.message || "Gagal menyelesaikan sesi.");
    }
    setActionLoading(false);
  };

  // 1. Time Tab Filtering
  const tabFilteredSessions = sessions.filter((s) => {
    const sDate = new Date(s.bookingDate);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const sStart = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate());
    const diffTime = sStart.getTime() - todayStart.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (activeTab === "TODAY") {
      return diffDays === 0;
    } else if (activeTab === "TOMORROW") {
      return diffDays === 1;
    } else if (activeTab === "UPCOMING") {
      return diffDays > 1;
    }
    return true; // "ALL"
  });

  // 2. Stats calculation based on tabFilteredSessions
  const getStats = () => {
    let totalSesi = tabFilteredSessions.length;
    let menunggu = 0;
    let sesiAktif = 0;
    let selesai = 0;
    let dijadwalkan = 0;

    tabFilteredSessions.forEach((s) => {
      if (s.queue?.status === "WAITING") {
        menunggu++;
      } else if (s.queue?.status === "IN_PROGRESS") {
        sesiAktif++;
      } else if (s.queue?.status === "FINISHED" || s.status === "COMPLETED") {
        selesai++;
      } else if (s.status === "CONFIRMED" && !s.queue) {
        dijadwalkan++;
      }
    });

    return { totalSesi, menunggu, sesiAktif, selesai, dijadwalkan };
  };

  const stats = getStats();

  // 3. Search query filtering on top of tabFilteredSessions
  const finalFilteredSessions = tabFilteredSessions.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    if (query === "") return true;

    const nameMatch = s.user?.name?.toLowerCase().includes(query);
    const emailMatch = s.user?.email?.toLowerCase().includes(query);
    const pkgMatch = s.package?.name?.toLowerCase().includes(query);
    return nameMatch || emailMatch || pkgMatch;
  });

  return (
    <div className="space-y-6">
      {/* HEADER ROW */}
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900/40 p-4 rounded-2xl border border-slate-200/60 dark:border-zinc-800/40 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Manajemen Antrean</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Pantau dan kelola urutan sesi pemotretan pelanggan secara real-time</p>
        </div>
        <Button onClick={fetchSessions} disabled={loading || actionLoading} variant="outline" size="sm" className="gap-2 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Sesi
        </Button>
      </div>

      {/* TIME TABS / PILLS */}
      <div className="flex flex-wrap gap-2 pb-1">
        <button
          onClick={() => setActiveTab("TODAY")}
          className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            activeTab === "TODAY"
              ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] scale-105"
              : "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          Hari Ini
        </button>
        <button
          onClick={() => setActiveTab("TOMORROW")}
          className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            activeTab === "TOMORROW"
              ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] scale-105"
              : "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          Besok
        </button>
        <button
          onClick={() => setActiveTab("UPCOMING")}
          className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            activeTab === "UPCOMING"
              ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] scale-105"
              : "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          Mendatang
        </button>
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            activeTab === "ALL"
              ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] scale-105"
              : "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          Semua Sesi
        </button>
      </div>

      <hr className="border-slate-200 dark:border-zinc-800 my-2" />

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Card 1: TOTAL SESI */}
        <div className="bg-slate-900 dark:bg-zinc-900 border border-slate-800 dark:border-zinc-800 text-white p-5 rounded-2xl flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.02] shadow-lg">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            <span>Total Sesi</span>
            <List className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight mt-2">
            {stats.totalSesi}
          </div>
        </div>

        {/* Card 2: MENUNGGU */}
        <div className="bg-slate-900 dark:bg-zinc-900 border border-slate-800 dark:border-zinc-800 text-white p-5 rounded-2xl flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.02] shadow-lg">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            <span>Menunggu</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight mt-2">
            {stats.menunggu}
          </div>
        </div>

        {/* Card 3: SESI AKTIF (ORANGE GLOW) */}
        <div className="bg-slate-900 dark:bg-zinc-900 border border-orange-500/80 text-white p-5 rounded-2xl flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(249,115,22,0.2)]">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-orange-500 uppercase">
            <span>Sesi Aktif</span>
            <Camera className="w-4 h-4 text-orange-500 animate-pulse" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight mt-2 text-orange-500">
            {stats.sesiAktif}
          </div>
        </div>

        {/* Card 4: SELESAI */}
        <div className="bg-slate-900 dark:bg-zinc-900 border border-slate-800 dark:border-zinc-800 text-white p-5 rounded-2xl flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.02] shadow-lg">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            <span>Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight mt-2">
            {stats.selesai}
          </div>
        </div>

        {/* Card 5: DIJADWALKAN */}
        <div className="bg-slate-900 dark:bg-zinc-900 border border-slate-800 dark:border-zinc-800 text-white p-5 rounded-2xl flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.02] shadow-lg">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            <span>Dijadwalkan</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight mt-2">
            {stats.dijadwalkan}
          </div>
        </div>
      </div>

      {/* SEARCH BOX FOR SESSIONS */}
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari Sesi Antrean: Nama, Email, Paket..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-11 pr-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 rounded-full text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
        />
      </div>

      {/* TABLE SECTION */}
      <div className="border rounded-2xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
              <TableHead className="font-semibold text-slate-700 dark:text-zinc-300">Tgl & Waktu Sesi</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-zinc-300">Pelanggan</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-zinc-300">Paket</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-zinc-300">Status Antrean</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-zinc-300 text-right">Aksi Manajemen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500 dark:text-zinc-400">Loading data antrean...</TableCell>
              </TableRow>
            ) : tabFilteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500 dark:text-zinc-400">Tidak ada sesi untuk kategori filter waktu ini.</TableCell>
              </TableRow>
            ) : finalFilteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500 dark:text-zinc-400">Tidak ada sesi yang cocok dengan kata kunci pencarian.</TableCell>
              </TableRow>
            ) : (
              finalFilteredSessions.map((s) => {
                return (
                  <TableRow key={s.id} className="border-b border-slate-100 dark:border-zinc-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <TableCell>
                      {new Date(s.bookingDate).toLocaleDateString('id-ID')} <br/>
                      <span className="font-semibold text-slate-700 dark:text-zinc-300">{s.bookingTime}</span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="text-slate-800 dark:text-zinc-200">{s.user.name}</span> <br/>
                      <span className="text-xs text-slate-500 dark:text-zinc-400">{s.user.email}</span>
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-zinc-300">{s.package.name}</TableCell>
                    <TableCell>
                      {!s.queue ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200/50 dark:border-zinc-700/50">
                          DIJADWALKAN
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          s.queue.status === 'WAITING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/30' :
                          s.queue.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200/30 font-extrabold animate-pulse' :
                          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/30'
                        }`}>
                          {s.queue.status === 'WAITING' ? 'MENUNGGU' :
                           s.queue.status === 'IN_PROGRESS' ? 'SEDANG FOTO' : 'SELESAI FOTO'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* 1. If not in queue (and is confirmed) -> Check-In */}
                        {s.status === "CONFIRMED" && !s.queue && (
                          <Button
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleCheckIn(s.id)}
                            className="h-8 text-xs font-semibold px-4 cursor-pointer"
                          >
                            Check-In
                          </Button>
                        )}
                        
                        {/* 2. If in queue and WAITING -> Mulai Sesi */}
                        {s.queue?.status === "WAITING" && (
                          <Button
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleStartSession(s.queue.id)}
                            className="h-8 text-xs font-semibold px-4 bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
                          >
                            Mulai Sesi
                          </Button>
                        )}

                        {/* 3. If in queue and IN_PROGRESS -> Selesai Foto */}
                        {s.queue?.status === "IN_PROGRESS" && (
                          <Button
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleFinishSession(s.queue.id)}
                            className="h-8 text-xs font-semibold px-4 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          >
                            Selesai Foto
                          </Button>
                        )}

                        {/* 4. If queue is FINISHED / COMPLETED */}
                        {(s.queue?.status === "FINISHED" || s.status === "COMPLETED") && (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 px-3 py-1 rounded-full">Selesai</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
