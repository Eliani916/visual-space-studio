import BookingForm from "@/features/booking/components/BookingForm";
import { getSettings } from "@/features/booking/actions/settings.actions";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Camera } from "lucide-react";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Booking Paket Foto | Visual Space",
};

export default async function BookingPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const settingsRes = await getSettings();
  const settings = settingsRes.success && settingsRes.data ? settingsRes.data : { dpMinDaysAhead: 7 };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative overflow-hidden flex flex-col items-center justify-center py-12 px-4 dark">
      {/* Decorative Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        {/* Back Link & Logo */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-200 transition inline-flex items-center gap-1.5">
            &larr; Kembali ke Beranda
          </Link>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-500/20">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              VISUAL SPACE
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Booking Studio</h1>
          <p className="text-slate-400 text-sm mt-2">Pilih paket, tentukan tanggal, dan selesaikan pembayaran untuk mengamankan jadwal Anda.</p>
        </div>

        <BookingForm settings={settings} />
      </div>
    </div>
  );
}

