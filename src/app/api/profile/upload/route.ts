import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("profileImage") as File;

    if (!file) {
      return NextResponse.json({ success: false, message: "Pilih file gambar terlebih dahulu" }, { status: 400 });
    }

    const userId = session.user.id;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profile");
    
    // Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate sanitized unique file name
    const ext = path.extname(file.name) || ".jpg";
    const fileName = `${userId}_avatar_${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    await fs.writeFile(filePath, buffer);

    const imageUrl = `/uploads/profile/${fileName}`;

    // Update image row in database
    await prisma.$transaction(async (tx) => {
      // Find old profile image associated with user and delete it
      const oldImage = await tx.image.findFirst({
        where: { userId }
      });

      if (oldImage) {
        // Try deleting from local disk if it exists
        try {
          const oldFilePath = path.join(process.cwd(), "public", oldImage.url);
          await fs.unlink(oldFilePath);
        } catch (err) {
          // ignore disk delete error if file not found
        }

        // Delete from database
        await tx.image.delete({
          where: { id: oldImage.id }
        });
      }

      // Create new user image
      await tx.image.create({
        data: {
          url: imageUrl,
          userId
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Foto profil berhasil diperbarui!",
      imageUrl
    });
  } catch (error: any) {
    console.error("Profile Upload Error:", error.message);
    return NextResponse.json({ success: false, message: "Gagal mengunggah foto profil: " + error.message }, { status: 500 });
  }
}
