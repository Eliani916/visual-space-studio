import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSettings } from "@/features/booking/actions/settings.actions";
import { pusherServer } from "@/lib/pusher";

export async function GET() {
  try {
    const settingsRes = await getSettings();
    if (!settingsRes.success || !settingsRes.data) {
      throw new Error("Gagal mengambil pengaturan");
    }
    const settings = settingsRes.data;

    const dpDeadlineHours = settings.dpDeadlineHours;
    const now = new Date();
    
    // Calculate the cut-off time (e.g. 24 hours ago)
    const cutOffTime = new Date(now.getTime() - (dpDeadlineHours * 60 * 60 * 1000));

    // 1. Find all pending TRANSFER bookings created before the cutOffTime (e.g., 24 hours ago)
    const expiredTransferBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        payment: {
          method: "TRANSFER"
        },
        createdAt: {
          lt: cutOffTime,
        },
      },
    });

    // 2. Find all pending CASH bookings where the bookingDate is within dpMinDaysAhead days (e.g., H-7)
    // and was created at least dpDeadlineHours hours ago (cutOffTime) to allow a 24-hour payment/grace window.
    const cashCutOffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + settings.dpMinDaysAhead);
    
    const expiredCashBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        payment: {
          method: "CASH"
        },
        bookingDate: {
          lte: cashCutOffDate
        },
        createdAt: {
          lt: cutOffTime
        }
      }
    });

    // 3. Find all CONFIRMED bookings where bookingDate is more than 3 days ago
    const threeDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
    const expiredLateBookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        bookingDate: {
          lt: threeDaysAgo,
        },
      },
    });

    const allExpired = [...expiredTransferBookings, ...expiredCashBookings];
    const lateExpiredIds = expiredLateBookings.map((b) => b.id);
    const allExpiredIds = [...allExpired.map(b => b.id), ...lateExpiredIds];

    if (allExpiredIds.length > 0) {
      await prisma.$transaction([
        prisma.booking.updateMany({
          where: { id: { in: allExpiredIds } },
          data: { status: "EXPIRED" },
        }),
        prisma.payment.updateMany({
          where: { bookingId: { in: allExpired.map((b) => b.id) } },
          data: { status: "GAGAL" },
        }),
      ]);

      // Trigger Pusher event
      try {
        await pusherServer.trigger("calendar-channel", "calendar-updated", {
          message: "Jadwal booking kedaluwarsa"
        });
      } catch (err) {
        console.error("Failed to trigger Pusher inside Cron:", err);
      }
    }

    return NextResponse.json({ success: true, message: `Expired ${allExpired.length} pending bookings and ${expiredLateBookings.length} late bookings.` });
  } catch (error: any) {
    console.error("Cron Expire Booking Error:", error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
