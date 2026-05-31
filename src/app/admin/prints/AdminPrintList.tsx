"use client";

import { useEffect, useState } from "react";
import { getAdminPrintBookings, updatePrintStatus } from "@/features/gallery/actions/gallery.actions";
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
import { Printer, Truck, CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";

export default function AdminPrintList() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrintBookings = async () => {
    setLoading(true);
    const res = await getAdminPrintBookings();
    if (res.success) {
      setBookings(res.data || []);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrintBookings();
  }, []);

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    const res = await updatePrintStatus(bookingId, status);
    if (res.success) {
      toast.success(res.message);
      fetchPrintBookings();
    } else {
      toast.error(res.message);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/20";
      case "SEDANG_DICETAK":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/20";
      case "DALAM_PENGIRIMAN":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/20";
      case "SELESAI":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/20";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/60 dark:text-slate-500 border border-slate-200/20";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "PENDING":
        return "Menunggu Cetak";
      case "SEDANG_DICETAK":
        return "Sedang Dicetak";
      case "DALAM_PENGIRIMAN":
        return "Dalam Pengiriman";
      case "SELESAI":
        return "Selesai";
      default:
        return "Belum Diajukan";
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Kelola Cetak Foto Pelanggan</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Lihat daftar file foto pilihan pelanggan, alamat pengiriman, dan perbarui proses pencetakan & kurir.
          </p>
        </div>
        <Button onClick={fetchPrintBookings} disabled={loading} variant="outline" size="sm" className="gap-2 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* TABLE */}
      <div className="border rounded-2xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
              <TableHead className="font-semibold text-slate-705 dark:text-zinc-300">Pelanggan</TableHead>
              <TableHead className="font-semibold text-slate-705 dark:text-zinc-300">Paket (Limit)</TableHead>
              <TableHead className="font-semibold text-slate-705 dark:text-zinc-300">Pilihan Foto & Drive</TableHead>
              <TableHead className="font-semibold text-slate-705 dark:text-zinc-300">Alamat Pengiriman</TableHead>
              <TableHead className="font-semibold text-slate-705 dark:text-zinc-300">Status Cetak</TableHead>
              <TableHead className="font-semibold text-slate-705 dark:text-zinc-300 text-right">Aksi Manajemen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500 dark:text-zinc-400">Memuat permintaan cetak...</TableCell>
              </TableRow>
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500 dark:text-zinc-450 italic">
                  Belum ada pelanggan yang mengajukan foto untuk dicetak fisik.
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((b) => (
                <TableRow key={b.id} className="border-b border-slate-100 dark:border-zinc-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <TableCell className="align-top">
                    <span className="font-bold text-slate-800 dark:text-zinc-200">{b.user.name}</span> <br/>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">{b.user.email}</span> <br/>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">{b.user.phoneNumber || "-"}</span>
                  </TableCell>
                  <TableCell className="align-top">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">{b.package.name}</span> <br/>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{b.package.printCount} Lembar</span>
                  </TableCell>
                  <TableCell className="align-top max-w-[220px]">
                    {b.printPhotos ? (
                      <div className="grid grid-cols-3 gap-1.5 mb-2">
                        {b.printPhotos.split(",").map((src: string, idx: number) => (
                          <a href={src} target="_blank" rel="noopener noreferrer" key={idx} className="relative aspect-square border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm hover:ring-2 hover:ring-indigo-500 transition block cursor-zoom-in group" title={`Buka Foto ${idx + 1}`}>
                            <img src={src} alt={`Print ${idx + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xxs text-slate-455 dark:text-zinc-550 italic mb-2">
                        Belum ada foto diunggah
                      </div>
                    )}
                    {b.gdriveLink && (
                      <a href={b.gdriveLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xxs font-bold text-indigo-650 hover:underline">
                        Buka Drive Sesi
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="align-top max-w-[220px] text-xs text-slate-650 dark:text-zinc-300 whitespace-pre-wrap">
                    {b.shippingAddress || "-"}
                  </TableCell>
                  <TableCell className="align-top">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xxs font-bold uppercase tracking-wider ${getStatusBadge(b.printStatus)}`}>
                      {b.printStatus === "PENDING" && <AlertCircle className="w-3.5 h-3.5" />}
                      {b.printStatus === "SEDANG_DICETAK" && <Printer className="w-3.5 h-3.5" />}
                      {b.printStatus === "DALAM_PENGIRIMAN" && <Truck className="w-3.5 h-3.5" />}
                      {b.printStatus === "SELESAI" && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {getStatusText(b.printStatus)}
                    </span>
                  </TableCell>
                  <TableCell className="align-top text-right space-y-2">
                    {b.printStatus === "PENDING" && (
                      <Button size="sm" onClick={() => handleStatusUpdate(b.id, "SEDANG_DICETAK")} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer w-full sm:w-auto h-8 text-xs rounded-xl">
                        Mulai Cetak
                      </Button>
                    )}
                    {b.printStatus === "SEDANG_DICETAK" && (
                      <Button size="sm" onClick={() => handleStatusUpdate(b.id, "DALAM_PENGIRIMAN")} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer w-full sm:w-auto h-8 text-xs rounded-xl">
                        Kirim Cetakan
                      </Button>
                    )}
                    {b.printStatus === "DALAM_PENGIRIMAN" && (
                      <Button size="sm" onClick={() => handleStatusUpdate(b.id, "SELESAI")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer w-full sm:w-auto h-8 text-xs rounded-xl">
                        Selesai Kirim
                      </Button>
                    )}
                    {b.printStatus === "SELESAI" && (
                      <span className="text-xs font-bold text-slate-400 dark:text-zinc-550">Telah Selesai</span>
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
