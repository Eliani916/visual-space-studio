"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function sendGDriveLink(bookingId: string, link: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "FOTOGRAFER" && session.user.role !== "ADMIN")) {
      throw new Error("Unauthorized: Hanya Fotografer atau Admin yang dapat mengirim link");
    }

    if (!link || !link.startsWith("http")) {
      throw new Error("Format link Google Drive tidak valid (harus diawali http/https)");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking) {
      throw new Error("Booking tidak ditemukan");
    }

    // Update GDrive link in Booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: { gdriveLink: link },
    });

    // Mock Email Send
    console.log(`[EMAIL SEND] Mengirim link GDrive ke email ${booking.user.email}: ${link}`);

    revalidatePath(`/fotografer/gallery/${bookingId}`);
    revalidatePath(`/dashboard/${bookingId}`);
    
    return { success: true, message: "Link Google Drive berhasil dikirim ke email pelanggan." };
  } catch (error: any) {
    console.error("Send GDrive Link Error:", error.message);
    return { success: false, message: error.message || "Gagal menyimpan link Google Drive" };
  }
}

export async function submitBookingReview(bookingId: string, rating: number, comment: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PELANGGAN") {
      throw new Error("Unauthorized: Hanya Pelanggan yang dapat memberikan ulasan");
    }

    if (!rating || rating < 1 || rating > 5) {
      throw new Error("Rating harus bernilai antara 1 sampai 5 bintang");
    }

    if (!comment || comment.trim() === "") {
      throw new Error("Komentar ulasan wajib diisi");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== session.user.id) {
      throw new Error("Booking tidak ditemukan atau Anda tidak berwenang");
    }

    // Save review in Booking model
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        reviewRating: rating,
        reviewComment: comment,
      },
    });

    revalidatePath(`/dashboard/${bookingId}`);
    
    return { success: true, message: "Terima kasih atas ulasan Anda! Akses Google Drive terbuka." };
  } catch (error: any) {
    console.error("Submit Review Error:", error.message);
    return { success: false, message: error.message || "Gagal mengirimkan ulasan" };
  }
}
