import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function FotograferHistoryPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "FOTOGRAFER") {
    redirect("/login");
  }

  const completedBookings = await prisma.booking.findMany({
    where: { status: "COMPLETED" },
    include: { user: true, package: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div className="container mx-auto p-8">

      <div className="grid gap-4">
        {completedBookings.map(b => (
          <div key={b.id} className="p-4 border rounded shadow-sm flex justify-between items-center">
            <div>
              <p className="font-semibold text-lg">{b.user.name}</p>
              <p className="text-sm text-gray-600">{b.package.name} - {new Date(b.bookingDate).toLocaleDateString('id-ID')} {b.bookingTime}</p>
            </div>
            <Link href={`/fotografer/gallery/${b.id}`}>
              <Button>Upload / Kelola Galeri</Button>
            </Link>
          </div>
        ))}
        {completedBookings.length === 0 && (
          <p className="text-gray-500">Belum ada sesi yang selesai.</p>
        )}
      </div>
    </div>
  );
}
