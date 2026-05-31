import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminDashboardClient from "./AdminDashboardClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Analitik | Visual Space Admin",
};

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // 1. Fetch successful payments (LUNAS / DP) with amounts and creation dates
  const payments = await prisma.payment.findMany({
    where: { status: { in: ["LUNAS", "DP"] } },
    select: { 
      amount: true,
      createdAt: true
    }
  });
  
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  // 2. Booking Stats
  const totalBookings = await prisma.booking.count({
    where: { deletedAt: null }
  });
  const completedBookings = await prisma.booking.count({ 
    where: { status: "COMPLETED", deletedAt: null } 
  });
  const pendingBookings = await prisma.booking.count({ 
    where: { status: "PENDING", deletedAt: null } 
  });

  // 3. Recent Bookings (limit to 5)
  const recentBookings = await prisma.booking.findMany({
    where: { deletedAt: null },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { user: true, package: true }
  });

  // Serialize datasets to plain JSON objects for RSC -> RCC transmission
  const serializedPayments = payments.map(p => ({
    amount: Number(p.amount),
    createdAt: p.createdAt.toISOString()
  }));

  const serializedRecentBookings = recentBookings.map(b => ({
    id: b.id,
    user: { name: b.user.name },
    package: { name: b.package.name },
    bookingDate: b.bookingDate.toISOString(),
    bookingTime: b.bookingTime,
    status: b.status
  }));

  return (
    <AdminDashboardClient
      totalRevenue={totalRevenue}
      totalBookings={totalBookings}
      completedBookings={completedBookings}
      pendingBookings={pendingBookings}
      recentBookings={serializedRecentBookings}
      payments={serializedPayments}
    />
  );
}
