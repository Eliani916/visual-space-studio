"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { pusherServer } from "@/lib/pusher";

export async function getAdminBookings() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        package: true,
        payment: true,
        queue: true,
      },
      orderBy: [
        { bookingDate: 'desc' },
        { bookingTime: 'asc' }
      ],
      take: 100, // For demo, we just take 100
    });

    return { success: true, data: JSON.parse(JSON.stringify(bookings)) };
  } catch (error) {
    console.error("Get Admin Bookings Error:", error);
    return { success: false, data: [] };
  }
}

export async function confirmPendingCashBooking(bookingId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, package: true, payment: true }
    });

    if (!booking) throw new Error("Booking tidak ditemukan");
    if (booking.status !== "PENDING") throw new Error("Booking sudah tidak pending");
    if (booking.payment?.method !== "CASH") throw new Error("Metode pembayaran bukan CASH");

    // Start transaction to check in and mark LUNAS
    const queue = await prisma.$transaction(async (tx) => {
      // Update payment to LUNAS
      await tx.payment.update({
        where: { bookingId },
        data: { status: "LUNAS" }
      });

      // Update booking to CONFIRMED
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" }
      });

      // Create queue
      return await tx.queue.upsert({
        where: { bookingId },
        update: { status: "WAITING", checkInTime: new Date() },
        create: { bookingId, status: "WAITING", checkInTime: new Date() }
      });
    });

    // Trigger Pusher
    try {
      await pusherServer.trigger("photographer-dashboard", "queue-updated", {
        queueId: queue.id,
        customerName: booking.user.name,
        packageName: booking.package.name,
        time: queue.checkInTime,
        status: queue.status
      });
      await pusherServer.trigger("calendar-channel", "calendar-updated", {
        message: "Jadwal booking cash dikonfirmasi"
      });
    } catch (err) {
      console.error("Failed to trigger Pusher inside confirmPendingCashBooking:", err);
    }

    return { success: true, message: "Booking cash berhasil dikonfirmasi dan check-in!" };
  } catch (error: any) {
    console.error("Confirm Pending Cash Booking Error:", error.message);
    return { success: false, message: error.message || "Gagal konfirmasi booking cash" };
  }
}

export async function confirmRemainingCashPayment(bookingId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true }
    });

    if (!booking) throw new Error("Booking tidak ditemukan");
    if (!booking.payment) throw new Error("Pembayaran tidak ditemukan");
    if (booking.payment.status !== "DP") {
      throw new Error("Pemesanan ini tidak berstatus DP");
    }

    // Update payment status to LUNAS and amount to full totalPrice
    await prisma.payment.update({
      where: { bookingId },
      data: { 
        status: "LUNAS",
        amount: booking.totalPrice
      }
    });

    return { success: true, message: "Pelunasan cash berhasil dikonfirmasi!" };
  } catch (error: any) {
    console.error("Confirm Remaining Cash Payment Error:", error.message);
    return { success: false, message: error.message || "Gagal konfirmasi pelunasan" };
  }
}
