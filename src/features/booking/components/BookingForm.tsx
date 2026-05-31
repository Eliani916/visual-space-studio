"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema, BookingInput } from "@/validations/booking.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createBooking, getAvailableTimes } from "../actions/booking.actions";
import { getPackages } from "@/features/package/actions/package.actions";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Calendar, Clock, CreditCard, Sparkles, AlertCircle, Star } from "lucide-react";

declare global {
  interface Window {
    snap: any;
  }
}

function PackageImageCarousel({ images }: { images: { id: string; url: string }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, images.length]);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950/60 border border-slate-800/80 group">
        <img
          src={images[currentIndex].url}
          alt={`Package Image ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-500 cursor-zoom-in group-hover:scale-[1.01]"
          onClick={() => setIsOpen(true)}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white flex items-center justify-center border border-slate-800 cursor-pointer text-xs font-bold transition-all hover:scale-105 active:scale-95 z-10"
            >
              &larr;
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white flex items-center justify-center border border-slate-800 cursor-pointer text-xs font-bold transition-all hover:scale-105 active:scale-95 z-10"
            >
              &rarr;
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-slate-950/50 px-2 py-1 rounded-full backdrop-blur-sm z-10">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    currentIndex === idx ? "bg-purple-400 w-3" : "bg-slate-600"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox / Fullscreen Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Close Button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 px-4 py-2 rounded-full border border-slate-800 transition cursor-pointer font-bold text-xs flex items-center gap-1.5"
          >
            &#x2715; Tutup
          </button>

          {/* Carousel Left/Right Buttons in Lightbox */}
          {images.length > 1 && (
            <>
              <button 
                onClick={prev}
                className="absolute left-6 w-12 h-12 rounded-full bg-slate-900/85 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-800 hover:scale-105 active:scale-95 transition cursor-pointer text-base font-bold z-20"
              >
                &larr;
              </button>
              <button 
                onClick={next}
                className="absolute right-6 w-12 h-12 rounded-full bg-slate-900/85 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-800 hover:scale-105 active:scale-95 transition cursor-pointer text-base font-bold z-20"
              >
                &rarr;
              </button>
            </>
          )}

          {/* Full Image Container */}
          <div 
            className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-2xl flex flex-col items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image wrapper
          >
            <img 
              src={images[currentIndex].url} 
              alt={`Full Package Image ${currentIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
            {/* Image indicator count */}
            <div className="absolute bottom-6 bg-slate-950/85 border border-slate-800 text-[10px] font-extrabold tracking-wider text-slate-400 px-4 py-1.5 rounded-full shadow-lg">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function BookingForm({ settings }: { settings: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryPackageId = searchParams.get("packageId");
  
  const [packages, setPackages] = useState<any[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTransferRequired, setIsTransferRequired] = useState(false);

  const form = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      packageId: "",
      bookingDate: "",
      bookingTime: "",
      paymentMethod: "TRANSFER",
      paymentType: "DP",
      promoCode: "",
    },
  });

  const discountPercent = 0;

  const selectedDate = form.watch("bookingDate");
  const selectedMethod = form.watch("paymentMethod");
  const selectedPackageId = form.watch("packageId");

  useEffect(() => {
    if (selectedMethod === "CASH") {
      form.setValue("paymentType", "FULL");
    } else {
      form.setValue("paymentType", "DP");
    }
  }, [selectedMethod, form]);

  useEffect(() => {
    // Fetch packages
    getPackages(false).then((res) => {
      if (res.success) {
        const pkgs: any[] = res.data || [];
        setPackages(pkgs);
        if (queryPackageId && pkgs.some((p: any) => p.id === queryPackageId)) {
          form.setValue("packageId", queryPackageId);
        } else if (pkgs.length > 0) {
          form.setValue("packageId", pkgs[0].id);
        }
      }
    });
  }, [queryPackageId, form]);

  useEffect(() => {
    if (selectedDate) {
      // Check available times
      getAvailableTimes(selectedDate).then((res) => {
        if (res.success) setAvailableTimes(res.data || []);
      });

      // Check DP constraints
      const bookingDateObj = new Date(`${selectedDate}T00:00:00`);
      const now = new Date();
      now.setHours(0,0,0,0);
      const diffTime = bookingDateObj.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= settings.dpMinDaysAhead) {
        setIsTransferRequired(true);
        form.setValue("paymentMethod", "TRANSFER");
      } else {
        setIsTransferRequired(false);
      }
    } else {
      setAvailableTimes([]);
      setIsTransferRequired(false);
    }
  }, [selectedDate, settings.dpMinDaysAhead, form]);

  const onSubmit = async (data: BookingInput) => {
    setLoading(true);
    const res = await createBooking(data);
    if (res.success && res.data) {
      toast.success("Booking berhasil dibuat");
      router.push(`/dashboard/${res.data.bookingId}`);
    } else {
      toast.error(res.message || "Gagal membuat booking");
    }
    setLoading(false);
  };

  const selectedTime = form.watch("bookingTime");
  const selectedPackage = packages.find((p) => p.id === selectedPackageId);
  const packagePrice = selectedPackage ? parseFloat(selectedPackage.price) : 0;
  const discountAmount = packagePrice * (discountPercent / 100);
  const finalTotalPrice = packagePrice - discountAmount;
  
  const paymentTypeVal = form.watch("paymentType");
  const isDp = selectedMethod === "TRANSFER" && paymentTypeVal === "DP";
  const paymentAmount = isDp ? finalTotalPrice * 0.5 : finalTotalPrice;

  const localToday = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split("T")[0];

  const isTimePast = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return false;
    const now = new Date();
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

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full relative z-10">


          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
            {/* Left Column: Details & Reviews */}
            <div className="lg:col-span-7 space-y-6">
              {/* Package Details */}
              {selectedPackage ? (
                <div className="bg-slate-900/40 backdrop-blur-md p-8 rounded-3xl border border-slate-900 shadow-2xl shadow-purple-500/5 space-y-6">
                  {/* Image Carousel */}
                  {selectedPackage.images && selectedPackage.images.length > 0 ? (
                    <PackageImageCarousel images={selectedPackage.images} />
                  ) : (
                    <div className="w-full aspect-video rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-center text-slate-600 text-xs">
                      Tidak ada gambar untuk paket ini
                    </div>
                  )}

                  {/* Title & Price */}
                  <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 border-b border-slate-800/80 pb-4">
                    <h2 className="text-2xl font-black text-white">{selectedPackage.name}</h2>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-slate-400">Rp</span>
                        <span className="text-3xl font-black text-purple-400">
                          {packagePrice.toLocaleString("id-ID")}
                        </span>
                        <span className="text-xs text-slate-500 font-medium ml-1">/sesi</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        <span>Durasi: {selectedPackage.duration || 60} Menit</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedPackage.description}
                  </p>

                  {/* Features */}
                  {selectedPackage.features && (
                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Layanan Termasuk:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedPackage.features.split("\n").map((feature: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900/20 backdrop-blur-sm p-8 rounded-3xl border border-slate-900 border-dashed text-center text-slate-500 py-16">
                  <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3 animate-pulse" />
                  <p className="text-sm font-medium">Memuat data paket...</p>
                </div>
              )}

              {/* Reviews Card */}
              {selectedPackage && (
                <div className="bg-slate-900/40 backdrop-blur-md p-8 rounded-3xl border border-slate-900 shadow-2xl shadow-purple-500/5 space-y-6">
                  <h3 className="text-lg font-bold text-slate-100 border-b border-slate-800/80 pb-3 flex items-center gap-2">
                    <Star className="w-4.5 h-4.5 text-amber-400 fill-amber-400" />
                    Ulasan Pelanggan ({selectedPackage.bookings?.length || 0})
                  </h3>

                  {selectedPackage.bookings && selectedPackage.bookings.length > 0 ? (
                    <div className="space-y-4">
                      {selectedPackage.bookings.map((booking: any) => (
                        <div key={booking.id} className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900/80 flex flex-col gap-3 hover:border-slate-800/65 transition duration-350">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0 border border-slate-800">
                                {booking.user.images?.[0]?.url ? (
                                  <img src={booking.user.images[0].url} alt={booking.user.name} className="w-full h-full object-cover" />
                                ) : (
                                  booking.user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-slate-200">{booking.user.name}</h4>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(booking.createdAt).toLocaleDateString("id-ID", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 text-amber-400">
                              {[...Array(booking.reviewRating)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-350 italic leading-relaxed">
                            "{booking.reviewComment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs italic">
                      Belum ada ulasan untuk paket ini. Jadilah yang pertama memberikan ulasan setelah berfoto!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Checkout Form (Sticky) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
              <div className="bg-slate-900/40 backdrop-blur-md p-8 rounded-3xl border border-slate-900 shadow-2xl shadow-purple-500/5 space-y-6">
                <h3 className="text-lg font-bold text-slate-100 border-b border-slate-800/80 pb-3 flex items-center gap-2">
                  <CreditCard className="w-4.5 h-4.5 text-purple-400" />
                  Isi Data & Pembayaran
                </h3>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="packageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-400 block mb-1">Paket Foto</FormLabel>
                        <FormControl>
                          <select 
                            {...field} 
                            className="flex h-10 w-full rounded-xl border border-slate-900 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/20 focus-visible:border-purple-500"
                          >
                            {packages.map(pkg => (
                              <option key={pkg.id} value={pkg.id} className="bg-slate-950 text-slate-100">
                                {pkg.name} - Rp {parseFloat(pkg.price).toLocaleString("id-ID")}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bookingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-slate-400 block mb-1">Tanggal</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              min={localToday} 
                              {...field} 
                              className="bg-slate-950 border-slate-900 focus-visible:border-purple-500 focus-visible:ring-purple-500/20 text-slate-100 rounded-xl"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bookingTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-slate-400 block mb-1">Jam</FormLabel>
                          <FormControl>
                            <select 
                              {...field} 
                              disabled={!selectedDate || availableTimes.length === 0}
                              className="flex h-10 w-full rounded-xl border border-slate-900 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/20 focus-visible:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="" className="bg-slate-950 text-slate-400">-- Pilih Jam --</option>
                              {availableTimes.map(time => {
                                const isPast = isTimePast(selectedDate, time);
                                return (
                                  <option 
                                    key={time} 
                                    value={time} 
                                    disabled={isPast} 
                                    className={`bg-slate-950 ${isPast ? 'text-slate-650 cursor-not-allowed line-through' : 'text-slate-100'}`}
                                  >
                                    {time} {isPast ? '(Lewat)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-400 block mb-1">Metode Pembayaran</FormLabel>
                        <FormControl>
                          <select 
                            {...field} 
                            className="flex h-10 w-full rounded-xl border border-slate-900 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/20 focus-visible:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="TRANSFER" className="bg-slate-950 text-slate-100">Transfer (Midtrans)</option>
                            {!isTransferRequired && <option value="CASH" className="bg-slate-950 text-slate-100">Cash di Studio</option>}
                          </select>
                        </FormControl>
                        {isTransferRequired && <p className="text-xs text-blue-400 mt-1">Booking H-{settings.dpMinDaysAhead} atau lebih wajib via Transfer.</p>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedMethod === "TRANSFER" && (
                    <FormField
                      control={form.control}
                      name="paymentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-slate-400 block mb-1">Pilihan Pembayaran</FormLabel>
                          <FormControl>
                            <select 
                              {...field} 
                              className="flex h-10 w-full rounded-xl border border-slate-900 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/20 focus-visible:border-purple-500"
                            >
                              <option value="DP" className="bg-slate-950 text-slate-100">Uang Muka (DP 50%)</option>
                              <option value="FULL" className="bg-slate-950 text-slate-100">Bayar Lunas (100%)</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="h-px bg-slate-800/80 my-4" />

                {/* Summary Section */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Harga Paket</span>
                    <span className="text-slate-355 font-medium">Rp {packagePrice.toLocaleString("id-ID")}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm border-t border-slate-800/60 pt-2.5 font-bold">
                    <span className="text-slate-200">Total Harga</span>
                    <span className="text-slate-100">Rp {finalTotalPrice.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-purple-500/5 border border-purple-500/10 p-3.5 flex items-start gap-2.5 mt-4">
                  <AlertCircle className="w-4.5 h-4.5 text-purple-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    {selectedMethod === "TRANSFER" ? (
                      <p>
                        Anda akan melanjutkan ke gerbang pembayaran Midtrans. Nominal yang wajib dibayarkan saat ini adalah <strong className="text-purple-300 text-xs">Rp {paymentAmount.toLocaleString("id-ID")}</strong> ({paymentTypeVal === "DP" ? "DP 50%" : "Lunas 100%"}).
                      </p>
                    ) : (
                      <p>
                        Anda memilih metode Cash. Booking akan tersimpan, dan Anda dapat melakukan pelunasan langsung di studio saat sesi foto sebesar <strong className="text-purple-300 text-xs">Rp {finalTotalPrice.toLocaleString("id-ID")}</strong>.
                      </p>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !selectedDate || !selectedTime} 
                  className="w-full py-5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-[0.98] transition-all font-bold text-sm text-white border-0 mt-4 cursor-pointer disabled:opacity-30 disabled:pointer-events-none disabled:cursor-not-allowed"
                >
                  {loading ? "Memproses..." : "Lanjutkan Pembayaran"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
