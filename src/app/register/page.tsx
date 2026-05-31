"use client";

import { useState } from "react";
import { registerUser } from "@/features/auth/actions/register.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Camera, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom Password Input Component with Eye Icon Toggle
interface PasswordInputProps extends React.ComponentProps<typeof Input> {}

function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("bg-slate-950 border-slate-900 focus-visible:border-purple-500 focus-visible:ring-purple-500/20 text-slate-100 py-5 pr-10 rounded-xl placeholder:text-slate-700", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition focus:outline-none"
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "", 
    phone: "" 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    const res = await registerUser({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone
    });

    if (res.success) {
      toast.success("Registrasi berhasil, silakan login.");
      router.push("/login");
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50 relative overflow-hidden dark">
      {/* Decorative Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        {/* Form Card */}
        <div className="bg-slate-900/40 backdrop-blur-md p-8 rounded-3xl border border-slate-900 shadow-2xl shadow-purple-500/5">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-500/20">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              VISUAL SPACE
            </span>
          </div>

          <h2 className="text-xl font-bold mb-8 text-center text-slate-200">Daftar Akun Baru</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Nama Lengkap</label>
              <Input 
                required 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                placeholder="John Doe" 
                className="bg-slate-950 border-slate-900 focus-visible:border-purple-500 focus-visible:ring-purple-500/20 text-slate-100 py-5 rounded-xl placeholder:text-slate-700"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Email</label>
              <Input 
                type="email" 
                required 
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
                placeholder="john@example.com" 
                className="bg-slate-950 border-slate-900 focus-visible:border-purple-500 focus-visible:ring-purple-500/20 text-slate-100 py-5 rounded-xl placeholder:text-slate-700"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Nomor HP</label>
              <Input 
                required 
                value={form.phone} 
                onChange={e => setForm({...form, phone: e.target.value})} 
                placeholder="0812xxxxxx" 
                className="bg-slate-950 border-slate-900 focus-visible:border-purple-500 focus-visible:ring-purple-500/20 text-slate-100 py-5 rounded-xl placeholder:text-slate-700"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Password</label>
              <PasswordInput 
                required 
                value={form.password} 
                onChange={e => setForm({...form, password: e.target.value})} 
                placeholder="********" 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Konfirmasi Password</label>
              <PasswordInput 
                required 
                value={form.confirmPassword} 
                onChange={e => setForm({...form, confirmPassword: e.target.value})} 
                placeholder="********" 
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-[0.98] transition-all font-bold text-sm text-white border-0 mt-6 cursor-pointer" 
              disabled={loading}
            >
              {loading ? "Memproses..." : "Daftar Sekarang"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-purple-400 font-semibold hover:text-purple-300 transition hover:underline">
              Login di sini
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition inline-flex items-center gap-1.5">
            &larr; Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
