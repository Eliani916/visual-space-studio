"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { bookingSchema, BookingInput } from "@/validations/booking.schema";
import { createTransaction } from "@/services/midtrans.service";
import { getSettings } from "./settings.actions";
import { pusherServer } from "@/lib/pusher";

function addMinutesToTime(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + mins);
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function checkTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  return (start1 < end2) && (start2 < end1);
}

export async function createBooking(data: BookingInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Anda harus login untuk melakukan booking");
    }

    const validatedData = bookingSchema.parse(data);

    // Get settings
    const settingsRes = await getSettings();
    if (!settingsRes.success || !settingsRes.data) {
      throw new Error("Gagal memuat pengaturan sistem");
    }
    const settings = settingsRes.data;

    // Validate opening hours
    if (validatedData.bookingTime < settings.openingHour || validatedData.bookingTime > settings.closingHour) {
      throw new Error(`Jam booking harus antara ${settings.openingHour} - ${settings.closingHour}`);
    }

    // Validate Date and calculation
    const bookingDateObj = new Date(`${validatedData.bookingDate}T${validatedData.bookingTime}:00`);
    const now = new Date();
    const diffTime = bookingDateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      throw new Error("Tanggal booking tidak valid (harus di masa depan)");
    }

    // Run the booking check, insert, and Midtrans transaction creation in a single database transaction.
    // If Midtrans API call fails, the database inserts are rolled back.
    // Serializable isolation level ensures that concurrent bookings for the same slot serialize, preventing race conditions.
    const result = await prisma.$transaction(async (tx) => {
      // Check payment method constraints
      if (diffDays >= settings.dpMinDaysAhead && validatedData.paymentMethod === "CASH") {
        throw new Error(`Booking H-${settings.dpMinDaysAhead} atau lebih wajib menggunakan transfer (DP)`);
      }

      // Get package price and duration
      const pkg = await tx.package.findUnique({ where: { id: validatedData.packageId } });
      if (!pkg) throw new Error("Paket tidak ditemukan");

      const packagePrice = Number(pkg.price);
      const duration = pkg.duration || 60;
      const endTime = addMinutesToTime(validatedData.bookingTime, duration);

      // Check Studio overlap
      if (pkg.studioId) {
        const studioBookings = await tx.booking.findMany({
          where: {
            bookingDate: new Date(validatedData.bookingDate),
            status: { notIn: ["EXPIRED", "CANCELLED"] },
            package: { studioId: pkg.studioId }
          },
          include: { package: true }
        });
        
        const isStudioBusy = studioBookings.some(b => checkTimeOverlap(validatedData.bookingTime, endTime, b.bookingTime, b.endTime || addMinutesToTime(b.bookingTime, b.package.duration || 60)));
        if (isStudioBusy) {
          throw new Error("Studio yang dipilih sudah digunakan pada jadwal tersebut.");
        }
      }

      // 1. Get active photographers
      const activePhotographers = await tx.photographerProfile.findMany({
        where: { status: "AVAILABLE" },
        include: { user: true }
      });

      if (activePhotographers.length === 0) {
        throw new Error("Tidak ada fotografer yang tersedia pada jam yang dipilih.");
      }

      // 2. Get bookings on this date to find busy photographers
      const dailyBookings = await tx.booking.findMany({
        where: {
          bookingDate: new Date(validatedData.bookingDate),
          status: {
            notIn: ["EXPIRED", "CANCELLED"]
          },
          photographerId: {
            not: null
          }
        },
        include: { package: true }
      });

      // Filter busy bookings that overlap with requested time
      const overlappingBookings = dailyBookings.filter(b => checkTimeOverlap(validatedData.bookingTime, endTime, b.bookingTime, b.endTime || addMinutesToTime(b.bookingTime, b.package.duration || 60)));
      const busyPhotographerIds = overlappingBookings.map(b => b.photographerId);

      // Find a photographer who is free
      const freePhotographer = activePhotographers.find(p => !busyPhotographerIds.includes(p.user.id));

      if (!freePhotographer) {
        throw new Error("Slot penuh (semua fotografer telah digunakan).");
      }

      // Validate promo code from database (Promo feature removed)
      let discountAmount = 0;

      const finalTotalPrice = packagePrice - discountAmount;

      const isDp = validatedData.paymentMethod === "TRANSFER" && validatedData.paymentType === "DP";
      const paymentAmount = isDp ? finalTotalPrice * 0.5 : finalTotalPrice;

      // Create Booking inside transaction
      const newBooking = await tx.booking.create({
        data: {
          userId: session.user.id,
          packageId: pkg.id,
          photographerId: freePhotographer.user.id,
          bookingDate: new Date(validatedData.bookingDate),
          bookingTime: validatedData.bookingTime,
          endTime: endTime,
          totalPrice: finalTotalPrice,
          promoCode: validatedData.promoCode || null,
          discountAmount: discountAmount > 0 ? discountAmount : null,
          status: "PENDING",
          payment: {
            create: {
              method: validatedData.paymentMethod,
              amount: paymentAmount,
              status: "PENDING"
            }
          }
        },
        include: {
          payment: true
        }
      });

      // If TRANSFER, generate Midtrans Token
      let token = null;
      let redirectUrl = null;

      if (validatedData.paymentMethod === "TRANSFER" && newBooking.payment) {
        const customerDetails = {
          first_name: session.user.name,
          email: session.user.email,
        };
        
        const itemDetails = [{
          id: pkg.id,
          price: Number(newBooking.payment.amount),
          quantity: 1,
          name: isDp ? `DP (50%): ${pkg.name}` : `Lunas: ${pkg.name}`
        }];

        const midtransTx = await createTransaction(
          newBooking.payment.id, 
          Number(newBooking.payment.amount), 
          customerDetails, 
          itemDetails
        );

        token = midtransTx.token;
        redirectUrl = midtransTx.redirect_url;

        // Save token in proofUrl for later retrieval
        await tx.payment.update({
          where: { id: newBooking.payment.id },
          data: { proofUrl: token }
        });
      }

      return {
        bookingId: newBooking.id,
        token,
        redirectUrl
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 15000 // 15 seconds to allow for Midtrans API call
    });

    // Trigger Pusher event
    try {
      await pusherServer.trigger("calendar-channel", "calendar-updated", {
        message: "Jadwal booking baru ditambahkan"
      });
    } catch (err) {
      console.error("Failed to trigger Pusher for booking creation:", err);
    }

    return { 
      success: true, 
      data: result
    };
  } catch (error: any) {
    console.error("Create Booking Error:", error.message);
    return { success: false, message: error.message || "Gagal membuat booking" };
  }
}

