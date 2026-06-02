"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { revalidatePath } from "next/cache";

export async function checkInCustomer(bookingId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: Only Admin can check in customers");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, package: true },
    });

    if (!booking) throw new Error("Booking tidak ditemukan");
    if (booking.status !== "CONFIRMED") throw new Error("Booking belum dikonfirmasi atau sudah kadaluarsa");

    // Create or update queue
    const queue = await prisma.queue.upsert({
      where: { bookingId },
      update: { status: "WAITING", checkInTime: new Date() },
      create: {
        bookingId,
        status: "WAITING",
        checkInTime: new Date(),
      },
      include: {
        booking: {
          include: { user: true, package: true }
        }
      }
    });

    // Keep booking status as CONFIRMED when checked-in (just in queue)

    // Trigger Pusher event
    await pusherServer.trigger("photographer-dashboard", "queue-updated", {
      queueId: queue.id,
      customerName: booking.user.name,
      packageName: booking.package.name,
      time: queue.checkInTime,
      status: queue.status,
    });

    revalidatePath("/admin/bookings");
    return { success: true, message: "Check-in berhasil" };
  } catch (error: any) {
    console.error("Check-in Error:", error.message);
    return { success: false, message: error.message };
  }
}

export async function getActiveQueue() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const queues = await prisma.queue.findMany({
      where: {
        status: { in: ["WAITING", "IN_PROGRESS"] },
      },
      include: {
        booking: {
          include: { user: true, package: true }
        }
      },
      orderBy: { checkInTime: "asc" },
    });

    return { success: true, data: JSON.parse(JSON.stringify(queues)) };
  } catch (error) {
    console.error("Get Active Queue Error:", error);
    return { success: false, data: [] };
  }
}

export async function updateQueueStatus(queueId: string, status: "WAITING" | "IN_PROGRESS" | "FINISHED") {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "FOTOGRAFER" && session.user.role !== "ADMIN")) {
      throw new Error("Unauthorized");
    }

    const queue = await prisma.queue.update({
      where: { id: queueId },
      data: { status },
      include: { booking: true }
    });

    if (status === "IN_PROGRESS") {
      await prisma.booking.update({
        where: { id: queue.bookingId },
        data: { status: "ON_PROGRESS" }
      });
    }

    if (status === "FINISHED") {
      await prisma.booking.update({
        where: { id: queue.bookingId },
        data: { status: "COMPLETED" }
      });
    }

    // Notify other clients that queue has updated
    await pusherServer.trigger("photographer-dashboard", "queue-updated", {
      queueId,
      status
    });

    revalidatePath("/fotografer/dashboard");
    revalidatePath("/admin/queues");
    return { success: true };
  } catch (error: any) {
    console.error("Update Queue Status Error:", error.message);
    return { success: false, message: error.message };
  }
}

export async function getQueueSessions() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "FOTOGRAFER")) {
      throw new Error("Unauthorized");
    }

    const sessions = await prisma.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "ON_PROGRESS", "COMPLETED"] }
      },
      include: {
        user: true,
        package: true,
        queue: true,
      },
      orderBy: [
        { bookingDate: 'desc' },
        { bookingTime: 'asc' }
      ],
    });

    return { success: true, data: JSON.parse(JSON.stringify(sessions)) };
  } catch (error: any) {
    console.error("Get Queue Sessions Error:", error.message);
    return { success: false, data: [] };
  }
}
