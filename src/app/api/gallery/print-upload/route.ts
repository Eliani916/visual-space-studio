import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PELANGGAN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const bookingId = formData.get("bookingId") as string;
    const shippingAddress = formData.get("shippingAddress") as string;
    const files = formData.getAll("printFiles") as File[];

    if (!bookingId) {
      return NextResponse.json({ success: false, message: "Invalid Request: Booking ID is required" }, { status: 400 });
    }

    if (!shippingAddress || shippingAddress.trim() === "") {
      return NextResponse.json({ success: false, message: "Invalid Request: Alamat pengiriman wajib diisi" }, { status: 400 });
    }

    // Verify booking ownership
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { package: true }
    });

    if (!booking || booking.userId !== session.user.id) {
      return NextResponse.json({ success: false, message: "Booking tidak ditemukan atau Anda tidak berwenang" }, { status: 404 });
    }

    // Check status lock
    if (booking.printStatus && !["PENDING", "BELUM_DIAJUKAN"].includes(booking.printStatus)) {
      return NextResponse.json({ success: false, message: "Foto sudah mulai diproses cetak atau dikirim, pengajuan tidak dapat diubah." }, { status: 400 });
    }

    // Verify file count against limit
    const printLimit = booking.package.printCount;
    
    // Check if files are uploaded
    if (files.length === 0) {
      return NextResponse.json({ success: false, message: "Silakan pilih file gambar untuk diunggah" }, { status: 400 });
    }

    if (files.length > printLimit) {
      return NextResponse.json({ success: false, message: `Jumlah foto melebihi limit paket Anda (${printLimit} lembar)` }, { status: 400 });
    }

    // Save files
    const savedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Sanitized unique file name
      const fileName = `print_${i + 1}_${Date.now()}`;

      // Upload to cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `visual_space/prints/${bookingId}`,
            public_id: fileName,
            resource_type: 'auto'
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(buffer);
      }) as any;

      savedUrls.push(uploadResult.secure_url);
    }

    const printPhotosString = savedUrls.join(",");

    // Update database
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        printPhotos: printPhotosString,
        shippingAddress: shippingAddress,
        printStatus: "PENDING"
      }
    });

    return NextResponse.json({
      success: true,
      message: "Foto cetak & alamat pengiriman berhasil diajukan!",
      data: updatedBooking
    });
  } catch (error: any) {
    console.error("Print Upload API Error:", error.message);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan sistem saat mengunggah foto cetak" }, { status: 500 });
  }
}
