"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Hanya Admin yang dapat mengubah konten landing page.");
  }
}

// ==========================================
// LANDING FEATURES ACTIONS
// ==========================================

export async function getLandingFeatures() {
  try {
    const features = await prisma.landingFeature.findMany({
      orderBy: { order: "asc" },
    });
    return { success: true, data: features };
  } catch (error: any) {
    console.error("Get Landing Features Error:", error.message);
    return { success: false, message: "Gagal mengambil data keunggulan." };
  }
}

export async function createLandingFeature(data: { title: string; description: string; icon?: string; order?: number }) {
  try {
    await requireAdmin();
    const { title, description, icon, order } = data;

    if (!title || !description) {
      throw new Error("Judul dan deskripsi wajib diisi.");
    }

    const feature = await prisma.landingFeature.create({
      data: {
        title,
        description,
        icon: icon || "Sparkles",
        order: order || 0,
      },
    });

    revalidatePath("/");
    return { success: true, data: feature };
  } catch (error: any) {
    console.error("Create Feature Error:", error.message);
    return { success: false, message: error.message || "Gagal membuat keunggulan baru." };
  }
}

export async function updateLandingFeature(
  id: string,
  data: { title: string; description: string; icon?: string; order?: number }
) {
  try {
    await requireAdmin();
    const { title, description, icon, order } = data;

    if (!title || !description) {
      throw new Error("Judul dan deskripsi wajib diisi.");
    }

    const feature = await prisma.landingFeature.update({
      where: { id },
      data: {
        title,
        description,
        icon: icon || "Sparkles",
        order: order !== undefined ? order : 0,
      },
    });

    revalidatePath("/");
    return { success: true, data: feature };
  } catch (error: any) {
    console.error("Update Feature Error:", error.message);
    return { success: false, message: error.message || "Gagal memperbarui keunggulan." };
  }
}

export async function deleteLandingFeature(id: string) {
  try {
    await requireAdmin();
    await prisma.landingFeature.delete({
      where: { id },
    });

    revalidatePath("/");
    return { success: true, message: "Keunggulan berhasil dihapus." };
  } catch (error: any) {
    console.error("Delete Feature Error:", error.message);
    return { success: false, message: error.message || "Gagal menghapus keunggulan." };
  }
}

// ==========================================
// LANDING STEPS (HOW IT WORKS) ACTIONS
// ==========================================

export async function getLandingSteps() {
  try {
    const steps = await prisma.landingStep.findMany({
      orderBy: { stepNumber: "asc" },
    });
    return { success: true, data: steps };
  } catch (error: any) {
    console.error("Get Landing Steps Error:", error.message);
    return { success: false, message: "Gagal mengambil data cara kerja." };
  }
}

export async function createLandingStep(data: { stepNumber: number; title: string; description: string }) {
  try {
    await requireAdmin();
    const { stepNumber, title, description } = data;

    if (!stepNumber || !title || !description) {
      throw new Error("Nomor langkah, judul, dan deskripsi wajib diisi.");
    }

    const step = await prisma.landingStep.create({
      data: {
        stepNumber,
        title,
        description,
      },
    });

    revalidatePath("/");
    return { success: true, data: step };
  } catch (error: any) {
    console.error("Create Step Error:", error.message);
    return { success: false, message: error.message || "Gagal membuat langkah baru." };
  }
}

export async function updateLandingStep(
  id: string,
  data: { stepNumber: number; title: string; description: string }
) {
  try {
    await requireAdmin();
    const { stepNumber, title, description } = data;

    if (!stepNumber || !title || !description) {
      throw new Error("Nomor langkah, judul, dan deskripsi wajib diisi.");
    }

    const step = await prisma.landingStep.update({
      where: { id },
      data: {
        stepNumber,
        title,
        description,
      },
    });

    revalidatePath("/");
    return { success: true, data: step };
  } catch (error: any) {
    console.error("Update Step Error:", error.message);
    return { success: false, message: error.message || "Gagal memperbarui langkah." };
  }
}

export async function deleteLandingStep(id: string) {
  try {
    await requireAdmin();
    await prisma.landingStep.delete({
      where: { id },
    });

    revalidatePath("/");
    return { success: true, message: "Langkah berhasil dihapus." };
  } catch (error: any) {
    console.error("Delete Step Error:", error.message);
    return { success: false, message: error.message || "Gagal menghapus langkah." };
  }
}

// ==========================================
// LANDING FAQ ACTIONS
// ==========================================

export async function getLandingFaqs() {
  try {
    const faqs = await prisma.landingFaq.findMany({
      orderBy: { order: "asc" },
    });
    return { success: true, data: faqs };
  } catch (error: any) {
    console.error("Get Landing Faqs Error:", error.message);
    return { success: false, message: "Gagal mengambil data FAQ." };
  }
}

export async function createLandingFaq(data: { question: string; answer: string; order?: number }) {
  try {
    await requireAdmin();
    const { question, answer, order } = data;

    if (!question || !answer) {
      throw new Error("Pertanyaan dan jawaban wajib diisi.");
    }

    const faq = await prisma.landingFaq.create({
      data: {
        question,
        answer,
        order: order || 0,
      },
    });

    revalidatePath("/");
    return { success: true, data: faq };
  } catch (error: any) {
    console.error("Create Faq Error:", error.message);
    return { success: false, message: error.message || "Gagal membuat FAQ baru." };
  }
}

export async function updateLandingFaq(
  id: string,
  data: { question: string; answer: string; order?: number }
) {
  try {
    await requireAdmin();
    const { question, answer, order } = data;

    if (!question || !answer) {
      throw new Error("Pertanyaan dan jawaban wajib diisi.");
    }

    const faq = await prisma.landingFaq.update({
      where: { id },
      data: {
        question,
        answer,
        order: order !== undefined ? order : 0,
      },
    });

    revalidatePath("/");
    return { success: true, data: faq };
  } catch (error: any) {
    console.error("Update Faq Error:", error.message);
    return { success: false, message: error.message || "Gagal memperbarui FAQ." };
  }
}

export async function deleteLandingFaq(id: string) {
  try {
    await requireAdmin();
    await prisma.landingFaq.delete({
      where: { id },
    });

    revalidatePath("/");
    return { success: true, message: "FAQ berhasil dihapus." };
  } catch (error: any) {
    console.error("Delete Faq Error:", error.message);
    return { success: false, message: error.message || "Gagal menghapus FAQ." };
  }
}


