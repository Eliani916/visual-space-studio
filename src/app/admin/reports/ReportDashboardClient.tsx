"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  CalendarDays, 
  Download, 
  FileText, 
  FileSpreadsheet,
  TrendingUp,
  WalletCards,
  PackageCheck,
  CreditCard,
  Loader2,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReportData, ReportFilter } from "@/features/reports/actions/report.actions";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Dynamic import for client-side only libs
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ReportDashboardClientProps {
  filterPackages: { id: string; name: string }[];
}

export default function ReportDashboardClient({ filterPackages }: ReportDashboardClientProps) {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<{
    bookings: any[];
    summary: {
      totalGrossRevenue: number;
      totalNetRevenue: number;
      totalTransactions: number;
      topPackages: { name: string; count: number }[];
    };
  } | null>(null);

  // Filters State
  const [filters, setFilters] = useState<ReportFilter>({
    startDate: "",
    endDate: "",
    paymentStatus: "ALL",
    bookingStatus: "ALL",
    packageId: "ALL",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await getReportData(filters);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      toast.error(res.message || "Gagal memuat data laporan");
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key: keyof ReportFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      paymentStatus: "ALL",
      bookingStatus: "ALL",
      packageId: "ALL",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LUNAS":
      case "COMPLETED":
      case "CONFIRMED":
        return <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">{status}</span>;
      case "DP":
      case "ON_PROGRESS":
        return <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-bold">{status}</span>;
      case "PENDING":
        return <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold">{status}</span>;
      case "CANCELLED":
      case "EXPIRED":
      case "GAGAL":
        return <span className="px-2 py-1 rounded bg-rose-100 text-rose-800 text-xs font-bold">{status}</span>;
      default:
        return <span className="px-2 py-1 rounded bg-slate-100 text-slate-800 text-xs font-bold">{status}</span>;
    }
  };

  // EXPORT TO PDF
  const handleExportPDF = () => {
    if (!data || data.bookings.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    setExporting(true);
    try {
      const doc = new jsPDF("landscape");
      
      // Header
      doc.setFontSize(18);
      doc.text("Laporan Keuangan & Transaksi Visual Space", 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Dicetak pada: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}`, 14, 30);
      
      // Filter Info
      let filterText = "Filter: ";
      if (filters.startDate || filters.endDate) filterText += `${filters.startDate || "-"} s/d ${filters.endDate || "-"} | `;
      if (filters.paymentStatus !== "ALL") filterText += `Pembayaran: ${filters.paymentStatus} | `;
      if (filters.bookingStatus !== "ALL") filterText += `Status: ${filters.bookingStatus}`;
      doc.setFontSize(9);
      doc.text(filterText, 14, 38);

      // Table Data
      const tableColumn = ["ID Transaksi", "Tanggal", "Klien", "Paket", "Status Bayar", "Status Booking", "Total Nominal"];
      const tableRows: any[] = [];

      data.bookings.forEach(b => {
        const rowData = [
          b.id.substring(0, 8).toUpperCase(),
          format(new Date(b.createdAt), "dd/MM/yyyy HH:mm"),
          b.user.name || "-",
          b.package.name,
          b.payment?.status || "-",
          b.status,
          `Rp ${Number(b.totalPrice).toLocaleString("id-ID")}`
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
      });

      doc.save(`Laporan_VisualSpace_${format(new Date(), "yyyyMMdd")}.pdf`);
      toast.success("PDF berhasil diunduh!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengekspor PDF");
    } finally {
      setExporting(false);
    }
  };

  // EXPORT TO EXCEL
  const handleExportExcel = () => {
    if (!data || data.bookings.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    setExporting(true);
    try {
      const excelData = data.bookings.map(b => ({
        "ID Transaksi": b.id,
        "Tanggal Dibuat": format(new Date(b.createdAt), "yyyy-MM-dd HH:mm:ss"),
        "Jadwal Sesi": `${format(new Date(b.bookingDate), "yyyy-MM-dd")} ${b.bookingTime}`,
        "Nama Klien": b.user.name,
        "Email Klien": b.user.email,
        "Paket": b.package.name,
        "Metode Pembayaran": b.payment?.method || "-",
        "Status Pembayaran": b.payment?.status || "-",
        "Status Booking": b.status,
        "Total Nominal": Number(b.totalPrice),
        "Nominal Dibayar": Number(b.payment?.amount || 0)
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Transaksi");
      
      XLSX.writeFile(workbook, `Laporan_VisualSpace_${format(new Date(), "yyyyMMdd")}.xlsx`);
      toast.success("Excel berhasil diunduh!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengekspor Excel");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* EXPORT ACTIONS */}
      <div className="flex justify-end gap-3">
        <Button 
          variant="outline" 
          onClick={handleExportPDF}
          disabled={loading || exporting || !data?.bookings.length}
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-white"
        >
          {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          Export PDF
        </Button>
        <Button 
          variant="outline" 
          onClick={handleExportExcel}
          disabled={loading || exporting || !data?.bookings.length}
          className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 bg-white"
        >
          {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
          Export Excel
        </Button>
      </div>

      {/* SUMMARY DASHBOARD WIDGETS */}
      {loading && !data ? (
        <div className="h-32 flex items-center justify-center bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Gross Revenue</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">Rp {data.summary.totalGrossRevenue.toLocaleString("id-ID")}</h3>
            </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <WalletCards className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Net Revenue</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">Rp {data.summary.totalNetRevenue.toLocaleString("id-ID")}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Booking</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{data.summary.totalTransactions} Transaksi</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div className="w-full">
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Top Packages</p>
              {data.summary.topPackages.length > 0 ? (
                <div className="space-y-1">
                  {data.summary.topPackages.map((pkg, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 dark:text-zinc-200 truncate pr-2 max-w-[120px]">{pkg.name}</span>
                      <span className="text-slate-500">{pkg.count}x</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs font-semibold text-slate-400">Belum ada data</span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* FILTER SECTION */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-indigo-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Filter Data</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Mulai Tanggal</label>
            <input 
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-zinc-100"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Sampai Tanggal</label>
            <input 
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-zinc-100"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Status Bayar</label>
            <select 
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange("paymentStatus", e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-zinc-100"
            >
              <option value="ALL">Semua</option>
              <option value="LUNAS">Lunas</option>
              <option value="DP">DP</option>
              <option value="PENDING">Pending</option>
              <option value="GAGAL">Gagal</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Status Booking</label>
            <select 
              value={filters.bookingStatus}
              onChange={(e) => handleFilterChange("bookingStatus", e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-zinc-100"
            >
              <option value="ALL">Semua</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="ON_PROGRESS">On Progress</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Paket</label>
            <select 
              value={filters.packageId}
              onChange={(e) => handleFilterChange("packageId", e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-zinc-100 truncate"
            >
              <option value="ALL">Semua Paket</option>
              {filterPackages.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={clearFilters} className="text-slate-500 text-xs font-bold mr-2">Reset Filter</Button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800">
          <h3 className="font-bold text-slate-900 dark:text-white">Detail Riwayat Transaksi</h3>
        </div>
        <div className="overflow-x-auto relative">
          {loading && (
             <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
               <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
             </div>
          )}
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-zinc-950/50">
              <TableRow>
                <TableHead className="font-bold text-xs uppercase text-slate-500">ID / Waktu Transaksi</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Klien</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Paket Terpilih</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Status Bayar</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500">Status Booking</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Total Nominal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data?.bookings.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500 font-medium">
                    Tidak ada transaksi ditemukan berdasarkan filter ini.
                  </TableCell>
                </TableRow>
              ) : (
                data.bookings.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-zinc-200 uppercase text-xs">{item.id.substring(0,8)}</span>
                        <span className="text-slate-500 dark:text-zinc-500 text-xs mt-0.5">
                          {format(new Date(item.createdAt), "dd MMM yyyy, HH:mm")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-zinc-200 text-sm">{item.user.name || "-"}</span>
                        <span className="text-slate-500 dark:text-zinc-500 text-xs">{item.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                        {item.package.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.payment?.status || "-")}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-black text-slate-900 dark:text-white">
                        Rp {Number(item.totalPrice).toLocaleString("id-ID")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
