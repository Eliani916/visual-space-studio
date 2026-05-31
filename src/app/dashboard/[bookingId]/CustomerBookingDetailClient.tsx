"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  CreditCard,
  Camera,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Check,
  ExternalLink,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  generateRemainingPaymentToken,
  getAvailableTimes,
  rescheduleBooking,
  cancelBooking
} from "@/features/booking/actions/booking.actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CustomerBookingDetailClientProps {
  booking: any;
}

export default function CustomerBookingDetailClient({ booking }: CustomerBookingDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [fetchingTimes, setFetchingTimes] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const bookingDateObj = new Date(booking.bookingDate);
  const diffTime = todayDate.getTime() - bookingDateObj.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Days elapsed since session date

  const isRescheduleEligible = booking.status === "CONFIRMED" && diffDays <= 3;

  useEffect(() => {
    if (rescheduleDate) {
      setFetchingTimes(true);
      getAvailableTimes(rescheduleDate).then((res) => {
        if (res.success) {
          setAvailableTimes(res.data || []);
        } else {
          toast.error("Gagal memuat slot waktu");
        }
        setFetchingTimes(false);
      });
    } else {
      setAvailableTimes([]);
    }
  }, [rescheduleDate]);

  const handleConfirmReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error("Silakan pilih tanggal dan jam baru");
      return;
    }
    setRescheduling(true);
    const res = await rescheduleBooking(booking.id, rescheduleDate, rescheduleTime);
    if (res.success) {
      toast.success("Jadwal sesi foto berhasil diubah!");
      setIsRescheduleOpen(false);
      router.refresh();
    } else {
      toast.error(res.message || "Gagal mengubah jadwal");
    }
    setRescheduling(false);
  };

  const handleConfirmCancel = async () => {
    setCancelling(true);
    const res = await cancelBooking(booking.id);
    if (res.success) {
      toast.success("Pesanan berhasil dibatalkan!");
      setIsCancelOpen(false);
      router.refresh();
    } else {
      toast.error(res.message || "Gagal membatalkan pesanan");
    }
    setCancelling(false);
  };

  const localToday = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split("T")[0];

  const isRescheduleTimePast = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return false;
    const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    
    if (dateStr === todayStr) {
      const [hour, minute] = timeStr.split(":").map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) {
        return true;
      }
    }
    return false;
  };

  const token = booking.payment?.proofUrl;
  const isTransfer = booking.payment?.method === "TRANSFER";
  const isPaymentPending = booking.payment?.status === "PENDING";
  
  const isProd = !process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.startsWith("SB-");
  const snapScriptUrl = isProd 
    ? "https://app.midtrans.com/snap/snap.js" 
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  // Stepper logic
  const steps = [
    { label: "Booking Diajukan", desc: "Sesi didaftarkan" },
    { label: "Pembayaran", desc: booking.payment?.method === "CASH" ? "Cash di Studio" : "DP / Lunas Transfer" },
    { label: "Sesi Foto", desc: "Studio disiapkan" },
    { label: "Selesai & Galeri", desc: "Unduh foto Anda" },
  ];

  const getActiveStep = () => {
    if (booking.status === "COMPLETED") return 4;
    if (booking.status === "ON_PROGRESS") return 3;
    if (booking.status === "CONFIRMED") return 2;
    if (booking.status === "PENDING" && booking.payment?.status !== "PENDING") return 2;
    return 1;
  };

  const activeStep = getActiveStep();

  const handlePayNow = () => {
    if (!token) {
      toast.error("Token pembayaran tidak ditemukan. Silakan hubungi admin.");
      return;
    }
    
    setLoading(true);
    if (window.snap) {
      window.snap.pay(token, {
        onSuccess: function (result: any) {
          toast.success("Pembayaran berhasil!");
          router.refresh();
        },
        onPending: function (result: any) {
          toast.info("Menunggu pembayaran Anda!");
          router.refresh();
        },
        onError: function (result: any) {
          toast.error("Pembayaran gagal!");
          router.refresh();
        },
        onClose: function () {
          toast.warning("Anda menutup popup pembayaran.");
        },
      });
    } else {
      toast.error("Gagal memuat sistem pembayaran. Silakan coba beberapa saat lagi.");
    }
    setLoading(false);
  };

  const handlePayRemaining = async () => {
    setLoading(true);
    const res = await generateRemainingPaymentToken(booking.id);
    if (res.success && res.data?.token) {
      if (window.snap) {
        window.snap.pay(res.data.token, {
          onSuccess: function (result: any) {
            toast.success("Pembayaran sisa berhasil!");
            router.refresh();
          },
          onPending: function (result: any) {
            toast.info("Menunggu pembayaran pelunasan Anda!");
            router.refresh();
          },
          onError: function (result: any) {
            toast.error("Pembayaran pelunasan gagal!");
            router.refresh();
          },
          onClose: function () {
            toast.warning("Anda menutup popup pembayaran.");
          },
        });
      } else {
        toast.error("Gagal memuat sistem pembayaran. Silakan coba lagi.");
      }
    } else {
      toast.error(res.message || "Gagal memproses pelunasan");
    }
    setLoading(false);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return { text: "Menunggu", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/20" };
      case "CONFIRMED":
        return { text: "Dikonfirmasi", color: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200/20" };
      case "ON_PROGRESS":
        return { text: "Sedang Berlangsung", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/20" };
      case "COMPLETED":
        return { text: "Selesai", color: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/20" };
      case "EXPIRED":
        return { text: "Kadaluarsa", color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/20" };
      case "CANCELLED":
        return { text: "Dibatalkan", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/60 dark:text-slate-500 border border-slate-200/20" };
      default:
        return { text: status, color: "bg-slate-100 text-slate-800" };
    }
  };

  const getPaymentStatusLabel = (status?: string) => {
    switch (status) {
      case "PENDING":
        return { text: "Belum Bayar", color: "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border border-orange-200/20" };
      case "DP":
        return { text: "DP 50%", color: "bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400 border border-sky-200/20" };
      case "LUNAS":
        return { text: "Lunas", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/20" };
      case "GAGAL":
        return { text: "Gagal", color: "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/20" };
      default:
        return { text: "Belum Bayar", color: "bg-slate-50 text-slate-700 border border-slate-200/20" };
    }
  };

  const statusInfo = getStatusLabel(booking.status);
  const paymentInfo = getPaymentStatusLabel(booking.payment?.status);

  return (
    <>
      {isTransfer && (isPaymentPending || booking.payment?.status === "DP") && (
        <Script
          src={snapScriptUrl}
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="lazyOnload"
        />
      )}

      <div className="p-6 sm:p-8 space-y-8 max-w-5xl mx-auto">
        {/* Header navigation */}
        <div className="flex justify-between items-center gap-4">
          <Link
            href="/dashboard"
            className="text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xxs font-bold uppercase tracking-wider ${statusInfo.color}`}>
              Booking: {statusInfo.text}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xxs font-bold uppercase tracking-wider ${paymentInfo.color}`}>
              Bayar: {paymentInfo.text}
            </span>
          </div>
        </div>

        {/* Stepper Timeline */}
        {booking.status !== "CANCELLED" && booking.status !== "EXPIRED" && (
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-6">Progres Pemesanan</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {steps.map((step, idx) => {
                const stepNum = idx + 1;
                const isCompleted = activeStep > stepNum;
                const isActive = activeStep === stepNum;
                const isPending = activeStep < stepNum;

                return (
                  <div key={idx} className="flex md:flex-col items-center md:items-center gap-4 text-left md:text-center relative group">
                    {/* Circle icon */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 z-10 transition-all duration-300 ${
                        isCompleted
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                          : isActive
                          ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-4 ring-indigo-500/15"
                          : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500"
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : stepNum}
                    </div>

                    {/* Text Details */}
                    <div className="space-y-0.5">
                      <p
                        className={`text-sm font-extrabold ${
                          isActive
                            ? "text-indigo-600 dark:text-indigo-400"
                            : isCompleted
                            ? "text-slate-800 dark:text-zinc-200"
                            : "text-slate-400 dark:text-zinc-500"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xxs text-slate-450 dark:text-zinc-500 font-medium leading-normal">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Two column detail info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Booking Info & Summary */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800/60 pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Rincian Paket & Jadwal</h3>
                  <p className="text-xxs text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">ID: {booking.id.substring(0, 8)}</p>
                </div>
              </div>

              {/* Data fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 dark:text-zinc-550 block">Paket Pilihan</span>
                  <span className="font-extrabold text-slate-800 dark:text-white text-base">{booking.package.name}</span>
                  <span className="text-xs text-slate-500 block leading-relaxed">{booking.package.description}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 dark:text-zinc-550 block">Jadwal Sesi Foto</span>
                  <div className="flex items-center gap-2 font-extrabold text-slate-850 dark:text-white">
                    <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>
                      {new Date(booking.bookingDate).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-zinc-400 mt-1">
                    <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Jam {booking.bookingTime} WIB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification/Alert Board */}
            {booking.status === "PENDING" && (
              <div className="bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 p-5 rounded-2xl flex items-start gap-3.5">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-amber-850 dark:text-amber-400">Pembayaran Menunggu Tindakan</h4>
                  {isTransfer ? (
                    <p className="text-slate-600 dark:text-zinc-450 leading-relaxed">
                      Silakan selesaikan pembayaran DP/Lunas melalui Midtrans untuk mengonfirmasi pemesanan jadwal Anda. Jika popup tertutup, klik tombol **"Bayar Sekarang"** di samping kanan.
                    </p>
                  ) : (
                    <p className="text-slate-600 dark:text-zinc-450 leading-relaxed font-semibold">
                      Anda memilih metode pembayaran **Bayar di Studio (Cash)**. Harap lakukan pembayaran tunai di kasir studio sebelum sesi foto dimulai. Pemesanan ini harus dikonfirmasi/dibayar selambat-lambatnya sebelum batas waktu H-7 (atau batas kebijakan studio), atau pemesanan Anda akan dibatalkan otomatis oleh sistem.
                    </p>
                  )}
                </div>
              </div>
            )}

            {booking.status === "CONFIRMED" && (
              <div className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-2xl flex items-start gap-3.5">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-indigo-850 dark:text-indigo-400">Jadwal Terkonfirmasi!</h4>
                  <p className="text-slate-600 dark:text-zinc-450 leading-relaxed">
                    Pesanan Anda telah aman. Silakan datang ke studio tepat waktu, disarankan **10 menit** sebelum sesi jam {booking.bookingTime} dimulai. Tunjukkan bukti booking di halaman ini kepada kasir saat kedatangan.
                  </p>
                </div>
              </div>
            )}

            {booking.status === "ON_PROGRESS" && (
              <div className="space-y-4">
                {booking.payment?.status === "DP" && (
                  <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl flex items-start gap-3.5">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <h4 className="font-bold text-amber-850 dark:text-amber-400">Pembayaran DP Terverifikasi - Sisa Pelunasan Wajib</h4>
                      <p className="text-slate-600 dark:text-zinc-450 leading-relaxed">
                        Anda telah melakukan pembayaran DP 50%. Sesi foto Anda sudah dapat dilaksanakan di studio. Silakan lakukan pelunasan sisa 50% via Midtrans (tombol di sebelah kanan) atau bayar secara tunai (cash) ke kasir studio.
                      </p>
                    </div>
                  </div>
                )}
                <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl flex items-start gap-3.5">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-blue-850 dark:text-blue-400">Sesi Foto Sedang Berjalan</h4>
                    <p className="text-slate-600 dark:text-zinc-450 leading-relaxed">
                      Sesi foto Anda sedang berjalan di studio. Nikmati waktu foto Anda bersama teman/keluarga! Hasil foto digital (Soft File) akan diunggah oleh fotografer kami segera setelah sesi foto Anda selesai.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Transaction & Action Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800/60 pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Rincian Transaksi</h3>
              </div>

              {/* Cost break down */}
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center text-slate-450 dark:text-zinc-400">
                  <span>Metode Pembayaran</span>
                  <span className="font-bold text-slate-850 dark:text-white uppercase">{booking.payment?.method || "-"}</span>
                </div>

                <div className="flex justify-between items-center text-slate-450 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800/40 pb-3">
                  <span>Tipe Pembayaran</span>
                  <span className="font-bold text-slate-850 dark:text-white">
                    {booking.payment?.method === "CASH" ? "Lunas (Tunai)" : booking.payment?.amount && Number(booking.payment.amount) < Number(booking.totalPrice) ? "DP 50%" : "Lunas 100%"}
                  </span>
                </div>

                {booking.promoCode && (
                  <div className="flex justify-between items-center text-slate-450 dark:text-zinc-400">
                    <span>Kode Promo</span>
                    <span className="font-bold text-slate-850 dark:text-white uppercase">{booking.promoCode}</span>
                  </div>
                )}

                {booking.discountAmount && Number(booking.discountAmount) > 0 && (
                  <div className="flex justify-between items-center text-green-500">
                    <span>Potongan Diskon</span>
                    <span className="font-bold">-Rp {Number(booking.discountAmount).toLocaleString("id-ID")}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-450 dark:text-zinc-400">
                  <span>Total Biaya Sesi</span>
                  <span className="font-bold text-slate-850 dark:text-white">Rp {Number(booking.totalPrice).toLocaleString("id-ID")}</span>
                </div>

                <div className="flex justify-between items-center text-sm border-t border-slate-100 dark:border-zinc-800/60 pt-3.5 font-bold text-slate-800 dark:text-white">
                  <span>Nominal Wajib Bayar</span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-base">
                    Rp {Number(booking.payment?.amount || booking.totalPrice).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Midtrans Snap Action Button */}
              {isTransfer && isPaymentPending && token && (
                <Button
                  onClick={handlePayNow}
                  disabled={loading}
                  className="w-full py-5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border-0 mt-4 disabled:opacity-40"
                >
                  {loading ? "Memproses..." : "Bayar Sekarang via Midtrans"}
                </Button>
              )}

              {/* Remaining Payment Button */}
              {isTransfer && booking.payment?.status === "DP" && (
                <div className="space-y-3 mt-4 border-t border-slate-100 dark:border-zinc-800/40 pt-4">
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xxs text-indigo-400 font-semibold leading-relaxed">
                    Sesi foto Anda sudah aktif karena Anda telah membayar DP 50%. Anda dapat melunasi sisa pembayaran via Midtrans di bawah ini.
                  </div>
                  <Button
                    onClick={handlePayRemaining}
                    disabled={loading}
                    className="w-full py-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border-0 disabled:opacity-40"
                  >
                    {loading ? "Memproses..." : `Bayar Pelunasan via Midtrans (Rp ${(Number(booking.totalPrice) * 0.5).toLocaleString("id-ID")})`}
                  </Button>
                </div>
              )}

              {/* Cash payment warning note */}
              {booking.payment?.method === "CASH" && booking.payment?.status === "PENDING" && (
                <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl text-xxs text-orange-400 font-semibold leading-relaxed mt-4">
                  Metode pembayaran terpilih adalah **Bayar di Studio (Cash)**. Harap lakukan pembayaran tunai di kasir studio sebelum sesi foto dimulai. Pemesanan ini harus dikonfirmasi/dibayar selambat-lambatnya sebelum batas waktu H-7 (atau batas kebijakan studio), atau pemesanan Anda akan dibatalkan otomatis oleh sistem.
                </div>
              )}

              {/* Reschedule button */}
              {isRescheduleEligible && (
                <div className="mt-4 border-t border-slate-100 dark:border-zinc-800/40 pt-4">
                  <Button
                    onClick={() => {
                      setRescheduleDate("");
                      setRescheduleTime("");
                      setIsRescheduleOpen(true);
                    }}
                    className="w-full py-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-slate-100 font-bold text-sm shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border-0"
                  >
                    <Calendar className="w-4 h-4 text-purple-500" />
                    Jadwal Ulang (Reschedule)
                  </Button>
                </div>
              )}

              {/* Cancel button */}
              {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                <div className="mt-3">
                  <Button
                    onClick={() => setIsCancelOpen(true)}
                    variant="outline"
                    className="w-full py-5 rounded-xl border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-sm shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    Batalkan Pesanan
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Modal Dialog */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md bg-slate-900 border border-slate-800 text-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Jadwal Ulang Sesi Foto
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 block">Pilih Tanggal Baru</label>
              <Input
                type="date"
                min={localToday}
                value={rescheduleDate}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  setRescheduleTime("");
                }}
                className="bg-slate-950 border-slate-800 text-white rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 block">Pilih Jam Baru</label>
              <select
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                disabled={!rescheduleDate || fetchingTimes || availableTimes.length === 0}
                className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/20 focus-visible:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" className="bg-slate-950 text-slate-400">
                  {fetchingTimes ? "Memuat jam..." : !rescheduleDate ? "-- Pilih Tanggal Dulu --" : availableTimes.length === 0 ? "-- Tidak Ada Slot Tersedia --" : "-- Pilih Jam --"}
                </option>
                {availableTimes.map((time) => {
                  const isPast = isRescheduleTimePast(rescheduleDate, time);
                  return (
                    <option
                      key={time}
                      value={time}
                      disabled={isPast}
                      className={`bg-slate-950 ${isPast ? "text-slate-650 cursor-not-allowed line-through" : "text-slate-100"}`}
                    >
                      {time} {isPast ? "(Lewat)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/60 mt-6">
              <button
                onClick={() => setIsRescheduleOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 rounded-xl transition cursor-pointer border-0 bg-transparent"
              >
                Batal
              </button>
              <Button
                onClick={handleConfirmReschedule}
                disabled={rescheduling || !rescheduleDate || !rescheduleTime}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-750 rounded-xl shadow-md shadow-purple-600/10 transition cursor-pointer border-0 disabled:opacity-40"
              >
                {rescheduling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : (
                  "Konfirmasi Reschedule"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-600 dark:text-rose-500">
              <AlertCircle className="w-5 h-5" />
              Batalkan Pesanan
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Apakah Anda yakin ingin membatalkan pesanan foto ini?
            </p>
            
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-4 rounded-2xl text-xs text-rose-700 dark:text-rose-400 leading-relaxed font-medium">
              <strong>Penting:</strong> Jika Anda sudah melakukan pembayaran (DP maupun Lunas), dana yang masuk tidak dapat dikembalikan secara otomatis sesuai dengan kebijakan studio. Jadwal ini akan dilepas dan dapat dipesan oleh orang lain.
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 mt-2">
              <button
                onClick={() => setIsCancelOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer border-0 bg-transparent"
              >
                Kembali
              </button>
              <Button
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/10 transition cursor-pointer border-0 disabled:opacity-40"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Memproses...
                  </>
                ) : (
                  "Ya, Batalkan Pesanan"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
