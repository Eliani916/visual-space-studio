import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const bookingSchema = z.object({
  packageId: z.string().uuid("Package ID tidak valid"),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
  bookingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam tidak valid (HH:MM)"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentType: z.enum(["DP", "FULL"]).optional(),
  promoCode: z.string().optional().or(z.literal("")),
});

export type BookingInput = z.infer<typeof bookingSchema>;