export async function getAvailableTimes(dateStr: string) {
  try {
    const settingsRes = await getSettings();
    if (!settingsRes.success || !settingsRes.data) throw new Error("Gagal load settings");
    const settings = settingsRes.data;
    
    // Generate all hourly slots from openingHour to closingHour
    const startHour = parseInt(settings.openingHour.split(":")[0]);
    const endHour = parseInt(settings.closingHour.split(":")[0]);
    const allSlots = [];
    
    for (let h = startHour; h < endHour; h++) {
      allSlots.push(`${h.toString().padStart(2, "0")}:00`);
    }

    // Get active photographers count
    const photographerCount = await prisma.photographerProfile.count({
      where: { status: "AVAILABLE" }
    });

    // Get bookings count per time slot for this date
    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: new Date(dateStr),
        status: { notIn: ["EXPIRED", "CANCELLED"] },
        photographerId: { not: null }
      },
      include: { package: true }
    });

    // A slot is available if its active booking count is less than the total photographer count
    const availableSlots = allSlots.filter(slot => {
      const slotEnd = addMinutesToTime(slot, 60);
      const overlaps = bookings.filter(b => checkTimeOverlap(slot, slotEnd, b.bookingTime, b.endTime || addMinutesToTime(b.bookingTime, b.package.duration || 60)));
      return overlaps.length < photographerCount;
    });
    return { success: true, data: availableSlots };
  } catch (error) {
    console.error("Get Available Times Error:", error);
    return { success: false, data: [] };
  }
}

