"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUser(data: any) {
  try {
    const { name, email, password, phone } = data;

    if (!name || !email || !password) {
      return { success: false, message: "Nama, email, dan password wajib diisi." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, message: "Email sudah terdaftar." };
    }

    const role = await prisma.role.findUnique({
      where: { name: "PELANGGAN" },
    });

    if (!role) {
      return { success: false, message: "Role Pelanggan tidak ditemukan di sistem." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        phoneNumber: phone,
        roleId: role.id,
      },
    });

    return { success: true, data: user };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
