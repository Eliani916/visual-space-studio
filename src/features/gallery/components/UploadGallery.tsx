"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { sendGDriveLink } from "@/features/booking/actions/review.actions";

export default function UploadGallery({ 
  bookingId, 
  initialGDriveLink = "", 
  initialPrintSelection = "",
  onSuccess 
}: { 
  bookingId: string; 
  initialGDriveLink?: string; 
  initialPrintSelection?: string;
  onSuccess?: () => void; 
}) {
  const [gdriveLink, setGdriveLink] = useState(initialGDriveLink);
  const [sendingGDrive, setSendingGDrive] = useState(false);

  const handleSendGDrive = async () => {
    if (!gdriveLink.trim()) {
      toast.error("Tulis link Google Drive terlebih dahulu");
      return;
    }
    setSendingGDrive(true);
    const res = await sendGDriveLink(bookingId, gdriveLink);
    if (res.success) {
      toast.success(res.message);
      if (onSuccess) onSuccess();
    } else {
      toast.error(res.message);
    }
    setSendingGDrive(false);
  };

  return (
    <div className="space-y-6">
      {/* GDRIVE LINK SECTION */}
      <div className="p-6 border rounded-2xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Kirim Link Galeri Foto / Google Drive</h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
          Masukkan tautan Google Drive atau layanan cloud penyimpanan foto hasil sesi. Pelanggan wajib mengisi ulasan/komentar terlebih dahulu untuk membuka akses tautan ini di dashboard mereka.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Input 
            type="text" 
            placeholder="https://drive.google.com/drive/folders/..." 
            value={gdriveLink}
            onChange={(e) => setGdriveLink(e.target.value)}
            disabled={sendingGDrive}
            className="flex-1 bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-xl"
          />
          <Button onClick={handleSendGDrive} disabled={sendingGDrive || !gdriveLink.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer whitespace-nowrap px-6 py-2 rounded-xl transition duration-205">
            {sendingGDrive ? "Mengirim..." : "Kirim Tautan"}
          </Button>
        </div>
      </div>

      {/* PRINT SELECTION VIEW FOR PHOTOGRAPHER */}
      {initialPrintSelection && (
        <div className="p-6 border rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-900/30 shadow-sm space-y-3">
          <h3 className="font-bold text-lg text-indigo-900 dark:text-indigo-400">Pilihan Cetak Fisik Pelanggan</h3>
          <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
            Berikut adalah daftar nama file atau foto yang dipilih oleh pelanggan untuk dicetak fisik:
          </p>
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-indigo-100 dark:border-indigo-950 font-mono text-sm text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">
            {initialPrintSelection}
          </div>
        </div>
      )}
    </div>
  );
}
