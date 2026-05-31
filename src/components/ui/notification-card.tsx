import React from "react";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
  emoji: string;
  title: string; // The bold title containing crucial info (e.g., "[09:00] Budi - Sesi Dasar")
  description: string; // The supporting detail text
  type?: "success" | "warning" | "error" | "info";
  className?: string;
}

export function NotificationCard({
  emoji,
  title,
  description,
  type = "info",
  className,
}: NotificationCardProps) {
  // Styles based on notification type
  const typeStyles = {
    success: "bg-green-500/10 border-green-500/20",
    warning: "bg-amber-500/10 border-amber-500/20",
    error: "bg-rose-500/10 border-rose-500/20",
    info: "bg-blue-500/10 border-blue-500/20",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-2xl border shadow-sm backdrop-blur-md transition-all hover:shadow-md",
        typeStyles[type],
        className
      )}
    >
      {/* Emoji Icon Container */}
      <div className="flex-shrink-0 text-2xl mt-0.5">
        {emoji}
      </div>

      {/* Notification Text */}
      <div className="flex flex-col gap-1.5">
        {/* Rule 1 & 2: Emoji visually leading, BOLD first line with crucial info */}
        <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-[15px] leading-tight">
          {title}
        </h4>
        
        {/* Rule 3: Regular text description underneath */}
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
          {description}
        </p>
      </div>
    </div>
  );
}
