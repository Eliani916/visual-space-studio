"use client";

import { useEffect, useState } from "react";
import { getGallery } from "../actions/gallery.actions";
import { toast } from "sonner";
import { submitBookingReview } from "@/features/booking/actions/review.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CustomerGallery({ bookingId }: { bookingId: string }) {
  const [galleryData, setGalleryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Print selection states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [shippingAddress, setShippingAddress] = useState("");
  const [savingPrintSelection, setSavingPrintSelection] = useState(false);

  const fetchGallery = async () => {
    setLoading(true);
    const res = await getGallery(bookingId);
    if (res.success && res.data) {
      setGalleryData(res.data);
      setShippingAddress(res.data.shippingAddress || "");
      if (res.data.printPhotos) {
        setUploadedPhotos(res.data.printPhotos.split(","));
      } else {
        setUploadedPhotos([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGallery();
  }, [bookingId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (files.length > printLimit) {
      toast.error(`Anda hanya dapat memilih maksimal ${printLimit} foto untuk dicetak`);
      // Reset input field
      e.target.value = "";
      return;
    }

    const filesArray = Array.from(files);
    setSelectedFiles(filesArray);

    // Generate object URL previews
    const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Silakan pilih rating bintang");
      return;
    }
    if (!comment.trim()) {
      toast.error("Silakan masukkan komentar ulasan");
      return;
    }
    setSubmittingReview(true);
    const res = await submitBookingReview(bookingId, rating, comment);
    if (res.success) {
      toast.success(res.message);
      fetchGallery();
    } else {
      toast.error(res.message);
    }
    setSubmittingReview(false);
  };

  const handleSavePrintSelection = async () => {
    if (selectedFiles.length === 0 && uploadedPhotos.length === 0) {
      toast.error("Silakan pilih file gambar untuk dicetak terlebih dahulu");
      return;
    }
    if (!shippingAddress.trim()) {
      toast.error("Silakan isi alamat pengiriman lengkap");
      return;
    }
    
    setSavingPrintSelection(true);

    const formData = new FormData();
    formData.append("bookingId", bookingId);
    formData.append("shippingAddress", shippingAddress);
    
    if (selectedFiles.length > 0) {
      selectedFiles.forEach((file) => {
        formData.append("printFiles", file);
      });
    }

    try {
      const res = await fetch("/api/gallery/print-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setSelectedFiles([]);
        setPreviews([]);
        fetchGallery();
      } else {
        toast.error(data.message || "Gagal mengunggah foto cetak");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem saat mengunggah foto cetak");
    } finally {
      setSavingPrintSelection(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Memuat galeri...</div>;
  if (!galleryData) return <div className="p-4 text-center">Gagal memuat galeri.</div>;

  const { printLimit, gdriveLink, reviewComment, printStatus } = galleryData;
  const isLocked = printStatus && !["PENDING", "BELUM_DIAJUKAN"].includes(printStatus);

  return (
    <div className="space-y-6 mt-6">
      {/* HEADER INFO */}
      <div className="bg-indigo-50 dark:bg-indigo-950/20 p-6 rounded-3xl border border-indigo-200/50 dark:border-indigo-900/30">
        <h3 className="font-extrabold text-lg text-indigo-900 dark:text-indigo-400">Galeri Foto Digital & Cetak</h3>
        <p className="text-sm text-slate-655 dark:text-zinc-400 mt-1 leading-relaxed">
          Tautan unduhan file digital resolusi tinggi dikirimkan melalui Google Drive. Anda juga dapat memilih foto untuk dicetak fisik sesuai paket Anda.
        </p>
      </div>

      {/* GOOGLE DRIVE ACCESS GATE */}
      {gdriveLink ? (
        <div className="p-6 border rounded-2xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Akses Folder Google Drive Hasil Foto</h3>
          </div>

          {reviewComment ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30 space-y-3">
              <p className="text-sm text-emerald-800 dark:text-emerald-400 font-medium">
                Terima kasih atas ulasan Anda! Anda sekarang dapat mengakses dan mengunduh seluruh foto resolusi tinggi di Google Drive.
              </p>
              <a href={gdriveLink} target="_blank" rel="noopener noreferrer" className="inline-block">
                <Button className="bg-emerald-600 hover:bg-emerald-755 text-white font-semibold cursor-pointer">
                  Buka Folder Google Drive Sesi Foto
                </Button>
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                <p className="text-sm text-amber-800 dark:text-amber-400 font-semibold">
                  Tautan Google Drive Sesi Foto Anda Telah Siap!
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-1 leading-relaxed">
                  Demi meningkatkan kualitas layanan kami, silakan berikan ulasan singkat (rating bintang & komentar) mengenai pengalaman Anda. Tautan Google Drive akan langsung terbuka otomatis setelah ulasan dikirimkan.
                </p>
              </div>

              {/* REVIEW FORM */}
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Rating Sesi Foto</label>
                  <div className="flex space-x-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                      >
                        <svg
                          className={`w-7 h-7 ${
                            star <= rating
                              ? "fill-amber-400 text-amber-400 filter drop-shadow-[0_0_4px_rgba(251,191,36,0.4)]"
                              : "text-slate-300 dark:text-zinc-700"
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Komentar Ulasan</label>
                  <textarea
                    rows={3}
                    placeholder="Tulis ulasan Anda tentang pelayanan fotografer dan studio kami..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-3 bg-slate-55 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800 dark:text-zinc-200 placeholder:text-slate-400"
                  />
                </div>

                <Button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || rating === 0 || !comment.trim()}
                  className="bg-indigo-650 hover:bg-indigo-700 text-white font-semibold cursor-pointer w-full sm:w-auto"
                >
                  {submittingReview ? "Mengirim..." : "Kirim Ulasan & Buka Tautan"}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 border rounded-2xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm text-center py-10 space-y-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400 mx-auto animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h4 className="font-semibold text-slate-700 dark:text-zinc-305">Tautan Foto Belum Tersedia</h4>
          <p className="text-xs text-slate-400 dark:text-zinc-500">Fotografer sedang memproses foto Anda. Tautan Google Drive akan muncul setelah siap.</p>
        </div>
      )}

      {/* PRINT SELECTION SECTION */}
      {gdriveLink && printLimit > 0 && (
        <div className="p-6 border rounded-2xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Pilihan Cetak Foto Fisik</h3>
          <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-200/50 dark:border-indigo-900/30 text-xs text-indigo-900 dark:text-indigo-300 flex justify-between items-center">
            <span>Paket Anda mencakup cetak fisik sebanyak:</span>
            <span className="font-black text-sm bg-indigo-200 dark:bg-indigo-900 px-3 py-1 rounded-full">{printLimit} Lembar</span>
          </div>

          {/* STATUS TRACKING ALERT */}
          {printStatus && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs font-semibold ${
              printStatus === 'PENDING' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 text-amber-800 dark:text-amber-400' :
              printStatus === 'SEDANG_DICETAK' ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200/50 text-blue-800 dark:text-blue-400' :
              printStatus === 'DALAM_PENGIRIMAN' ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200/50 text-indigo-800 dark:text-indigo-400' :
              'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 text-emerald-800 dark:text-emerald-400'
            }`}>
              {printStatus === 'PENDING' && (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Status Cetak: **Menunggu Konfirmasi Admin**. Anda masih dapat mengunggah ulang foto & mengubah alamat Anda di bawah.</span>
                </>
              )}
              {printStatus === 'SEDANG_DICETAK' && (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Status Cetak: **Foto Sedang Dicetak oleh Studio**. Pengajuan cetak dan alamat telah dikunci dan tidak dapat diubah lagi.</span>
                </>
              )}
              {printStatus === 'DALAM_PENGIRIMAN' && (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Status Cetak: **Foto Dalam Pengiriman Kurir ke Alamat Anda**. Harap tunggu kedatangan paket cetak foto fisik Anda.</span>
                </>
              )}
              {printStatus === 'SELESAI' && (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Status Cetak: **Selesai & Paket Telah Diterima**. Terima kasih telah berfoto bersama Visual Space!</span>
                </>
              )}
            </div>
          )}

          {reviewComment ? (
            <div className="space-y-4">
              {/* Photo Upload selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-550 dark:text-zinc-400 uppercase tracking-wider block">
                  Unggah File Foto yang Ingin Dicetak
                </label>
                <p className="text-xs text-slate-400 dark:text-zinc-500 leading-relaxed mb-1">
                  Silakan buka Google Drive Anda di atas, unduh foto favorit Anda, kemudian pilih dan unggah file gambarnya di bawah (maksimal {printLimit} foto):
                </p>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={savingPrintSelection || isLocked}
                  className="bg-slate-55 dark:bg-zinc-95 border-slate-200 dark:border-zinc-800 cursor-pointer rounded-xl h-10 py-1.5"
                />
              </div>

              {/* Local previews of selected files */}
              {previews.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xxs font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider block">Pratinjau File yang Dipilih:</span>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {previews.map((src, i) => (
                      <div key={i} className="relative aspect-square border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                        <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Already uploaded photos preview */}
              {uploadedPhotos.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800/40">
                  <span className="text-xxs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Foto yang Telah Diajukan Sebelumnya:</span>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {uploadedPhotos.map((src, i) => (
                      <a href={src} target="_blank" rel="noopener noreferrer" key={i} className="relative aspect-square border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:ring-2 hover:ring-indigo-500 transition block cursor-zoom-in group">
                        <img src={src} alt={`Uploaded ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                          </svg>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping address input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-550 dark:text-zinc-400 uppercase tracking-wider block">
                  Alamat Pengiriman Lengkap
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan nama penerima, no handphone aktif, dan alamat pengiriman lengkap foto cetak fisik Anda..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  disabled={savingPrintSelection || isLocked}
                  className="w-full p-3 bg-slate-55 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800 dark:text-zinc-200 placeholder:text-slate-400"
                />
              </div>

              {!isLocked ? (
                <Button
                  onClick={handleSavePrintSelection}
                  disabled={savingPrintSelection || (selectedFiles.length === 0 && uploadedPhotos.length === 0) || !shippingAddress.trim()}
                  className="bg-indigo-650 hover:bg-indigo-700 text-white font-semibold cursor-pointer w-full sm:w-auto rounded-xl shadow-md h-11"
                >
                  {savingPrintSelection ? "Mengunggah..." : "Unggah & Kirim Pengajuan Cetak"}
                </Button>
              ) : (
                <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-3 rounded-xl">
                  Data pengiriman dan file foto telah dikunci karena proses cetak atau pengiriman sedang berlangsung di studio.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-455 dark:text-zinc-550 leading-relaxed italic">
              Pilihan cetak fisik akan aktif setelah Anda mengirim ulasan sesi foto dan membuka akses tautan Google Drive di atas.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
