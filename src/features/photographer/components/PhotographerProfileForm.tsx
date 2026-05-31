"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { photographerProfileSchema, PhotographerProfileInput } from "@/validations/photographer.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { updatePhotographerProfile } from "../actions/photographer-profile.actions";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  userId: string;
  initialData?: any;
  onSuccess?: () => void;
};

export default function PhotographerProfileForm({ userId, initialData, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  
  const form = useForm<PhotographerProfileInput>({
    resolver: zodResolver(photographerProfileSchema) as any,
    defaultValues: {
      gender: initialData?.gender || "",
      address: initialData?.address || "",
      specialization: initialData?.specialization || "",
      experienceYears: initialData?.experienceYears || 0,
      certification: initialData?.certification || "",
      portfolioUrl: initialData?.portfolioUrl || "",
      description: initialData?.description || "",
      status: initialData?.status || "AVAILABLE",
    },
  });

  const onSubmit = async (data: PhotographerProfileInput) => {
    setLoading(true);
    const res = await updatePhotographerProfile(userId, data);

    if (res.success) {
      toast.success("Berhasil menyimpan profil fotografer");
      if (onSuccess) onSuccess();
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status Ketersediaan</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="AVAILABLE">Tersedia (AVAILABLE)</option>
                    <option value="ON_DUTY">Sedang Bertugas (ON DUTY)</option>
                    <option value="LEAVE">Cuti (LEAVE)</option>
                    <option value="INACTIVE">Tidak Aktif (INACTIVE)</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="experienceYears"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pengalaman (Tahun)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Kelamin</FormLabel>
              <FormControl>
                <select
                  {...field}
                  value={field.value || ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih Jenis Kelamin --</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Spesialisasi</FormLabel>
              <FormControl>
                <Input placeholder="Misal: Prewedding, Keluarga, Produk" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="portfolioUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Portofolio (Opsional)</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://instagram.com/..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="certification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sertifikasi (Opsional)</FormLabel>
              <FormControl>
                <Input placeholder="Misal: BNSP Fotografer" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alamat Lengkap</FormLabel>
              <FormControl>
                <Textarea placeholder="Alamat rumah..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi Profil</FormLabel>
              <FormControl>
                <Textarea placeholder="Ceritakan sedikit tentang Anda..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
          {loading ? "Menyimpan..." : "Simpan Profil"}
        </Button>
      </form>
    </Form>
  );
}
