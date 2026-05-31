"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import * as Icons from "lucide-react";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
  Star
} from "lucide-react";

// Fallback dynamic icon helper
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  // @ts-ignore
  const IconComp = Icons[name] || Sparkles;
  return <IconComp className={className} />;
}

interface HomeClientProps {
  features: any[];
  steps: any[];
  faqs: any[];
  packages: any[];
  testimonials: any[];
  session?: any;
}

export default function HomeClient({ features, steps, faqs, packages, testimonials, session }: HomeClientProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-50 flex flex-col relative overflow-hidden">


      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute top-[30%] -right-[20%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[150px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[130px]" />
      </div>

      {/* Navigation Header */}
      <nav className="relative z-50 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              VISUAL SPACE
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#fitur" className="hover:text-blue-400 transition">Fitur</a>
            <a href="#paket" className="hover:text-blue-400 transition">Paket Harga</a>
            <a href="#testimoni" className="hover:text-blue-400 transition">Testimoni</a>
            <a href="#faq" className="hover:text-blue-400 transition">FAQ</a>
            {session && (
              <Link 
                href={
                  session.user.role === "ADMIN" 
                    ? "/admin/dashboard" 
                    : session.user.role === "FOTOGRAFER" 
                      ? "/fotografer/dashboard" 
                      : "/dashboard"
                } 
                className="text-purple-400 hover:text-purple-300 font-semibold transition"
              >
                Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4 relative z-10">
            {session ? (
              <div className="relative">
                {isUserMenuOpen && (
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                )}
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition bg-slate-900/60 hover:bg-slate-900 px-4 py-2 rounded-full border border-slate-800 cursor-pointer relative z-40"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    {session.user.name ? session.user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2) : "US"}
                  </div>
                  <span>{session.user.name || "User"}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-2xl p-2 flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 text-xs">
                      <p className="font-bold text-slate-200 truncate">{session.user.name}</p>
                      <p className="text-slate-500 truncate">{session.user.email}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold text-[10px] uppercase">
                        {session.user.role === "ADMIN" ? "Administrator" : session.user.role === "FOTOGRAFER" ? "Fotografer" : "Pelanggan"}
                      </span>
                    </div>
                    <div className="h-px bg-slate-800/80 my-1" />

                    {session.user.role === "ADMIN" && (
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Icons.LayoutDashboard className="w-4 h-4 text-blue-400" />
                        Dashboard Admin
                      </Link>
                    )}

                    {session.user.role === "FOTOGRAFER" && (
                      <Link
                        href="/fotografer"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Icons.Camera className="w-4 h-4 text-blue-400" />
                        Fotografer Panel
                      </Link>
                    )}

                    {session.user.role === "PELANGGAN" && (
                      <>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Icons.LayoutDashboard className="w-4 h-4 text-blue-400" />
                          Dashboard Saya
                        </Link>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Icons.CalendarCheck className="w-4 h-4 text-blue-400" />
                          Cek Booking
                        </Link>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Icons.CreditCard className="w-4 h-4 text-blue-400" />
                          Riwayat Pembayaran
                        </Link>
                      </>
                    )}

                    <div className="h-px bg-slate-800/80 my-1" />
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                    >
                      <Icons.LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-md text-xs font-semibold text-blue-300 tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          STUDIO PHOTOBOOTH PREMIUM MANDIRI
        </div>

        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight max-w-5xl leading-tight mb-8">
          Abadikan Momen Seru <br />
          Dengan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">Frame Estetik</span> Pilihan.
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-3xl mb-12 leading-relaxed">
          Sistem self-photobooth canggih & realtime. Pesan jadwal sesi secara langsung, bayar otomatis via QRIS/Transfer, dan unduh foto resolusi tinggi instan dari dashboard pribadi Anda.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-20">
          <Link
            href="/booking"
            className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-white font-bold text-lg hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.35)]"
          >
            Mulai Booking Jadwal
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-full border border-slate-800 bg-slate-900/40 backdrop-blur-md px-8 py-4 text-slate-300 font-semibold text-lg hover:bg-slate-900/80 transition-all duration-300"
          >
            <ImageIcon className="w-5 h-5 text-slate-400" />
            Galeri Foto Saya
          </Link>
        </div>

        {/* Quick Stat Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm p-6 rounded-3xl">
          <div className="text-center p-2">
            <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">100%</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Konfirmasi Realtime</p>
          </div>
          <div className="text-center border-l border-slate-900 p-2">
            <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">20+</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Template Frame Lucu</p>
          </div>
          <div className="text-center border-l border-slate-900 p-2">
            <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">5 Menit</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Cetak & Unduh Cepat</p>
          </div>
          <div className="text-center border-l border-slate-900 p-2">
            <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-400">4.9★</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Rating Kepuasan</p>
          </div>
        </div>
      </header>

      {/* Core Features Section */}
      <section id="fitur" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Teknologi Modern</h2>
          <p className="text-3xl md:text-4xl font-extrabold">Sistem Self-Photobooth Serba Praktis</p>
          <p className="text-slate-400 mt-4">Kami merancang alur foto studio mandiri dengan integrasi penuh untuk memberikan kenyamanan maksimal bagi Anda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={feature.id || idx} className="p-8 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950 border border-slate-900 hover:border-blue-500/30 transition duration-300">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-6">
                <DynamicIcon name={feature.icon} className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>



      {/* Pricing Packages Section */}
      <section id="paket" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-3">Paket Layanan</h2>
          <p className="text-3xl md:text-4xl font-extrabold">Investasi Terbaik untuk Kenangan Anda</p>
          <p className="text-slate-400 mt-4">Pilih paket sesi foto sesuai kebutuhan Anda. Tarif transparan, tanpa biaya tersembunyi.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {packages.map((pkg, idx) => {
            const featuresList = pkg.features
              ? pkg.features.split("\n").map((f: string) => f.trim()).filter(Boolean)
              : [];

            return (
              <div
                key={pkg.id || idx}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${pkg.isPopular
                  ? "bg-[#0c0d1b] border border-blue-500/80 shadow-[0_0_30px_rgba(59,130,246,0.3)] scale-105 md:z-10"
                  : "bg-[#060813] border border-slate-900/95 hover:border-slate-800/80"
                  }`}
              >
                {pkg.isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white text-[10px] font-extrabold px-5 py-1.5 rounded-full border border-blue-400/30 tracking-wider uppercase shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                    Paling Laku
                  </span>
                )}

                <div>
                  {pkg.images && pkg.images.length > 0 && (
                    <div className="w-full h-44 rounded-2xl overflow-hidden mb-6 relative border border-slate-900/60">
                      <img
                        src={pkg.images[0].url}
                        alt={pkg.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2 text-white">{pkg.name}</h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">{pkg.description}</p>

                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-lg font-bold text-slate-300 mr-1">Rp</span>
                    <span className="text-4xl md:text-5xl font-black text-white">
                      {parseFloat(pkg.price).toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs text-slate-500 font-medium ml-1">/sesi</span>
                  </div>

                  <div className="w-full h-px bg-slate-800/60 my-6" />

                  <div className="space-y-4">
                    {featuresList.map((feature: string, fIdx: number) => (
                      <div key={fIdx} className="flex items-center gap-3 text-sm text-slate-300">
                        <div className="w-5 h-5 rounded-full border border-blue-500/60 flex items-center justify-center text-blue-400 shrink-0">
                          <Icons.Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <Link
                    href={`/booking?packageId=${pkg.id}`}
                    className={`w-full py-4 rounded-xl font-bold text-center block transition-all duration-300 ${pkg.isPopular
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-[1.02] shadow-lg shadow-purple-500/20"
                      : "bg-[#121627] hover:bg-[#1a2038] text-slate-200 border border-slate-800 hover:text-white"
                      }`}
                  >
                    {pkg.ctaText || "Pilih Paket"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Kemudahan Alur</h2>
          <p className="text-3xl font-extrabold">Cara Kerja Self-Photobooth</p>
          <p className="text-slate-400 mt-2 text-sm">Hanya butuh 4 langkah mudah untuk mengabadikan momen berharga Anda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {steps.map((step, idx) => (
            <div key={step.id || idx} className="relative text-center md:text-left">
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 text-indigo-400 font-bold mb-6 mx-auto md:mx-0">
                {step.stepNumber}
              </div>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-slate-400 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimoni" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Ulasan Pengunjung</h2>
          <p className="text-3xl font-extrabold">Apa Kata Mereka Tentang Kami</p>
          <p className="text-slate-400 mt-2 text-sm">Review jujur dari para pelanggan setia Visual Space Studio.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.length === 0 ? (
            <div className="col-span-3 text-center text-slate-500 py-10">
              Belum ada ulasan dari pengunjung.
            </div>
          ) : (
            testimonials.map((t, idx) => (
              <div key={idx} className="p-8 rounded-3xl border border-slate-900 bg-slate-950/40 flex flex-col justify-between hover:border-slate-800 transition">
                <div>
                  <div className="flex items-center gap-1 mb-6 text-amber-400">
                    {[...Array(t.stars)].map((_, sIdx) => (
                      <Star key={sIdx} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm italic leading-relaxed mb-8">
                    "{t.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-900">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-xs font-extrabold text-white shrink-0">
                    {t.avatarUrl ? (
                      <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover" />
                    ) : (
                      t.avatar
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{t.name}</h4>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 max-w-4xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">FAQ</h2>
          <p className="text-3xl font-extrabold">Pertanyaan yang Sering Diajukan</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={faq.id || idx}
                className="rounded-2xl border border-slate-900 bg-slate-950/40 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between font-bold text-sm md:text-base hover:bg-slate-900/20 transition duration-200"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 border-t border-slate-900/50 text-slate-400 text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Booking CTA Banner */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-slate-800 p-12 text-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-slate-950/50 backdrop-blur-2xl -z-10" />
          <h2 className="text-3xl md:text-5xl font-black mb-4">Siap untuk Mengabadikan Keseruan?</h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8 text-sm md:text-base">
            Amankan sesi Anda hari ini. Proses reservasi instan, pembayaran aman terkonfirmasi otomatis 24/7.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 rounded-full bg-white text-slate-950 px-8 py-4 font-bold hover:bg-slate-200 hover:scale-105 transition duration-300 shadow-xl"
          >
            Pesan Jadwal Foto Sekarang
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950 py-12 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-300 tracking-tighter">VISUAL SPACE</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-400">
            <a href="#fitur" className="hover:text-white transition">Fitur</a>
            <a href="#paket" className="hover:text-white transition">Paket Harga</a>
            <a href="#testimoni" className="hover:text-white transition">Testimoni</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </div>

          <p className="text-xs">&copy; {new Date().getFullYear()} Visual Space Studio. All rights reserved.</p>
        </div>
      </footer>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-50">
            <h3 className="text-base font-black text-white">Konfirmasi Keluar</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed font-semibold">
              Apakah Anda yakin ingin keluar dari akun Anda?
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 rounded-xl transition cursor-pointer border-0 bg-transparent"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await signOut({ callbackUrl: window.location.origin });
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/10 transition cursor-pointer border-0"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
