"use client";

import { useLoadingStore } from "@/store/useLoadingStore";
import { Loader2 } from "lucide-react";

export function GlobalLoader() {
  const { isLoading, message } = useLoadingStore();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
      <div className="flex flex-col items-center gap-4 bg-white dark:bg-zinc-900 px-8 py-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">{message}</p>
      </div>
    </div>
  );
}
