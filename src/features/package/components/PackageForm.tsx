"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { packageSchema, PackageInput } from "@/validations/package.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getPackages, createPackage, updatePackage } from "../actions/package.actions";
import { getStudios } from "../actions/studio.actions";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Upload, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";

type Props = {
  initialData?: any;
  onSuccess?: () => void;
};

export default function PackageForm({ initialData, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const form = useForm<PackageInput>({
    resolver: zodResolver(packageSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      price: initialData?.price ? Number(initialData.price) : 0,
      printCount: initialData?.printCount ? Number(initialData.printCount) : 0,
      description: initialData?.description || "",
      features: initialData?.features || "",
      isPopular: initialData?.isPopular || false,
      ctaText: initialData?.ctaText || "Pilih Paket",
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      imageUrls: initialData?.images?.map((img: any) => img.url) || [],
      duration: initialData?.duration || 60,
      studioId: initialData?.studioId || null,
    },
  });

  const [studios, setStudios] = useState<any[]>([]);

  useEffect(() => {
    async function loadStudios() {
      const res = await getStudios();
      if (res.success) {
        setStudios(res.data);
      }
    }
    loadStudios();
  }, []);

  const onSubmit = async (data: PackageInput) => {
    setLoading(true);
    let res;
    if (initialData?.id) {
      res = await updatePackage(initialData.id, data);
    } else {
      res = await createPackage(data);
    }

    if (res.success) {
      toast.success("Berhasil menyimpan paket");
      if (onSuccess) onSuccess();
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Paket</FormLabel>
              <FormControl>
                <Input placeholder="Misal: Paket Prewedding" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrls"
          render={({ field }) => {
            const urls = field.value || [];
            
            const handleRemoveImage = (indexToRemove: number) => {
              const newUrls = urls.filter((_, idx) => idx !== indexToRemove);
              field.onChange(newUrls);
            };
            
            return (
              <FormItem>
                <FormLabel>Gambar Paket (Bisa Unggah Lebih dari 1)</FormLabel>
                <div className="flex flex-col gap-3">
                  {/* Grid Previews */}
                  {urls.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {urls.map((url, idx) => (
                        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-900 group">
                          <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer border-0"
                          >
                            <Trash2 className="w-4.5 h-4.5 text-white" />
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state placeholder when no images */}
                  {urls.length === 0 && (
                    <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-800/80 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-zinc-950 p-4">
                      <ImageIcon className="w-8 h-8 text-slate-350 mb-2" />
                      <span className="text-xs text-slate-500 font-semibold">Belum ada gambar paket</span>
                      <span className="text-[10px] text-slate-450 mt-1">Unggah gambar format JPG/PNG</span>
                    </div>
                  )}

                  {/* Upload button wrapper */}
                  <div className="relative flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploading || loading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("Ukuran file maksimal 5MB");
                          return;
                        }

                        setUploading(true);
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("type", "packages");

                        try {
                          const res = await fetch("/api/admin/upload", {
                            method: "POST",
                            body: formData,
                          });
                          const data = await res.json();
                          if (data.success) {
                            field.onChange([...urls, data.url]);
                            toast.success("Gambar berhasil diunggah");
                          } else {
                            toast.error(data.message || "Gagal mengunggah gambar");
                          }
                        } catch (err) {
                          toast.error("Gagal mengunggah gambar");
                        } finally {
                          setUploading(false);
                          e.target.value = "";
                        }
                      }}
                      className="cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-750 hover:file:bg-indigo-100"
                    />
                    {uploading && (
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-650 shrink-0" />
                    )}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Harga (Rp)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="500000" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="printCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jumlah Cetak</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="10" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durasi Sesi (Menit)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="60" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 60)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="studioId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pilih Studio (Opsional)</FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-400"
                    {...field}
                    value={field.value || ""}
                    onChange={e => field.onChange(e.target.value === "" ? null : e.target.value)}
                  >
                    <option value="">-- Tanpa Studio Khusus --</option>
                    {studios.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi Singkat</FormLabel>
              <FormControl>
                <Textarea placeholder="Detail singkat mengenai paket..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Daftar Fitur Paket</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="15 Menit Sesi Foto Mandiri&#10;Pilihan 1 Frame Desain Eksklusif&#10;2 Lembar Cetak Fisik Berwarna" 
                  value={field.value || ""} 
                  onChange={field.onChange}
                  className="min-h-[100px]"
                />
              </FormControl>
              <p className="text-xxs text-slate-500">Tuliskan setiap fitur pada baris baru (tekan Enter untuk memisahkan).</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="ctaText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teks Tombol CTA</FormLabel>
                <FormControl>
                  <Input placeholder="Pilih Paket Basic" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col justify-center space-y-2 pt-5">
            <FormField
              control={form.control}
              name="isPopular"
              render={({ field }) => (
                <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={e => field.onChange(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Tandai Sebagai Paling Laku (Popular)</span>
                </label>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={e => field.onChange(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Aktifkan Paket</span>
                </label>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={loading || uploading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
          {loading ? "Menyimpan..." : "Simpan Paket"}
        </Button>
      </form>
    </Form>
  );
}
