import UploadGallery from "@/features/gallery/components/UploadGallery";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function FotograferGalleryPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "FOTOGRAFER") {
    redirect("/login");
  }

  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { user: true, package: true }
  });

  if (!booking) {
    return <div>Booking tidak ditemukan</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 bg-blue-50 dark:bg-indigo-950/40 p-4 rounded border border-blue-200 dark:border-indigo-900/40">
        <p><strong>Pelanggan:</strong> {booking.user.name}</p>
        <p><strong>Paket:</strong> {booking.package.name}</p>
        <p><strong>Status:</strong> {booking.status}</p>
        {booking.printSelection && (
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-indigo-900/40">
            <p className="text-indigo-900 dark:text-indigo-300"><strong>Pilihan Cetak Pelanggan:</strong> {booking.printSelection}</p>
          </div>
        )}
      </div>

      <UploadGallery bookingId={bookingId} initialGDriveLink={booking.gdriveLink || ""} initialPrintSelection={booking.printSelection || ""} />
    </div>
  );
}
