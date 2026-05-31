"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { packageSchema, PackageInput } from "@/validations/package.schema";
import { revalidatePath } from "next/cache";

// Helper for auth check
async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function createPackage(data: PackageInput) {
  try {
    await checkAdminAuth();
    
    // Validate input
    const validatedData = packageSchema.parse(data);

    const newPackage = await prisma.package.create({
      data: {
        name: validatedData.name,
        price: validatedData.price,
        printCount: validatedData.printCount,
        duration: validatedData.duration,
        studioId: validatedData.studioId,
        description: validatedData.description,
        features: validatedData.features,
        isPopular: validatedData.isPopular,
        ctaText: validatedData.ctaText,
        isActive: validatedData.isActive,
        images: validatedData.imageUrls && validatedData.imageUrls.length > 0 ? {
          create: validatedData.imageUrls.map((url) => ({ url }))
        } : undefined
      },
    });

    revalidatePath("/admin/packages");
    revalidatePath("/");
    return { success: true, data: JSON.parse(JSON.stringify(newPackage)) };
  } catch (error: any) {
    console.error("Create Package Error:", error.message);
    return { success: false, message: error.message || "Gagal membuat paket" };
  }
}

export async function getPackages(includeInactive = false) {
  try {
    // Both ADMIN and PELANGGAN can read packages. But PELANGGAN only sees active ones.
    const where = includeInactive ? { deletedAt: null } : { isActive: true, deletedAt: null };
    const packages = await prisma.package.findMany({
      where,
      include: {
        images: true,
        bookings: {
          where: {
            status: "COMPLETED",
            reviewRating: { not: null },
            reviewComment: { not: null },
            deletedAt: null,
          },
          select: {
            id: true,
            reviewRating: true,
            reviewComment: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                images: {
                  take: 1,
                  select: {
                    url: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: JSON.parse(JSON.stringify(packages)) };
  } catch (error) {
    console.error("Get Packages Error", error);
    return { success: false, message: "Gagal mengambil daftar paket" };
  }
}

export async function updatePackage(id: string, data: PackageInput) {
  try {
    await checkAdminAuth();
    
    const validatedData = packageSchema.parse(data);

    const updatedPackage = await prisma.package.update({
      where: { id },
      data: {
        name: validatedData.name,
        price: validatedData.price,
        printCount: validatedData.printCount,
        duration: validatedData.duration,
        studioId: validatedData.studioId,
        description: validatedData.description,
        features: validatedData.features,
        isPopular: validatedData.isPopular,
        ctaText: validatedData.ctaText,
        isActive: validatedData.isActive,
      },
    });

    // Handle image update
    if (validatedData.imageUrls !== undefined) {
      await prisma.image.deleteMany({
        where: { packageId: id }
      });

      if (validatedData.imageUrls && validatedData.imageUrls.length > 0) {
        await prisma.image.createMany({
          data: validatedData.imageUrls.map((url) => ({
            url,
            packageId: id,
          })),
        });
      }
    }

    revalidatePath("/admin/packages");
    revalidatePath("/");
    return { success: true, data: JSON.parse(JSON.stringify(updatedPackage)) };
  } catch (error: any) {
    console.error("Update Package Error", error.message);
    return { success: false, message: error.message || "Gagal mengupdate paket" };
  }
}

export async function deletePackage(id: string) {
  try {
    await checkAdminAuth();
    
    // Soft delete
    await prisma.package.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/admin/packages");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Package Error", error.message);
    return { success: false, message: "Gagal menghapus paket" };
  }
}
