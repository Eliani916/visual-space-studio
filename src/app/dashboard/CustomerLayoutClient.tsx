"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Camera,
  Home,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  User,
  Image,
  Clock,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

interface CustomerLayoutClientProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
    image?: string | null;
  };
}

export default function CustomerLayoutClient({ children, user }: CustomerLayoutClientProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const navigation = [
    {
      name: "Halaman Utama",
      href: "/",
      icon: Home,
    },
    {
      name: "Booking Aktif",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Kalender Jadwal",
      href: "/dashboard/calendar",
      icon: CalendarDays,
    },
    {
      name: "Booking Dulu",
      href: "/dashboard/history",
      icon: Clock,
    },
    {
      name: "Hasil Foto",
      href: "/dashboard/gallery",
      icon: Image,
    },
  ];

  // Helper to get active page title
  const getPageTitle = () => {
    if (pathname === "/dashboard") {
      return "Booking Aktif";
    }
    if (pathname === "/dashboard/calendar") {
      return "Kalender Jadwal";
    }
    if (pathname === "/dashboard/history") {
      return "Booking Dulu (Riwayat)";
    }
    if (pathname === "/dashboard/gallery") {
      return "Hasil Foto Sesi";
    }
    if (pathname.startsWith("/dashboard/")) {
      return "Detail Booking";
    }
    if (pathname === "/booking") {
      return "Booking Studio Baru";
    }
    return "Pelanggan Panel";
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: window.location.origin + "/login" });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "PL";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 font-sans">
      {/* BACKGROUND DECORATIVE ELEMENTS */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden lg:flex lg:flex-col lg:shrink-0 bg-slate-900 border-r border-slate-800 text-slate-200 transition-all duration-300 ${isCollapsed ? "lg:w-20" : "lg:w-72"}`}>
        {/* Brand header */}
        <div className={`flex items-center gap-3 px-6 py-6 border-b border-slate-800/60 relative ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 shrink-0">
              <Camera className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in duration-200">
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  Visual Space
                </h1>
                <p className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">
                  Pelanggan Panel
                </p>
              </div>
            )}
          </div>

          {/* Collapse button */}
          {!isCollapsed ? (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition cursor-pointer"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setIsCollapsed(false)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center border border-slate-800 shadow-lg focus:outline-none transition cursor-pointer"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = item.href === "/"
              ? pathname === "/"
              : item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isCollapsed ? "justify-center p-3" : "gap-3.5 px-4 py-3"
                } ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 shrink-0 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                {!isCollapsed && (
                  <span className="animate-in fade-in duration-200 truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* MOBILE SIDEBAR DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex flex-col w-72 max-w-xs bg-slate-900 text-slate-200 shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Close button inside Drawer */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Brand header */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800/60">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                  Visual Space
                </h1>
                <p className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">
                  Pelanggan Panel
                </p>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = item.href === "/"
                  ? pathname === "/"
                  : item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80 transition-colors">
          {/* Left section: Hamburger & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 lg:hidden focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right section: Quick profile + role badge */}
          <div className="flex items-center gap-4">
            {/* Quick theme toggle for desktop */}
             <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 focus:outline-none transition-all cursor-pointer"
              title="Toggle theme"
            >
              {!mounted ? (
                <div className="w-5 h-5" />
              ) : theme === "dark" ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600" />
              )}
            </button>

            {/* Vertical Divider */}
            <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800" />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/85 transition-all focus:outline-none cursor-pointer"
              >
                <div className="w-8.5 h-8.5 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden shrink-0">
                  {user?.image ? (
                    <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(user?.name)
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-800 dark:text-zinc-150 leading-tight">
                    {user?.name || "Pelanggan"}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-550 uppercase font-bold tracking-wider">
                    {user?.role?.toLowerCase() || "pelanggan"}
                  </p>
                </div>
                <svg className="w-3 h-3 text-slate-400 dark:text-zinc-550 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-60 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800/60">
                      <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Nama</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">{user?.name || "Pelanggan"}</p>
                      <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 mt-2">Email</p>
                      <p className="text-xs text-slate-650 dark:text-zinc-350 truncate">{user?.email || "customer@example.com"}</p>
                      <p className="mt-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-750 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                          {user?.role || "PELANGGAN"}
                        </span>
                      </p>
                    </div>
                    <div className="p-1.5 border-b border-slate-100 dark:border-zinc-800/60">
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60 rounded-xl transition border-0 text-left cursor-pointer"
                      >
                        <User className="w-4 h-4 text-indigo-500" />
                        <span>Edit Profil</span>
                      </Link>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-655 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-xl transition cursor-pointer border-0 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* CONTAINER FOR CHILDREN */}
        <main className="flex-1 overflow-y-auto focus:outline-none bg-slate-50 dark:bg-zinc-950/40">
          {children}
        </main>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-50">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Konfirmasi Keluar</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed font-semibold">
              Apakah Anda yakin ingin keluar dari akun Anda?
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer border-0 bg-transparent"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-xs font-bold text-white bg-red-655 hover:bg-red-750 rounded-xl shadow-md shadow-red-655/10 transition cursor-pointer border-0"
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
