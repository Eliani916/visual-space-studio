import { z } from "zod";

export const photographerSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter"),
  email: z.string().email("Format email tidak valid"),
  phoneNumber: z.string().optional().or(z.literal("")),
  password: z.string().optional().or(z.literal("")),
  imageUrl: z.string().optional().nullable(),
});

export type PhotographerInput = z.infer<typeof photographerSchema>;

export const photographerProfileSchema = z.object({
  gender: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  experienceYears: z.number().int().min(0).default(0),
  certification: z.string().optional().nullable(),
  portfolioUrl: z.string().url("Format URL tidak valid").optional().nullable().or(z.literal("")),
  description: z.string().optional().nullable(),
  status: z.enum(["AVAILABLE", "ON_DUTY", "LEAVE", "INACTIVE"]).default("AVAILABLE")
});

export type PhotographerProfileInput = z.infer<typeof photographerProfileSchema>;
