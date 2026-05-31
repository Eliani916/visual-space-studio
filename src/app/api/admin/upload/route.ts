import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'packages' or 'profile'

    if (!file) {
      return NextResponse.json({ success: false, message: "Pilih file terlebih dahulu" }, { status: 400 });
    }

    // Determine target directory inside public/uploads/
    const dirName = type === "packages" ? "packages" : "profile";
    const uploadDir = path.join(process.cwd(), "public", "uploads", dirName);
    
    // Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate sanitized unique file name
    const ext = path.extname(file.name) || ".jpg";
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${dirName}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: fileUrl
    });
  } catch (error: any) {
    console.error("Admin Upload Error:", error.message);
    return NextResponse.json({ success: false, message: "Gagal mengunggah file: " + error.message }, { status: 500 });
  }
}
