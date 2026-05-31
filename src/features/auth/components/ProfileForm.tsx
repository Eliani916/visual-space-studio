"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User as UserIcon, Camera, Phone, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUserProfile, updateUserProfile } from "../actions/profile.actions";

export default function ProfileForm() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    imageUrl: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load user data on mount
  const loadProfile = async () => {
    setLoading(true);
    const res = await getUserProfile();
    if (res.success && res.data) {
      setProfile(res.data);
    } else {
      toast.error(res.message || "Gagal memuat profil");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Upload avatar file
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (e.g. 3MB)
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar (maksimal 3MB)");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const res = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setProfile(prev => ({ ...prev, imageUrl: data.imageUrl }));
        // Reload page header avatars by reloading router cache
        window.location.reload();
      } else {
        toast.error(data.message || "Gagal mengunggah foto profil");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi saat mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  // Submit profile details update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name || !profile.email) {
      toast.error("Nama dan email wajib diisi");
      return;
    }

    setSaving(true);
    const res = await updateUserProfile({
      name: profile.name,
      email: profile.email,
      phoneNumber: profile.phoneNumber
    });

    if (res.success) {
      toast.success(res.message);
      // Reload router cache to update headers/dropdowns
      window.location.reload();
    } else {
      toast.error(res.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-650 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400 font-semibold animate-pulse">Memuat profil...</p>
      </div>
    );
  }

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!profile.name) return "US";
    return profile.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <h3 className="text-lg font-black text-slate-800 dark:text-white border-b border-slate-100 dark:border-zinc-800/60 pb-4 flex items-center gap-2 mb-6">
        <UserIcon className="w-5 h-5 text-indigo-500" />
        Pengaturan Profil Saya
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Uploader Section */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100 dark:border-zinc-800/40">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-650 flex items-center justify-center font-bold text-2xl text-white shadow-md border-2 border-slate-105 dark:border-zinc-800">
              {profile.imageUrl ? (
                <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                getInitials()
              )}
            </div>
            
            <label className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-bold text-white cursor-pointer select-none">
              <Camera className="w-4 h-4 mb-0.5 text-white animate-pulse" />
              Ganti Foto
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={uploading || saving}
                className="hidden"
              />
            </label>

            {uploading && (
              <div className="absolute inset-0 rounded-full bg-slate-950/80 flex items-center justify-center z-10">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Foto Profil</h4>
            <p className="text-xxs text-slate-400 dark:text-zinc-500 leading-normal max-w-[280px]">
              Unggah file gambar JPEG/PNG. Maksimal ukuran file adalah 3MB.
            </p>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 dark:text-zinc-500 block mb-1.5">Nama Lengkap</label>
            <div className="relative">
              <Input
                type="text"
                name="name"
                required
                value={profile.name}
                onChange={handleChange}
                disabled={saving || uploading}
                placeholder="Nama Anda"
                className="bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800/80 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 text-slate-800 dark:text-zinc-100 py-5 rounded-xl placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 dark:text-zinc-500 block mb-1.5">Alamat Email</label>
            <div className="relative">
              <Input
                type="email"
                name="email"
                required
                value={profile.email}
                onChange={handleChange}
                disabled={saving || uploading}
                placeholder="email@example.com"
                className="bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800/80 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 text-slate-800 dark:text-zinc-100 py-5 rounded-xl placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 dark:text-zinc-500 block mb-1.5">Nomor Handphone</label>
            <div className="relative">
              <Input
                type="text"
                name="phoneNumber"
                value={profile.phoneNumber}
                onChange={handleChange}
                disabled={saving || uploading}
                placeholder="Contoh: 08123456789"
                className="bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800/80 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 text-slate-800 dark:text-zinc-100 py-5 rounded-xl placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={saving || uploading}
          className="w-full py-5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-650 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer border-0"
        >
          {saving ? "Menyimpan Perubahan..." : "Simpan Perubahan"}
        </Button>
      </form>
    </div>
  );
}
