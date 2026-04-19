"use client";

import { useEffect, useState, useMemo } from "react";

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  startDateTime: string;
  endDateTime: string;
}

interface SlotPickerProps {
  contractorId: string;
  durationMinutes: number;
  onSelect: (slot: TimeSlot | null) => void;
  selectedSlot?: TimeSlot | null;
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function getMonthDays(year: number, month: number): { date: Date; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Fill in days from previous month to start on Sunday
  const startDow = firstDay.getDay();
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }

  // Fill remaining row
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
  }

  return days;
}

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function SlotPicker({ contractorId, durationMinutes, onSelect, selectedSlot }: SlotPickerProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Load slots for the visible month (plus a few days around edges)
  useEffect(() => {
    setLoading(true);
    setError("");

    const start = new Date(viewYear, viewMonth, 1);
    const end = new Date(viewYear, viewMonth + 1, 0); // last day of month

    // Clamp start to today if month includes today
    const fetchStart = start < today ? today : start;

    // Don't fetch past months
    if (end < today) {
      setSlots([]);
      setLoading(false);
      return;
    }

    fetch(
      `/api/availability/slots?contractorId=${contractorId}&startDate=${fetchStart.toISOString()}&endDate=${end.toISOString()}&duration=${durationMinutes}`
    )
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setSlots(data.slots || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load available times.");
        setLoading(false);
      });
  }, [contractorId, durationMinutes, viewYear, viewMonth, today]);

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const map: Record<string, TimeSlot[]> = {};
    for (const slot of slots) {
      if (!map[slot.date]) map[slot.date] = [];
      map[slot.date].push(slot);
    }
    return map;
  }, [slots]);

  // Available dates set (for calendar dot indicators)
  const availableDates = useMemo(() => new Set(Object.keys(slotsByDate)), [slotsByDate]);

  const monthDays = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Can't go before current month
  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());
  // Max 3 months ahead
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 1);
  const canGoNext = new Date(viewYear, viewMonth + 1, 1) < maxDate;

  function navigateMonth(dir: -1 | 1) {
    let newMonth = viewMonth + dir;
    let newYear = viewYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setViewMonth(newMonth);
    setViewYear(newYear);
    setSelectedDate(null);
  }

  function handleDayClick(dateStr: string) {
    if (selectedDate === dateStr) {
      setSelectedDate(null);
    } else {
      setSelectedDate(dateStr);
      // Clear selected slot when switching days
      if (selectedSlot && selectedSlot.date !== dateStr) {
        onSelect(null);
      }
    }
  }

  const timeSlotsForDay = selectedDate ? (slotsByDate[selectedDate] || []) : [];

  return (
    <div>
      {/* ── Month calendar ───────────────────── */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            disabled={!canGoPrev}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-txt-secondary hover:text-txt-primary hover:bg-white/[0.06] disabled:opacity-20 disabled:hover:bg-transparent transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-txt-primary">{monthLabel}</span>
          <button
            type="button"
            onClick={() => navigateMonth(1)}
            disabled={!canGoNext}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-txt-secondary hover:text-txt-primary hover:bg-white/[0.06] disabled:opacity-20 disabled:hover:bg-transparent transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-txt-secondary/50 uppercase tracking-wider py-1.5">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {monthDays.map(({ date, isCurrentMonth }, i) => {
            const dateStr = dateToStr(date);
            const isPast = date < today;
            const isToday = isSameDay(date, today);
            const hasSlots = availableDates.has(dateStr);
            const isSelected = selectedDate === dateStr;
            const isDisabled = !isCurrentMonth || isPast || (!hasSlots && !loading);

            return (
              <button
                key={i}
                type="button"
                disabled={isDisabled}
                onClick={() => hasSlots && handleDayClick(dateStr)}
                className={`
                  relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all duration-150
                  ${!isCurrentMonth ? "text-white/[0.08]" : ""}
                  ${isCurrentMonth && isPast ? "text-txt-secondary/25 cursor-not-allowed" : ""}
                  ${isCurrentMonth && !isPast && !hasSlots && !loading ? "text-txt-secondary/30 cursor-not-allowed" : ""}
                  ${isCurrentMonth && !isPast && hasSlots && !isSelected ? "text-txt-primary hover:bg-white/[0.06] cursor-pointer font-medium" : ""}
                  ${isSelected ? "bg-brand-500 text-white font-semibold shadow-md" : ""}
                  ${isToday && !isSelected ? "ring-1 ring-brand-500/40" : ""}
                `}
              >
                <span>{date.getDate()}</span>
                {/* Availability dot */}
                {hasSlots && isCurrentMonth && !isPast && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="flex items-center justify-center py-3 gap-2">
            <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-txt-secondary">Loading availability...</span>
          </div>
        )}

        {error && <p className="text-xs text-red-400 text-center py-3">{error}</p>}
      </div>

      {/* ── Time slots for selected day ──────── */}
      {selectedDate && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-txt-secondary mb-3">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>

          {timeSlotsForDay.length === 0 ? (
            <p className="text-sm text-txt-secondary/50 text-center py-6">No available times on this day.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {timeSlotsForDay.map((slot) => {
                const isSelected = selectedSlot?.startDateTime === slot.startDateTime;
                return (
                  <button
                    key={slot.startDateTime}
                    type="button"
                    onClick={() => onSelect(isSelected ? null : slot)}
                    className={`py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isSelected
                        ? "bg-brand-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                        : "bg-white/[0.04] text-txt-primary hover:bg-white/[0.08] border border-white/[0.06]"
                    }`}
                  >
                    {formatTime12(slot.startTime)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Prompt to select a date */}
      {!selectedDate && !loading && !error && slots.length > 0 && (
        <p className="text-xs text-txt-secondary/50 text-center mt-3">
          Select a date to see available times
        </p>
      )}

      {!selectedDate && !loading && !error && slots.length === 0 && (
        <div className="text-center mt-3">
          <p className="text-xs text-txt-secondary/50">No availability this month</p>
          {canGoNext && (
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="text-brand-500 text-xs mt-1 hover:underline"
            >
              Check next month →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
