import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import CustomerGallery from "@/features/gallery/components/CustomerGallery";
import CustomerBookingDetailClient from "./CustomerBookingDetailClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function CustomerBookingDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "PELANGGAN") {
    redirect("/login");
  }

  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { package: true, payment: true },
  });

  if (!booking || booking.userId !== session.user.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <p className="text-slate-500 font-medium">Booking tidak ditemukan.</p>
      </div>
    );
  }

  // Serialize Decimal & Date fields to avoid RSC serialization errors
  const serializedBooking = JSON.parse(JSON.stringify(booking));

  return (
    <div className="space-y-4">
      <CustomerBookingDetailClient booking={serializedBooking} />
      
      {booking.status === "COMPLETED" ? (
        <div className="max-w-5xl mx-auto px-6 sm:px-8 pb-12">
          <CustomerGallery bookingId={booking.id} />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-6 sm:px-8 pb-12">
          <div className="bg-slate-100 dark:bg-zinc-900/40 p-8 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-500 dark:text-zinc-500">
            Galeri foto digital (Soft File) Anda akan otomatis muncul di sini setelah sesi foto Anda selesai dilaksanakan (Status Booking: COMPLETED).
          </div>
        </div>
      )}
    </div>
  );
}
