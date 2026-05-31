"use server";

import prisma from "@/lib/prisma";
import { photographerProfileSchema, PhotographerProfileInput } from "@/validations/photographer.schema";
import { revalidatePath } from "next/cache";

export async function updatePhotographerProfile(userId: string, data: PhotographerProfileInput) {
  try {
    const validatedData = photographerProfileSchema.parse(data);

    // Using upsert since it's a 1-to-1 relation, it might not exist yet
    const profile = await prisma.photographerProfile.upsert({
      where: { userId },
      update: {
        gender: validatedData.gender,
        address: validatedData.address,
        specialization: validatedData.specialization,
        experienceYears: validatedData.experienceYears,
        certification: validatedData.certification,
        portfolioUrl: validatedData.portfolioUrl,
        description: validatedData.description,
        status: validatedData.status,
      },
      create: {
        userId,
        gender: validatedData.gender,
        address: validatedData.address,
        specialization: validatedData.specialization,
        experienceYears: validatedData.experienceYears,
        certification: validatedData.certification,
        portfolioUrl: validatedData.portfolioUrl,
        description: validatedData.description,
        status: validatedData.status,
      }
    });

    revalidatePath("/admin/photographers");
    revalidatePath("/fotografer/profile");
    return { success: true, data: JSON.parse(JSON.stringify(profile)) };
  } catch (error: any) {
    console.error("Update Photographer Profile Error:", error);
    return { success: false, message: error.message || "Gagal menyimpan profil fotografer" };
  }
}
