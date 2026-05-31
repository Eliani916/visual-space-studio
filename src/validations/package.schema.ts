import { z } from "zod";

export const packageSchema = z.object({
  name: z.string().min(3, "Nama paket minimal 3 karakter").max(100, "Nama paket maksimal 100 karakter"),
  price: z.number().min(0, "Harga tidak boleh negatif"),
  printCount: z.number().int().min(0, "Jumlah cetak tidak boleh negatif"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter").max(1000, "Deskripsi terlalu panjang"),
  features: z.string().optional().nullable(),
  isPopular: z.boolean().default(false),
  ctaText: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  imageUrls: z.array(z.string()).optional(),
  duration: z.number().int().min(15, "Durasi minimal 15 menit").default(60),
  studioId: z.string().optional().nullable(),
});

export type PackageInput = z.infer<typeof packageSchema>;
