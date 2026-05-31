import { z } from "zod";

export const settingsSchema = z.object({
  openingHour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam tidak valid (HH:MM)"),
  closingHour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam tidak valid (HH:MM)"),
  dpDeadlineHours: z.number().min(1, "Batas pembayaran DP minimal 1 jam"),
  fullPaymentDeadlineHours: z.number().min(1, "Batas pelunasan minimal 1 jam"),
  dpMinDaysAhead: z.number().min(0, "H- minimal DP tidak boleh negatif"),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
