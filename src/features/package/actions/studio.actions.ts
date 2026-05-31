"use server";

import prisma from "@/lib/prisma";

export async function getStudios() {
  try {
    const studios = await prisma.studio.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }
    });
    return { success: true, data: studios };
  } catch (error: any) {
    console.error("Get Studios Error:", error);
    return { success: false, data: [] };
  }
}