export async function getCalendarBookingsStatus(year: number, month: number) {
  try {
    const settingsRes = await getSettings();
    if (!settingsRes.success || !settingsRes.data) throw new Error("Gagal load settings");
    const settings = settingsRes.data;

    // Opening & closing hour bounds
    const startHour = parseInt(settings.openingHour.split(":")[0]);
    const endHour = parseInt(settings.closingHour.split(":")[0]);
    
    // Total active photographers count
    const photographerCount = await prisma.photographerProfile.count({
      where: { status: "AVAILABLE" }
    });

    // Date range for the requested month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1); // 1st of next month (exclusive)

    // Get bookings in that month
    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: {
          gte: startDate,
          lt: endDate
        },
        status: { notIn: ["EXPIRED", "CANCELLED"] },
        photographerId: { not: null }
      },
      select: {
        bookingDate: true,
        bookingTime: true
      }
    });

    // Map bookings to format YYYY-MM-DD
    const formattedBookings = bookings.map(b => {
      const date = b.bookingDate;
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, "0");
      const d = date.getDate().toString().padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      const timeStr = b.bookingTime.substring(0, 5);
      return { date: dateStr, time: timeStr };
    });

    return {
      success: true,
      data: {
        bookings: formattedBookings,
        photographerCount,
        openingHour: settings.openingHour,
        closingHour: settings.closingHour
      }
    };
  } catch (error: any) {
    console.error("Get Calendar Bookings Status Error:", error);
    return { success: false, message: error.message || "Gagal memuat status kalender" };
  }
}

export async function generateRemainingPaymentToken(bookingId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Anda harus login untuk melakukan transaksi");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, package: true, user: true }
    });

    if (!booking) throw new Error("Booking tidak ditemukan");
    if (!booking.payment) throw new Error("Pembayaran tidak ditemukan");
    if (booking.payment.status !== "DP") {
      throw new Error("Pemesanan ini tidak memiliki tagihan sisa (status bukan DP)");
    }

    const remainingAmount = Number(booking.totalPrice) - Number(booking.payment.amount);

    if (remainingAmount <= 0) {
      throw new Error("Tagihan sisa tidak valid");
    }

    const customerDetails = {
      first_name: booking.user.name,
      email: booking.user.email,
    };

    const itemDetails = [{
      id: booking.package.id,
      price: remainingAmount,
      quantity: 1,
      name: `Pelunasan (50%): ${booking.package.name}`
    }];

    // Suffix order ID with '-remaining' to satisfy Midtrans unique ID constraint
    const midtransTx = await createTransaction(
      `${booking.payment.id}-remaining`,
      remainingAmount,
      customerDetails,
      itemDetails
    );

    const token = midtransTx.token;
    const redirectUrl = midtransTx.redirect_url;

    // Update payment's proofUrl with the remaining payment token
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: { proofUrl: token }
    });

    return {
      success: true,
      data: {
        token,
        redirectUrl
      }
    };
  } catch (error: any) {
    console.error("Generate Remaining Payment Token Error:", error.message);
    return { success: false, message: error.message || "Gagal membuat transaksi pelunasan" };
  }
}

