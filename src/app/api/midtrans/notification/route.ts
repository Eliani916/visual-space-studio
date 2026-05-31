import { NextResponse } from "next/server";
import { coreApi } from "@/services/midtrans.service";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const notificationJson = await req.json();

    // Verify signature key
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const signatureKey = crypto.createHash('sha512').update(
      `${notificationJson.order_id}${notificationJson.status_code}${notificationJson.gross_amount}${serverKey}`
    ).digest('hex');

    if (signatureKey !== notificationJson.signature_key) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
    }

    const orderId = notificationJson.order_id;
    const isRemainingPayment = orderId.endsWith("-remaining");
    const paymentId = isRemainingPayment ? orderId.replace("-remaining", "") : orderId;

    const transactionStatus = notificationJson.transaction_status;
    const fraudStatus = notificationJson.fraud_status;

    let newStatus = "PENDING";
    let bookingStatus = "PENDING";

    if (transactionStatus === 'capture'){
      if (fraudStatus === 'challenge'){
        newStatus = "PENDING";
      } else if (fraudStatus === 'accept'){
        newStatus = "DP";
        bookingStatus = "CONFIRMED";
      }
    } else if (transactionStatus === 'settlement'){
      newStatus = "DP"; 
      bookingStatus = "CONFIRMED";
    } else if (transactionStatus === 'cancel' ||
      transactionStatus === 'deny' ||
      transactionStatus === 'expire'){
      newStatus = "GAGAL";
      bookingStatus = "EXPIRED";
    } else if (transactionStatus === 'pending'){
      newStatus = "PENDING";
    }

    // We get the payment to see if it's full or DP
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: { include: { package: true, user: true } } }
    });

    if (payment) {
      if (isRemainingPayment && (newStatus === "DP" || newStatus === "LUNAS")) {
        newStatus = "LUNAS";
        bookingStatus = payment.booking.status === "PENDING" ? "CONFIRMED" : payment.booking.status;
      } else if (newStatus === "DP") {
        if (Number(payment.amount) >= Number(payment.booking.totalPrice)) {
          newStatus = "LUNAS";
        }
        bookingStatus = payment.booking.status === "PENDING" ? "CONFIRMED" : payment.booking.status;
      }

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: { 
            status: newStatus as any,
            amount: newStatus === "LUNAS" ? payment.booking.totalPrice : payment.amount
          },
        });

        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: bookingStatus as any },
        });

        // Automatically create queue if status is ON_PROGRESS
        if (bookingStatus === "ON_PROGRESS") {
          const queue = await tx.queue.upsert({
            where: { bookingId: payment.bookingId },
            update: { status: "WAITING", checkInTime: new Date() },
            create: { bookingId: payment.bookingId, status: "WAITING", checkInTime: new Date() },
          });

          // Trigger Pusher event for photographer dashboard
          try {
            await pusherServer.trigger("photographer-dashboard", "queue-updated", {
              queueId: queue.id,
              customerName: payment.booking.user.name,
              packageName: payment.booking.package.name,
              time: queue.checkInTime,
              status: queue.status,
            });
          } catch (err) {
            console.error("Failed to trigger Pusher for photographer dashboard:", err);
          }
        }
      });

      // Trigger Pusher event
      try {
        await pusherServer.trigger("calendar-channel", "calendar-updated", {
          message: "Jadwal booking diperbarui dari Midtrans"
        });
      } catch (err) {
        console.error("Failed to trigger Pusher inside Midtrans webhook:", err);
      }
    }

    return NextResponse.json({ success: true, message: "OK" });
  } catch (error: any) {
    console.error("Midtrans Notification Error:", error.message);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
