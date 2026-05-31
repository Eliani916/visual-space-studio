"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { settingsSchema, SettingsInput } from "@/validations/settings.schema";
import { revalidatePath } from "next/cache";

async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

// Helper to get raw setting or default
async function getSetting(key: string, defaultValue: string) {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  return setting ? setting.value : defaultValue;
}

// Helper to set setting
async function setSetting(key: string, value: string) {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getSettings() {
  try {
    const openingHour = await getSetting("OPENING_HOUR", "09:00");
    const closingHour = await getSetting("CLOSING_HOUR", "21:00");
    const dpDeadlineHours = await getSetting("DP_DEADLINE_HOURS", "24");
    const fullPaymentDeadlineHours = await getSetting("FULL_PAYMENT_DEADLINE_HOURS", "24");
    const dpMinDaysAhead = await getSetting("DP_MIN_DAYS_AHEAD", "7");

    return {
      success: true,
      data: {
        openingHour,
        closingHour,
        dpDeadlineHours: parseInt(dpDeadlineHours, 10),
        fullPaymentDeadlineHours: parseInt(fullPaymentDeadlineHours, 10),
        dpMinDaysAhead: parseInt(dpMinDaysAhead, 10),
      }
    };
  } catch (error) {
    console.error("Get Settings Error:", error);
    return { success: false, message: "Gagal mengambil pengaturan" };
  }
}

export async function updateSettings(data: SettingsInput) {
  try {
    await checkAdminAuth();
    const validatedData = settingsSchema.parse(data);

    await setSetting("OPENING_HOUR", validatedData.openingHour);
    await setSetting("CLOSING_HOUR", validatedData.closingHour);
    await setSetting("DP_DEADLINE_HOURS", validatedData.dpDeadlineHours.toString());
    await setSetting("FULL_PAYMENT_DEADLINE_HOURS", validatedData.fullPaymentDeadlineHours.toString());
    await setSetting("DP_MIN_DAYS_AHEAD", validatedData.dpMinDaysAhead.toString());

    revalidatePath("/admin/settings");
    revalidatePath("/booking"); // revalidate public booking page as well
    return { success: true, message: "Pengaturan berhasil disimpan" };
  } catch (error: any) {
    console.error("Update Settings Error:", error.message);
    return { success: false, message: error.message || "Gagal menyimpan pengaturan" };
  }
}
