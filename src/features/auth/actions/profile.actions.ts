"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUserProfile() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, message: "Anda harus login untuk memuat profil." };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        images: {
          take: 1,
          select: { url: true }
        }
      }
    });

    if (!user) {
      return { success: false, message: "Pengguna tidak ditemukan." };
    }

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || "",
        imageUrl: user.images?.[0]?.url || ""
      }
    };
  } catch (error: any) {
    console.error("getUserProfile error:", error);
    return { success: false, message: error.message || "Gagal memuat profil" };
  }
}

export async function updateUserProfile(data: { name: string; email: string; phoneNumber: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, message: "Unauthorized: Silakan login terlebih dahulu." };
    }

    const { name, email, phoneNumber } = data;

    if (!name || !email) {
      return { success: false, message: "Nama dan email wajib diisi." };
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: session.user.id }
      }
    });

    if (existingUser) {
      return { success: false, message: "Email sudah digunakan oleh pengguna lain." };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
        phoneNumber
      }
    });

    // Revalidate paths to update cache on UI layouts
    revalidatePath("/admin");
    revalidatePath("/fotografer");
    revalidatePath("/dashboard");
    revalidatePath("/booking");
    revalidatePath("/");

    return { success: true, message: "Profil berhasil diperbarui." };
  } catch (error: any) {
    console.error("updateUserProfile error:", error);
    return { success: false, message: "Gagal memperbarui profil: " + error.message };
  }
}
