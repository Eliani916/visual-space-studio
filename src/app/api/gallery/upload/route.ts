import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "FOTOGRAFER")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const bookingId = formData.get("bookingId") as string;
    const files = formData.getAll("files") as File[];

    if (!bookingId || files.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
    }

    // Verify booking exists
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking tidak ditemukan" }, { status: 404 });
    }

    // Create directories
    const uploadDir = path.join(process.cwd(), "public", "uploads", bookingId);
    const originalDir = path.join(uploadDir, "original");
    const watermarkDir = path.join(uploadDir, "watermarked");

    await fs.mkdir(originalDir, { recursive: true });
    await fs.mkdir(watermarkDir, { recursive: true });

    let gallery = await prisma.gallery.findUnique({
      where: { bookingId }
    });

    if (!gallery) {
      gallery = await prisma.gallery.create({
        data: {
          bookingId,
          folderPath: `/uploads/${bookingId}`,
          isWatermarked: true
        }
      });
    }

    const savedFiles = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      
      const originalPath = path.join(originalDir, fileName);
      const watermarkPath = path.join(watermarkDir, fileName);

      // Save original
      await fs.writeFile(originalPath, buffer);

      // Save watermarked
      // Create a simple SVG watermark
      const watermarkSvg = `
        <svg width="800" height="600">
          <text x="50%" y="50%" font-size="48" font-family="Arial" fill="rgba(255,255,255,0.5)" text-anchor="middle" alignment-baseline="middle" transform="rotate(-45 400 300)">
            VISUAL SPACE WATERMARK
          </text>
        </svg>
      `;
      const svgBuffer = Buffer.from(watermarkSvg);

      await sharp(buffer)
        .composite([{ input: svgBuffer, gravity: 'center' }])
        .toFile(watermarkPath);

      // Save to database
      const galleryImage = await prisma.galleryImage.create({
        data: {
          galleryId: gallery.id,
          filePath: `/uploads/${bookingId}/watermarked/${fileName}`,
          fileName: fileName,
          uploadedBy: session.user.id
        }
      });

      savedFiles.push(galleryImage);
    }

    return NextResponse.json({ success: true, data: savedFiles });
  } catch (error: any) {
    console.error("Upload Gallery Error:", error.message);
    return NextResponse.json({ success: false, message: "Gagal mengunggah foto" }, { status: 500 });
  }
}
