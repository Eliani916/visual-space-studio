"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  paymentStatus?: string;
  bookingStatus?: string;
  packageId?: string;
}

export async function getReportData(filters: ReportFilter = {}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized. Akses ditolak." };
    }

    const { startDate, endDate, paymentStatus, bookingStatus, packageId } = filters;

    // Build the query where clause
    const whereClause: any = {};

    // 1. Date Range Filter
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    // 2. Booking Status Filter
    if (bookingStatus && bookingStatus !== "ALL") {
      whereClause.status = bookingStatus;
    }

    // 3. Package Filter
    if (packageId && packageId !== "ALL") {
      whereClause.packageId = packageId;
    }

    // 4. Payment Status Filter
    if (paymentStatus && paymentStatus !== "ALL") {
      whereClause.payment = {
        status: paymentStatus,
      };
    }

    // Fetch the bookings
    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, email: true },
        },
        package: {
          select: { name: true, price: true },
        },
        payment: {
          select: { amount: true, status: true, method: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate Summaries
    let totalGrossRevenue = 0; // Total dari harga paket (totalPrice)
    let totalNetRevenue = 0;   // Total dari pembayaran yang sudah masuk (payment.amount jika lunas/DP)
    let totalTransactions = bookings.length;
    
    const packageCountMap: Record<string, { count: number, name: string }> = {};

    bookings.forEach(b => {
      // Gross Revenue: Sum of all totalPrices regardless of status (or maybe only successful ones?)
      // We will sum gross for all non-cancelled bookings.
      if (b.status !== "CANCELLED" && b.status !== "EXPIRED") {
        totalGrossRevenue += Number(b.totalPrice);
        
        // Net Revenue: Sum of actual payments made
        if (b.payment?.status === "LUNAS" || b.payment?.status === "DP") {
          totalNetRevenue += Number(b.payment.amount);
        }

        // Top Packages Logic
        if (packageCountMap[b.package.name]) {
          packageCountMap[b.package.name].count++;
        } else {
          packageCountMap[b.package.name] = { count: 1, name: b.package.name };
        }
      }
    });

    // Sort Top Packages
    const topPackages = Object.values(packageCountMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // Get top 3

    // Convert Decimals and Dates to plain types for Client Component
    const plainBookings = bookings.map(b => ({
      ...b,
      totalPrice: Number(b.totalPrice),
      discountAmount: b.discountAmount ? Number(b.discountAmount) : null,
      bookingDate: b.bookingDate.toISOString(),
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      deletedAt: b.deletedAt ? b.deletedAt.toISOString() : null,
      payment: b.payment ? {
        ...b.payment,
        amount: Number(b.payment.amount),
      } : null,
      package: {
        ...b.package,
        price: Number(b.package.price),
      }
    }));

    return {
      success: true,
      data: {
        bookings: plainBookings,
        summary: {
          totalGrossRevenue,
          totalNetRevenue,
          totalTransactions,
          topPackages
        }
      },
    };
  } catch (error: any) {
    console.error("[GET_REPORT_DATA_ERROR]", error);
    return { success: false, message: error.message || "Terjadi kesalahan internal" };
  }
}

// Additional function to just fetch all active packages for the filter dropdown
export async function getPackagesForFilter() {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    });
    return { success: true, data: packages };
  } catch (error) {
    return { success: false, data: [] };
  }
}
