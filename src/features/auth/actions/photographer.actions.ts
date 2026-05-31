"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Helper to enforce admin authorization
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Hanya Admin yang dapat melakukan aksi ini.");
  }
}

export async function getPhotographers() {
  try {
    await requireAdmin();

    const photographers = await prisma.user.findMany({
      where: {
        role: {
          name: "FOTOGRAFER",
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
        photographerProfile: true,
        images: {
          take: 1,
          select: { url: true }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: photographers };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function createPhotographer(data: any) {
  try {
    await requireAdmin();
    const { name, email, password, phoneNumber, imageUrl } = data;

    if (!name || !email || !password) {
      return { success: false, message: "Nama, email, dan kata sandi wajib diisi." };
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, message: "Email sudah terdaftar." };
    }

    // Check if phone number already exists
    if (phoneNumber && phoneNumber.trim() !== "") {
      const existingPhone = await prisma.user.findFirst({
        where: { phoneNumber },
      });

      if (existingPhone) {
        return { success: false, message: "Nomor telepon sudah terdaftar." };
      }
    }

    // Find the FOTOGRAFER role
    const role = await prisma.role.findUnique({
      where: { name: "FOTOGRAFER" },
    });

    if (!role) {
      return { success: false, message: "Role Fotografer tidak ditemukan di sistem." };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const photographer = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        phoneNumber,
        roleId: role.id,
        images: imageUrl ? {
          create: {
            url: imageUrl
          }
        } : undefined
      },
    });

    return { success: true, data: photographer };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updatePhotographer(id: string, data: any) {
  try {
    await requireAdmin();
    const { name, email, password, phoneNumber, imageUrl } = data;

    if (!name || !email) {
      return { success: false, message: "Nama dan email wajib diisi." };
    }

    // Check email uniqueness if email has changed
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id },
      },
    });

    if (existingUser) {
      return { success: false, message: "Email sudah digunakan oleh pengguna lain." };
    }

    // Check if phone number already exists for another user
    if (phoneNumber && phoneNumber.trim() !== "") {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phoneNumber,
          NOT: { id },
        },
      });

      if (existingPhone) {
        return { success: false, message: "Nomor telepon sudah digunakan oleh pengguna lain." };
      }
    }

    const updateData: any = {
      name,
      email,
      phoneNumber,
    };

    // Only update password if a new one is provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const photographer = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Handle avatar image update
    if (imageUrl !== undefined) {
      const existingImage = await prisma.image.findFirst({
        where: { userId: id }
      });

      if (existingImage) {
        if (imageUrl) {
          await prisma.image.update({
            where: { id: existingImage.id },
            data: { url: imageUrl }
          });
        } else {
          await prisma.image.delete({
            where: { id: existingImage.id }
          });
        }
      } else if (imageUrl) {
        await prisma.image.create({
          data: {
            url: imageUrl,
            userId: id
          }
        });
      }
    }

    return { success: true, data: photographer };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deletePhotographer(id: string) {
  try {
    await requireAdmin();

    // Check if the target user actually has the FOTOGRAFER role to prevent admin deleting other admins
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!targetUser || targetUser.role.name !== "FOTOGRAFER") {
      return { success: false, message: "Hanya akun Fotografer yang dapat dihapus melalui menu ini." };
    }

    await prisma.user.delete({
      where: { id },
    });

    return { success: true, message: "Akun Fotografer berhasil dihapus." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
