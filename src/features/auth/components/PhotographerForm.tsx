"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { photographerSchema, PhotographerInput } from "@/validations/photographer.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { createPhotographer, updatePhotographer } from "../actions/photographer.actions";
import { useState } from "react";
import { toast } from "sonner";
import { Camera, Trash2, Upload, Loader2 } from "lucide-react";

type Props = {
  initialData?: any;
  onSuccess?: () => void;
};

export default function PhotographerForm({ initialData, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const form = useForm<PhotographerInput>({
    resolver: zodResolver(photographerSchema) as any,
    defaultValues: initialData
      ? {
          name: initialData.name || "",
          email: initialData.email || "",
          phoneNumber: initialData.phoneNumber || "",
          password: "",
          imageUrl: initialData.images?.[0]?.url || "",
        }
      : {
          name: "",
          email: "",
          phoneNumber: "",
          password: "",
          imageUrl: "",
        },
  });

  const onSubmit = async (data: PhotographerInput) => {
    // Validation check for new photographer password
    if (!initialData?.id && (!data.password || data.password.trim() === "")) {
      form.setError("password", {
        type: "manual",
        message: "Kata sandi wajib diisi untuk fotografer baru",
      });
      return;
    }

    if (!initialData?.id && data.password && data.password.length < 6) {
      form.setError("password", {
        type: "manual",
        message: "Kata sandi minimal 6 karakter",
      });
      return;
    }

    setLoading(true);
    let res;
    if (initialData?.id) {
      res = await updatePhotographer(initialData.id, data);
    } else {
      res = await createPhotographer(data);
    }

    if (res.success) {
      toast.success(initialData?.id ? "Akun fotografer berhasil diperbarui" : "Akun fotografer berhasil dibuat");
      if (onSuccess) onSuccess();
    } else {
      toast.error(res.message || "Gagal menyimpan akun");
    }
    setLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center justify-center pb-4 border-b border-slate-100 dark:border-zinc-800/40">
              <FormLabel className="mb-2">Foto Profil Fotografer</FormLabel>
              <div className="flex flex-col items-center gap-3">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-650 flex items-center justify-center font-bold text-xl text-white shadow-md border-2 border-slate-100 dark:border-zinc-800">
                    {field.value ? (
                      <img src={field.value} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-white/80" />
                    )}
                  </div>
                  {field.value && (
                    <button
                      type="button"
                      onClick={() => field.onChange("")}
                      className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 rounded-full bg-slate-950/80 flex items-center justify-center z-10">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    </div>
                  )}
                </div>
                
                <div className="relative flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading || loading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (file.size > 3 * 1024 * 1024) {
                        toast.error("Ukuran file maksimal 3MB");
                        return;
                      }

                      setUploading(true);
                      const formData = new FormData();
                      formData.append("file", file);
                      formData.append("type", "profile");

                      try {
                        const res = await fetch("/api/admin/upload", {
                          method: "POST",
                          body: formData,
                        });
                        const data = await res.json();
                        if (data.success) {
                          field.onChange(data.url);
                          toast.success("Foto profil berhasil diunggah");
                        } else {
                          toast.error(data.message || "Gagal mengunggah foto profil");
                        }
                      } catch (err) {
                        toast.error("Gagal mengunggah foto profil");
                      } finally {
                        setUploading(false);
                      }
                    }}
                    className="text-xs text-slate-500 cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-750 hover:file:bg-indigo-100"
                  />
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="Misal: Ahmad Fotografer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ahmad@visualspace.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor Telepon (Opsional)</FormLabel>
              <FormControl>
                <Input placeholder="08123456789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{initialData?.id ? "Kata Sandi Baru (Opsional)" : "Kata Sandi"}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              {initialData?.id && (
                <FormDescription>
                  Kosongkan jika Anda tidak ingin mengubah kata sandi fotografer ini.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading || uploading} className="w-full mt-2 cursor-pointer">
          {loading ? "Menyimpan..." : initialData?.id ? "Perbarui Fotografer" : "Tambah Fotografer"}
        </Button>
      </form>
    </Form>
  );
}
