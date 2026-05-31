"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Check, 
  X, 
  ArrowRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCalendarBookingsStatus } from "@/features/booking/actions/booking.actions";
import { getPusherClient } from "@/lib/pusher";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const DAYS_OF_WEEK = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

interface BookingStatus {
  date: string;
  time: string;
}

interface CalendarData {
  bookings: BookingStatus[];
  photographerCount: number;
  openingHour: string;
  closingHour: string;
}

export default function CalendarPage() {
  const router = useRouter();
  
  // Date states
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`
  );

  // Fetching state
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);

  // Fetch calendar status for current month/year
  const fetchCalendarStatus = useCallback(async (year: number, month: number) => {
    setLoading(true);
    try {
      const res = await getCalendarBookingsStatus(year, month);
      if (res.success && res.data) {
        setCalendarData(res.data);
      } else {
        toast.error(res.message || "Gagal memuat jadwal antrean.");
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendarStatus(currentYear, currentMonth);
  }, [currentYear, currentMonth, fetchCalendarStatus]);

  // Subscribe to Pusher channel for real-time calendar updates
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe("calendar-channel");
    
    channel.bind("calendar-updated", () => {
      fetchCalendarStatus(currentYear, currentMonth);
    });

    return () => {
      pusher.unsubscribe("calendar-channel");
    };
  }, [currentYear, currentMonth, fetchCalendarStatus]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  // Navigate to next month
  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Generate day list for the calendar grid
  const generateCalendarCells = () => {
    const cells = [];
    
    // First day of current month
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    // Number of days in current month
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    // Starting day of week (Monday = 0, Sunday = 6)
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    
    // Previous month info for padding cells
    const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonthIndex = currentMonth === 1 ? 12 : currentMonth - 1;
    const daysInPrevMonth = new Date(prevMonthYear, prevMonthIndex, 0).getDate();

    // 1. Render padding cells from previous month
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const dateStr = `${prevMonthYear}-${prevMonthIndex.toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isPast: new Date(prevMonthYear, prevMonthIndex - 1, dayNum + 1) < today,
      });
    }

    // 2. Render current month's days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
      const dayDate = new Date(currentYear, currentMonth - 1, dayNum);
      const isToday = 
        today.getDate() === dayNum && 
        today.getMonth() === currentMonth - 1 && 
        today.getFullYear() === currentYear;

      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isPast: new Date(currentYear, currentMonth - 1, dayNum, 23, 59, 59) < today,
        isToday,
      });
    }

    // 3. Render padding cells from next month (to fill the grid to multiple of 7)
    const totalRendered = cells.length;
    const remaining = totalRendered % 7 === 0 ? 0 : 7 - (totalRendered % 7);
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const nextMonthIndex = currentMonth === 12 ? 1 : currentMonth + 1;

    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const dateStr = `${nextMonthYear}-${nextMonthIndex.toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isPast: false,
      });
    }

    return cells;
  };

  // Get active list of hours/slots based on settings
  const generateHourlySlots = () => {
    if (!calendarData) return [];
    const startHour = parseInt(calendarData.openingHour.split(":")[0]);
    const endHour = parseInt(calendarData.closingHour.split(":")[0]);
    
    const slots = [];
    for (let h = startHour; h < endHour; h++) {
      slots.push(`${h.toString().padStart(2, "0")}:00`);
    }
    return slots;
  };

  // Get details for a specific slot on selected day
  const getSlotDetails = (time: string, customDateStr?: string) => {
    const targetDateStr = customDateStr || selectedDateStr;
    if (!calendarData) return { bookedCount: 0, maxCount: 1, isFull: false };
    
    const bookedCount = calendarData.bookings.filter(
      b => b.date === targetDateStr && b.time === time
    ).length;
    
    const maxCount = calendarData.photographerCount || 1;
    return {
      bookedCount,
      maxCount,
      isFull: bookedCount >= maxCount
    };
  };

  // Analyze a day's slot status
  const getDayStatus = (dateStr: string) => {
    if (!calendarData) return { total: 0, available: 0, status: "loading" };
    
    const slots = generateHourlySlots();
    let availableCount = 0;
    
    slots.forEach(slot => {
      const { isFull } = getSlotDetails(slot, dateStr);
      if (!isFull) availableCount++;
    });

    let status = "available";
    if (availableCount === 0) {
      status = "full";
    } else if (availableCount < slots.length) {
      status = "partial";
    }

    return {
      total: slots.length,
      available: availableCount,
      status
    };
  };

  const activeCells = generateCalendarCells();
  const activeHourlySlots = generateHourlySlots();

  // Selected date components
  const selectedDateObj = new Date(selectedDateStr + "T00:00:00");
  const isSelectedDatePast = selectedDateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Background Decorative Glow */}
      <div className="absolute top-20 right-10 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-indigo-500" />
            Kalender Jadwal Booking
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
            Lihat ketersediaan jam sesi studio secara langsung berdasarkan slot kosong fotografer.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-650 dark:text-zinc-300">Tersedia Penuh</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-650 dark:text-zinc-300">Terisi Sebagian</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-650 dark:text-zinc-300">Penuh / Tutup</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Monthly Grid Layout */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-zinc-800/80 p-6 shadow-xl shadow-purple-500/[0.01]">
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </h3>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevMonth}
                className="h-9 w-9 rounded-xl hover:bg-slate-150 border-slate-200 dark:border-zinc-800 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentYear(today.getFullYear());
                  setCurrentMonth(today.getMonth() + 1);
                  setSelectedDateStr(
                    `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`
                  );
                }}
                className="text-xs font-bold rounded-xl border-slate-200 dark:border-zinc-800 hover:bg-slate-150 dark:hover:bg-zinc-800 cursor-pointer px-3"
              >
                Hari Ini
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                className="h-9 w-9 rounded-xl hover:bg-slate-150 border-slate-200 dark:border-zinc-800 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Weekdays Labels */}
          <div className="grid grid-cols-7 text-center gap-1 mb-2">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="text-xs font-bold text-slate-400 dark:text-zinc-500 py-2 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          {loading ? (
            <div className="h-[340px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-650 border-t-transparent animate-spin" />
                <p className="text-xs text-slate-400 dark:text-zinc-550 font-semibold animate-pulse">Memuat jadwal...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {activeCells.map((cell, index) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const statusDetails = getDayStatus(cell.dateStr);
                
                // Determine styling based on availability
                let dotColorClass = "bg-slate-300 dark:bg-zinc-700";
                let dayBgClass = "hover:bg-slate-100 dark:hover:bg-zinc-800/60";

                if (cell.isPast) {
                  dotColorClass = "bg-slate-200 dark:bg-zinc-800";
                  dayBgClass = "opacity-40 cursor-not-allowed";
                } else if (cell.isCurrentMonth) {
                  if (statusDetails.status === "full") {
                    dotColorClass = "bg-rose-500";
                    dayBgClass = "bg-rose-50/10 dark:bg-rose-950/5 border border-rose-500/10 hover:bg-rose-100/20 dark:hover:bg-rose-950/20";
                  } else if (statusDetails.status === "partial") {
                    dotColorClass = "bg-amber-500";
                    dayBgClass = "bg-amber-50/10 dark:bg-amber-950/5 border border-amber-500/10 hover:bg-amber-100/20 dark:hover:bg-amber-950/20";
                  } else {
                    dotColorClass = "bg-emerald-500";
                    dayBgClass = "bg-emerald-50/10 dark:bg-emerald-950/5 border border-emerald-500/10 hover:bg-emerald-100/20 dark:hover:bg-emerald-950/20";
                  }
                }

                if (isSelected) {
                  dayBgClass = "bg-gradient-to-tr from-indigo-600 to-purple-650 text-white shadow-lg shadow-indigo-600/20 scale-[1.02] border border-indigo-400/20";
                }

                return (
                  <button
                    key={`${cell.dateStr}-${index}`}
                    disabled={cell.isPast && !cell.isToday}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`h-14 sm:h-16 rounded-2xl flex flex-col justify-between p-2 text-left relative transition-all cursor-pointer ${dayBgClass}`}
                  >
                    <span className={`text-xs font-bold ${
                      isSelected 
                        ? "text-white" 
                        : cell.isToday 
                          ? "text-indigo-500 dark:text-indigo-400 underline decoration-2 underline-offset-4" 
                          : "text-slate-800 dark:text-zinc-200"
                    }`}>
                      {cell.dayNumber}
                    </span>

                    {/* Indicators */}
                    <div className="flex items-center justify-between w-full mt-1.5">
                      {/* Past vs Active Slot Indicator */}
                      {cell.isPast ? (
                        <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-600">Selesai</span>
                      ) : cell.isCurrentMonth && calendarData ? (
                        <span className={`text-[9px] font-black tracking-tighter ${isSelected ? "text-indigo-200" : "text-slate-400 dark:text-zinc-500"}`}>
                          {statusDetails.available} Jam
                        </span>
                      ) : <span />}

                      {/* Colored Status Dot */}
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? "bg-white" : dotColorClass}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Tip Banner */}
          <div className="mt-6 flex items-start gap-2.5 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/60 dark:border-indigo-950/40 text-xs">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-slate-650 dark:text-zinc-400 font-medium leading-relaxed">
              <strong>Info Jadwal:</strong> Slot studio dihitung berdasarkan jumlah fotografer yang terdaftar. Hari libur/slot penuh ditandai dengan warna merah. Sesi yang telah lampau tidak dapat dipesan kembali.
            </p>
          </div>
        </div>

        {/* Right: Detailed Slots Panel */}
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-zinc-800/80 p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-black text-slate-800 dark:text-slate-200">Rincian Jam Booking</h3>
          </div>
          <p className="text-xs text-slate-450 dark:text-zinc-500 font-semibold mb-6">
            Tanggal: {selectedDateObj.toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-indigo-650 border-t-transparent animate-spin" />
            </div>
          ) : isSelectedDatePast ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                <X className="w-6 h-6 text-slate-400 dark:text-zinc-550" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-350">Sesi Telah Lampau</h4>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                Anda tidak dapat memesan jadwal untuk waktu yang sudah terlewat.
              </p>
            </div>
          ) : activeHourlySlots.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              Tidak ada jam operasional tersedia.
            </div>
          ) : (
            <div className="space-y-3.5">
              {activeHourlySlots.map((slot) => {
                const { bookedCount, maxCount, isFull } = getSlotDetails(slot);
                const availableCount = maxCount - bookedCount;

                return (
                  <div
                    key={slot}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${
                      isFull
                        ? "bg-rose-50/10 dark:bg-rose-950/5 border-rose-500/10 text-rose-400/80"
                        : availableCount === maxCount
                          ? "bg-slate-50 dark:bg-zinc-950/30 border-slate-200 dark:border-zinc-800/80 hover:border-indigo-500/30"
                          : "bg-amber-50/10 dark:bg-amber-950/5 border-amber-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold tracking-tight shadow-sm shrink-0 ${
                        isFull
                          ? "bg-rose-500/10 text-rose-500"
                          : availableCount === maxCount
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {slot}
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-tight">
                          {isFull 
                            ? "Penuh / Tutup" 
                            : availableCount === maxCount 
                              ? "Tersedia Penuh" 
                              : `Sisa ${availableCount} Slot`}
                        </p>
                        <p className="text-[10px] text-slate-405 dark:text-zinc-500 font-semibold mt-0.5">
                          Terisi: {bookedCount} / {maxCount} Fotografer
                        </p>
                      </div>
                    </div>

                    {!isFull && (
                      <Button
                        size="sm"
                        onClick={() => router.push(`/booking?date=${selectedDateStr}&time=${slot}`)}
                        className="h-8 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-[11px] gap-1 cursor-pointer border-0 shadow-sm shadow-indigo-650/10"
                      >
                        Pesan
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
