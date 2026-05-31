"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Helper to generate 6-digit OTP code
function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends a password reset OTP to the user's email.
 * Realistically, it logs the OTP to the console since there is no SMTP configured.
 */
export async function sendPasswordResetOtp(email: string) {
  try {
    if (!email) {
      return { success: false, message: "Email wajib diisi." };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, message: "Email tidak terdaftar." };
    }

    const otpCode = generateOtpCode();
    // Expiration set to strictly 1 minute (60 seconds)
    const expiresAt = new Date(Date.now() + 60 * 1000);

    // Save OTP to the database
    await prisma.passwordResetOtp.create({
      data: {
        email,
        code: otpCode,
        expiresAt,
      },
    });

    // Mock send OTP to console/logs
    console.log(`\n======================================================`);
    console.log(`[EMAIL SEND] OTP Kode Lupa Kata Sandi untuk ${email}: ${otpCode}`);
    console.log(`[EXPIRE TIME] Berlaku sampai: ${expiresAt.toLocaleTimeString()}`);
    console.log(`======================================================\n`);

    return { 
      success: true, 
      message: "Kode OTP telah dikirim ke email Anda. Silakan cek kotak masuk Anda." 
    };
  } catch (error: any) {
    console.error("sendPasswordResetOtp error:", error);
    return { success: false, message: "Gagal mengirim kode OTP: " + error.message };
  }
}

/**
 * Verifies if the OTP is valid and has not expired.
 */
export async function verifyPasswordResetOtp(email: string, code: string) {
  try {
    if (!email || !code) {
      return { success: false, message: "Email dan kode OTP wajib diisi." };
    }

    // Get the latest OTP sent to this email
    const latestOtp = await prisma.passwordResetOtp.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOtp) {
      return { success: false, message: "Kode OTP tidak ditemukan atau belum dikirim." };
    }

    if (latestOtp.code !== code) {
      return { success: false, message: "Kode OTP salah." };
    }

    const now = new Date();
    if (now > latestOtp.expiresAt) {
      return { success: false, message: "Kode OTP telah kedaluwarsa. Silakan kirim ulang." };
    }

    return { success: true, message: "Kode OTP berhasil diverifikasi." };
  } catch (error: any) {
    console.error("verifyPasswordResetOtp error:", error);
    return { success: false, message: "Gagal memverifikasi OTP: " + error.message };
  }
}

/**
 * Resets the password if the OTP code is valid and not expired.
 */
export async function resetPasswordWithOtp(email: string, code: string, passwordResetData: any) {
  try {
    const { password, confirmPassword } = passwordResetData;

    if (!email || !code || !password || !confirmPassword) {
      return { success: false, message: "Semua kolom wajib diisi." };
    }

    if (password !== confirmPassword) {
      return { success: false, message: "Konfirmasi kata sandi tidak cocok." };
    }

    if (password.length < 6) {
      return { success: false, message: "Kata sandi minimal 6 karakter." };
    }

    // Double check OTP validity before changing password
    const verifyRes = await verifyPasswordResetOtp(email, code);
    if (!verifyRes.success) {
      return verifyRes;
    }

    // Update password
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: {
        password: passwordHash,
      },
    });

    // Delete all OTPs for this email to prevent reuse
    await prisma.passwordResetOtp.deleteMany({
      where: { email },
    });

    return { 
      success: true, 
      message: "Kata sandi berhasil diperbarui. Silakan masuk kembali." 
    };
  } catch (error: any) {
    console.error("resetPasswordWithOtp error:", error);
    return { success: false, message: "Gagal memperbarui kata sandi: " + error.message };
  }
}

/**
 * Checks if an email exists in the database.
 */
export async function checkEmailExists(email: string) {
  try {
    if (!email) {
      return { success: false, message: "Email wajib diisi." };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, message: "Email belum terdaftar." };
    }

    return { success: true };
  } catch (error: any) {
    console.error("checkEmailExists error:", error);
    return { success: false, message: "Gagal memeriksa email: " + error.message };
  }
}

/**
 * Resets the password directly without OTP.
 */
export async function resetPasswordWithoutOtp(email: string, passwordResetData: any) {
  try {
    const { password, confirmPassword } = passwordResetData;

    if (!email || !password || !confirmPassword) {
      return { success: false, message: "Semua kolom wajib diisi." };
    }

    if (password !== confirmPassword) {
      return { success: false, message: "Konfirmasi kata sandi tidak cocok." };
    }

    if (password.length < 6) {
      return { success: false, message: "Kata sandi minimal 6 karakter." };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, message: "Email belum terdaftar." };
    }

    // Update password
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: {
        password: passwordHash,
      },
    });

    return { 
      success: true, 
      message: "Kata sandi berhasil diperbarui. Silakan masuk kembali." 
    };
  } catch (error: any) {
    console.error("resetPasswordWithoutOtp error:", error);
    return { success: false, message: "Gagal memperbarui kata sandi: " + error.message };
  }
}

