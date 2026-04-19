"use client";

import { useMemo, useRef, useEffect, useState } from "react";

interface Booking {
  id: string;
  customerName: string | null;
  customerPhone: string;
  jobDescription: string | null;
  quoteAmount: number;
  durationMinutes: number;
  appointmentStart: string;
  appointmentEnd: string;
  status: string;
}

interface CalendarViewProps {
  bookings: Booking[];
  view: "day" | "week";
  currentDate: Date;
  onBookingClick: (id: string) => void;
}

const HOUR_HEIGHT = 80;
const START_HOUR = 6;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

const STATUS_STYLES: Record<string, { accent: string; bg: string; text: string; label: string }> = {
  PENDING_CONFIRMATION: {
    accent: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.08)",
    text: "text-amber-200",
    label: "Pending",
  },
  CONFIRMED: {
    accent: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.10)",
    text: "text-blue-200",
    label: "Confirmed",
  },
  COMPLETED: {
    accent: "#10b981",
    bg: "rgba(16, 185, 129, 0.10)",
    text: "text-emerald-200",
    label: "Done",
  },
  CANCELLED: {
    accent: "#6b7280",
    bg: "rgba(107, 114, 128, 0.06)",
    text: "text-gray-400",
    label: "Cancelled",
  },
  DECLINED: {
    accent: "#ef4444",
    bg: "rgba(239, 68, 68, 0.06)",
    text: "text-red-400",
    label: "Declined",
  },
};

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return `${hour > 12 ? hour - 12 : hour} ${hour < 12 ? "AM" : "PM"}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/* ── Booking Block ──────────────────────────── */
function BookingBlock({
  booking,
  onClick,
  compact,
  offsetLeft,
  widthPercent,
}: {
  booking: Booking;
  onClick: () => void;
  compact?: boolean;
  offsetLeft?: number;
  widthPercent?: number;
}) {
  const start = new Date(booking.appointmentStart);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const topOffset = ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const height = Math.max((booking.durationMinutes / 60) * HOUR_HEIGHT, 28);
  const style = STATUS_STYLES[booking.status] || STATUS_STYLES.CONFIRMED;

  const left = offsetLeft != null ? `${offsetLeft}%` : "4px";
  const width = widthPercent != null ? `${widthPercent}%` : "calc(100% - 8px)";

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:z-30"
      style={{
        top: `${topOffset}px`,
        height: `${height}px`,
        left,
        width,
        minHeight: "28px",
      }}
    >
      <div
        className="h-full w-full rounded-lg overflow-hidden flex"
        style={{ background: style.bg }}
      >
        {/* Left accent bar */}
        <div
          className="w-[4px] flex-shrink-0 rounded-l-lg"
          style={{ background: style.accent }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0 px-2.5 py-1.5 flex flex-col justify-center">
          <p className={`text-[11px] font-semibold ${style.text} truncate leading-tight`}>
            {booking.customerName || booking.customerPhone}
          </p>
          {!compact && height >= 46 && (
            <p className="text-[10px] text-txt-secondary/70 truncate mt-0.5 leading-tight">
              {formatTime(start)}
              {booking.jobDescription ? ` · ${booking.jobDescription}` : ""}
            </p>
          )}
          {!compact && height >= 66 && (
            <p className="text-[10px] text-txt-secondary/50 truncate mt-0.5">
              ${booking.quoteAmount.toLocaleString()} · {style.label}
            </p>
          )}
        </div>
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{ boxShadow: `0 0 16px ${style.accent}22, 0 2px 8px ${style.accent}11` }}
      />
    </button>
  );
}

/* ── Now Indicator ──────────────────────────── */
function NowIndicator() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < START_HOUR * 60 || minutes > END_HOUR * 60) return null;
  const top = ((minutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;

  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${top}px` }}>
      <div className="flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-[5px] shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
        <div className="flex-1 h-[2px] bg-gradient-to-r from-red-500 to-red-500/0" />
      </div>
    </div>
  );
}

/* ── Hour Grid ──────────────────────────────── */
function HourGrid() {
  return (
    <>
      {HOURS.map((hour) => (
        <div key={hour}>
          {/* Full hour line */}
          <div
            className="absolute left-0 right-0 border-t border-white/[0.04]"
            style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
          />
          {/* Half hour line */}
          <div
            className="absolute left-0 right-0 border-t border-white/[0.03] border-dashed"
            style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
          />
        </div>
      ))}
    </>
  );
}

/* ── Overlap Detection ──────────────────────── */
function resolveOverlaps(bookings: Booking[]): { booking: Booking; col: number; totalCols: number }[] {
  if (bookings.length === 0) return [];

  const sorted = [...bookings].sort((a, b) =>
    new Date(a.appointmentStart).getTime() - new Date(b.appointmentStart).getTime()
  );

  const columns: { end: number; booking: Booking }[][] = [];

  for (const booking of sorted) {
    const start = new Date(booking.appointmentStart).getTime();
    const end = new Date(booking.appointmentEnd).getTime();

    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      const lastInCol = columns[col][columns[col].length - 1];
      if (start >= lastInCol.end) {
        columns[col].push({ end, booking });
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([{ end, booking }]);
    }
  }

  const result: { booking: Booking; col: number; totalCols: number }[] = [];
  for (let col = 0; col < columns.length; col++) {
    for (const item of columns[col]) {
      result.push({ booking: item.booking, col, totalCols: columns.length });
    }
  }

  return result;
}