export async function rescheduleBooking(bookingId: string, newDate: string, newTime: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Anda harus login untuk menjadwal ulang");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true }
    });

    if (!booking) throw new Error("Booking tidak ditemukan");
    
    // Check ownership or admin
    if (booking.userId !== session.user.id && session.user.role !== "ADMIN") {
      throw new Error("Anda tidak memiliki akses ke pemesanan ini");
    }

    if (booking.status !== "CONFIRMED") {
      throw new Error("Hanya pemesanan terkonfirmasi yang dapat dijadwal ulang");
    }

    // Check Condition: if bookingDate is in the past, it must be <= 3 days ago.
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sessionDate = new Date(booking.bookingDate);
    const diffTime = todayDate.getTime() - sessionDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Days elapsed since the session date

    if (diffDays > 3) {
      throw new Error("Waktu booking sudah lewat dari 3 hari dari jadwal seharusnya, reschedule tidak diizinkan (Status Hangus)");
    }

    // Check if newDate and newTime has available slot
    const getTimesRes = await getAvailableTimes(newDate);
    if (!getTimesRes.success || !getTimesRes.data) {
      throw new Error("Gagal memeriksa ketersediaan slot waktu");
    }

    if (!getTimesRes.data.includes(newTime)) {
      throw new Error("Slot waktu terpilih sudah penuh atau tidak tersedia");
    }

    // Since we are rescheduling, find a free photographer for the new slot
    const activePhotographers = await prisma.photographerProfile.findMany({
      where: { status: "AVAILABLE" },
      include: { user: true }
    });

    const duration = booking.package?.duration || 60;
    const endTime = addMinutesToTime(newTime, duration);

    const dailyBookings = await prisma.booking.findMany({
      where: {
        bookingDate: new Date(newDate),
        status: { notIn: ["EXPIRED", "CANCELLED"] },
        photographerId: { not: null },
        id: { not: bookingId }
      },
      include: { package: true }
    });

    const overlappingBookings = dailyBookings.filter(b => checkTimeOverlap(newTime, endTime, b.bookingTime, b.endTime || addMinutesToTime(b.bookingTime, b.package.duration || 60)));
    const busyPhotographerIds = overlappingBookings.map(b => b.photographerId);
    
    const freePhotographer = activePhotographers.find(p => !busyPhotographerIds.includes(p.user.id));

    if (!freePhotographer) {
      throw new Error("Tidak ada fotografer yang tersedia untuk slot waktu ini");
    }

    // Update bookingDate, bookingTime, endTime and photographerId
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          bookingDate: new Date(newDate),
          bookingTime: newTime,
          endTime: endTime,
          photographerId: freePhotographer.user.id
        }
      });

      // If there is an existing queue, reset/delete it so that they must check-in again for the new date
      await tx.queue.deleteMany({
        where: { bookingId }
      });
    });

    // Trigger Pusher
    try {
      await pusherServer.trigger("calendar-channel", "calendar-updated", {
        message: "Jadwal booking berhasil di-reschedule"
      });
    } catch (err) {
      console.error("Failed to trigger Pusher inside rescheduleBooking:", err);
    }

    return { success: true, message: "Berhasil menjadwal ulang sesi foto!" };
  } catch (error: any) {
    console.error("Reschedule Booking Error:", error.message);
    return { success: false, message: error.message || "Gagal menjadwal ulang" };
  }
}

export async function cancelBooking(bookingId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Anda harus login untuk membatalkan pesanan");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true }
    });

    if (!booking) throw new Error("Booking tidak ditemukan");
    
    // Check ownership or admin
    if (booking.userId !== session.user.id && session.user.role !== "ADMIN") {
      throw new Error("Anda tidak memiliki akses ke pemesanan ini");
    }

    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
      throw new Error("Hanya pemesanan dengan status PENDING atau CONFIRMED yang dapat dibatalkan");
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          photographerId: null // release the photographer slot
        }
      });

      await tx.queue.deleteMany({
        where: { bookingId }
      });
    });

    // Trigger Pusher
    try {
      await pusherServer.trigger("calendar-channel", "calendar-updated", {
        message: "Sebuah jadwal booking telah dibatalkan"
      });
    } catch (err) {
      console.error("Failed to trigger Pusher inside cancelBooking:", err);
    }

    return { success: true, message: "Pemesanan berhasil dibatalkan." };
  } catch (error: any) {
    console.error("Cancel Booking Error:", error.message);
    return { success: false, message: error.message || "Gagal membatalkan pemesanan" };
  }
}