/* ── Day Column ─────────────────────────────── */
function DayColumn({
  date,
  bookings,
  onBookingClick,
  showHeader,
  compact,
}: {
  date: Date;
  bookings: Booking[];
  onBookingClick: (id: string) => void;
  showHeader?: boolean;
  compact?: boolean;
}) {
  const today = new Date();
  const isToday = isSameDay(date, today);
  const dayBookings = bookings.filter((b) => isSameDay(new Date(b.appointmentStart), date));
  const resolved = resolveOverlaps(dayBookings);

  return (
    <div className={`flex-1 min-w-0 ${compact ? "border-r border-white/[0.04] last:border-r-0" : ""}`}>
      {showHeader && (
        <div className="sticky top-0 z-10 text-center py-2.5 border-b border-white/[0.04] bg-surface/95 backdrop-blur-sm">
          <p className="text-[10px] font-medium text-txt-secondary uppercase tracking-wider">
            {date.toLocaleDateString("en-US", { weekday: "short" })}
          </p>
          <div className="mt-0.5 inline-flex items-center justify-center">
            <span
              className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                isToday
                  ? "bg-brand-500 text-white"
                  : "text-txt-primary"
              }`}
            >
              {date.getDate()}
            </span>
          </div>
        </div>
      )}

      <div className="relative" style={{ height: `${TOTAL_HEIGHT}px` }}>
        <HourGrid />
        {isToday && <NowIndicator />}

        {resolved.map(({ booking, col, totalCols }) => {
          const colWidth = (100 - 4) / totalCols; // 4% padding total
          const left = 2 + col * colWidth;
          return (
            <BookingBlock
              key={booking.id}
              booking={booking}
              onClick={() => onBookingClick(booking.id)}
              compact={compact}
              offsetLeft={left}
              widthPercent={colWidth - 1}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── Time Labels Column ─────────────────────── */
function TimeLabels({ topPadding }: { topPadding?: number }) {
  return (
    <div className="w-16 flex-shrink-0">
      {topPadding ? <div style={{ height: `${topPadding}px` }} /> : null}
      <div style={{ height: `${TOTAL_HEIGHT}px` }} className="relative">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="absolute right-3 flex items-center"
            style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT - 7}px` }}
          >
            <span className="text-[11px] text-txt-secondary/60 font-medium tabular-nums">
              {formatHour(hour)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Calendar View ─────────────────────── */
export default function CalendarView({ bookings, view, currentDate, onBookingClick }: CalendarViewProps) {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const activeBookings = bookings.filter((b) =>
    ["PENDING_CONFIRMATION", "CONFIRMED", "COMPLETED"].includes(b.status)
  );

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (hasScrolled.current || !scrollRef.current) return;
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    if (minutes >= START_HOUR * 60 && minutes <= END_HOUR * 60) {
      const scrollTo = ((minutes - START_HOUR * 60) / 60) * HOUR_HEIGHT - 120;
      scrollRef.current.scrollTop = Math.max(0, scrollTo);
    }
    hasScrolled.current = true;
  }, []);

  // Check if there are any bookings visible in current view
  const hasVisibleBookings = activeBookings.some((b) => {
    const s = new Date(b.appointmentStart);
    if (view === "day") return isSameDay(s, currentDate);
    return weekDays.some((d) => isSameDay(s, d));
  });

  if (view === "day") {
    return (
      <div className="bg-surface border border-white/[0.04] rounded-2xl overflow-hidden">
        <div
          ref={scrollRef}
          className="max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-thin"
        >
          <div className="flex">
            <TimeLabels />
            <div className="flex-1 border-l border-white/[0.04]">
              <DayColumn
                date={currentDate}
                bookings={activeBookings}
                onBookingClick={onBookingClick}
              />
            </div>
          </div>
        </div>

        {/* Empty state overlay */}
        {!hasVisibleBookings && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-txt-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <p className="text-sm text-txt-secondary/50">No bookings</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Week view
  return (
    <div className="bg-surface border border-white/[0.04] rounded-2xl overflow-hidden">
      <div
        ref={scrollRef}
        className="max-h-[calc(100vh-220px)] overflow-y-auto overflow-x-auto scrollbar-thin"
      >
        <div className="flex min-w-[640px]">
          <div className="w-16 flex-shrink-0">
            {/* Empty header space aligned with day headers */}
            <div className="h-[60px] border-b border-white/[0.04]" />
            <div style={{ height: `${TOTAL_HEIGHT}px` }} className="relative">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-3 flex items-center"
                  style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT - 7}px` }}
                >
                  <span className="text-[11px] text-txt-secondary/60 font-medium tabular-nums">
                    {formatHour(hour)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-1 border-l border-white/[0.04]">
            {weekDays.map((day) => (
              <DayColumn
                key={day.toISOString()}
                date={day}
                bookings={activeBookings}
                onBookingClick={onBookingClick}
                showHeader
                compact
              />
            ))}
          </div>
        </div>
      </div>

      {!hasVisibleBookings && (
        <div className="py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-txt-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <p className="text-sm text-txt-secondary/50">No bookings this week</p>
        </div>
      )}
    </div>
  );
}
