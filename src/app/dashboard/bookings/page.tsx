"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import CalendarView from "@/components/CalendarView";

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
  isManualBooking: boolean;
  createdAt: string;
}

type ViewType = "day" | "week" | "list";
type StatusFilter = "all" | "PENDING_CONFIRMATION" | "CONFIRMED" | "COMPLETED";

const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  PENDING_CONFIRMATION: { label: "Pending", style: "text-amber-400 bg-amber-500/10" },
  CONFIRMED: { label: "Confirmed", style: "text-blue-400 bg-blue-500/10" },
  COMPLETED: { label: "Done", style: "text-emerald-400 bg-emerald-500/10" },
  CANCELLED: { label: "Cancelled", style: "text-gray-400 bg-gray-500/10" },
  DECLINED: { label: "Declined", style: "text-red-400 bg-red-500/10" },
};

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "PENDING_CONFIRMATION", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
];

function formatDateLabel(date: Date, view: ViewType): string {
  if (view === "list") return "";
  if (view === "day") {
    const today = new Date();
    const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }
  const start = new Date(date); start.setDate(start.getDate() - start.getDay());
  const end = new Date(start); end.setDate(start.getDate() + 6);
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export default function BookingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewType>("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setBookings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const today = new Date();
    const todayBookings = bookings.filter((b) => {
      const s = new Date(b.appointmentStart);
      return isSameDay(s, today) && ["PENDING_CONFIRMATION", "CONFIRMED"].includes(b.status);
    });
    const todayTotal = todayBookings.reduce((sum, b) => sum + (b.quoteAmount || 0), 0);
    const pending = bookings.filter((b) => b.status === "PENDING_CONFIRMATION").length;
    return { today: todayBookings.length, todayTotal, pending };
  }, [bookings]);

  // Filtered bookings based on status filter
  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  // Active bookings sorted for list view
  const listBookings = useMemo(() =>
    [...filteredBookings]
      .filter((b) => ["PENDING_CONFIRMATION", "CONFIRMED", "COMPLETED"].includes(b.status))
      .sort((a, b) => new Date(a.appointmentStart).getTime() - new Date(b.appointmentStart).getTime()),
    [filteredBookings]
  );

  // Day total for day view
  const dayTotal = useMemo(() => {
    return bookings
      .filter((b) => {
        const s = new Date(b.appointmentStart);
        return isSameDay(s, currentDate) && ["CONFIRMED", "PENDING_CONFIRMATION", "COMPLETED"].includes(b.status);
      })
      .reduce((sum, b) => sum + (b.quoteAmount || 0), 0);
  }, [bookings, currentDate]);

  const dayBookingCount = useMemo(() => {
    return bookings.filter((b) => {
      const s = new Date(b.appointmentStart);
      return isSameDay(s, currentDate) && ["CONFIRMED", "PENDING_CONFIRMATION", "COMPLETED"].includes(b.status);
    }).length;
  }, [bookings, currentDate]);

  // Week stats
  const weekBookings = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return bookings.filter((b) => {
      const s = new Date(b.appointmentStart);
      return s >= start && s < end && ["CONFIRMED", "PENDING_CONFIRMATION", "COMPLETED"].includes(b.status);
    });
  }, [bookings, currentDate]);

  const weekBookingCount = weekBookings.length;
  const weekTotal = weekBookings.reduce((sum, b) => sum + (b.quoteAmount || 0), 0);

  function navigate(direction: -1 | 1) {
    const d = new Date(currentDate);
    if (view === "day") d.setDate(d.getDate() + direction);
    else d.setDate(d.getDate() + direction * 7);
    setCurrentDate(d);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === listBookings.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(listBookings.map((b) => b.id)));
    }
  }

  async function bulkAction(action: string) {
    setBulkLoading(true);
    try {
      const res = await fetch("/api/bookings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      const data = await res.json();
      if (res.ok) {
        if (action === "DELETE") {
          setBookings((prev) => prev.filter((b) => !selected.has(b.id)));
          toast(`${data.count} booking${data.count !== 1 ? "s" : ""} deleted`, "success");
        } else {
          setBookings((prev) =>
            prev.map((b) => selected.has(b.id) ? { ...b, status: action } : b)
          );
          toast(`${data.count} booking${data.count !== 1 ? "s" : ""} updated`, "success");
        }
        setSelected(new Set());
        setSelecting(false);
      } else {
        toast(data.error || "Something went wrong.", "error");
      }
    } catch {
      toast("Something went wrong.", "error");
    }
    setBulkLoading(false);
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Schedule</h1>
          <p className="text-sm text-txt-secondary mt-0.5">
            {stats.today > 0
              ? `${stats.today} booking${stats.today !== 1 ? "s" : ""} today`
              : "No bookings today"}
            {stats.pending > 0 && (
              <span className="text-amber-400"> · {stats.pending} pending</span>
            )}
          </p>
        </div>
        <Link
          href="/dashboard/bookings/new"
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-btn transition-all duration-200 hover:shadow-glow flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New booking
        </Link>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto">
        {STATUS_FILTERS.map((f) => {
          const count = f.value === "all"
            ? bookings.filter((b) => ["PENDING_CONFIRMATION", "CONFIRMED", "COMPLETED"].includes(b.status)).length
            : bookings.filter((b) => b.status === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                statusFilter === f.value
                  ? "bg-brand-500 text-white"
                  : "text-txt-secondary hover:text-txt-primary hover:bg-white/[0.06]"
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        {/* Left: navigation + date (hidden in list view) */}
        {view !== "list" ? (
          <div className="flex items-center gap-1.5">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-txt-secondary hover:text-txt-primary hover:bg-white/[0.06] transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button onClick={() => navigate(1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-txt-secondary hover:text-txt-primary hover:bg-white/[0.06] transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-txt-secondary hover:text-txt-primary hover:bg-white/[0.06] transition-all ml-1">
              Today
            </button>
            <span className="text-sm font-semibold text-txt-primary ml-2">
              {formatDateLabel(currentDate, view)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {selecting ? (
              <>
                <button
                  onClick={toggleSelectAll}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150 ${
                    selected.size > 0 && selected.size === listBookings.length
                      ? "bg-brand-500 border-brand-500"
                      : "border-white/20 hover:border-white/40"
                  }`}
                >
                  {selected.size > 0 && selected.size === listBookings.length && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  {selected.size > 0 && selected.size < listBookings.length && (
                    <div className="w-2.5 h-0.5 bg-brand-500 rounded-full" />
                  )}
                </button>
                <span className="text-xs text-txt-secondary">
                  {selected.size > 0 ? `${selected.size} selected` : `${listBookings.length} bookings`}
                </span>
                <button
                  onClick={() => { setSelecting(false); setSelected(new Set()); }}
                  className="text-xs text-txt-secondary hover:text-txt-primary ml-1 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setSelecting(true)}
                className="text-xs font-medium text-txt-secondary hover:text-txt-primary transition-colors"
              >
                Select
              </button>
            )}
          </div>
        )}

        {/* Right: view toggle */}
        <div className="flex bg-white/[0.03] rounded-lg p-0.5 gap-0.5">
          {/* Hide Week on mobile */}
          <button
            onClick={() => { setView("day"); setSelected(new Set()); setSelecting(false); }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
              view === "day" ? "bg-brand-500 text-white shadow-sm" : "text-txt-secondary hover:text-txt-primary"
            }`}
          >
            Day
          </button>
          <button
            onClick={() => { setView("week"); setSelected(new Set()); setSelecting(false); }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
              view === "week" ? "bg-brand-500 text-white shadow-sm" : "text-txt-secondary hover:text-txt-primary"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => { setView("list"); setSelected(new Set()); setSelecting(false); }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
              view === "list" ? "bg-brand-500 text-white shadow-sm" : "text-txt-secondary hover:text-txt-primary"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Day/week total summary */}
      {view === "day" && dayBookingCount > 0 && (
        <div className="flex items-center justify-between px-1 mb-3">
          <span className="text-xs text-txt-secondary">
            {dayBookingCount} booking{dayBookingCount !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-txt-secondary">
            Total: <span className="text-earnings font-semibold">${dayTotal.toLocaleString()}</span>
          </span>
        </div>
      )}
      {view === "week" && weekBookingCount > 0 && (
        <div className="flex items-center justify-between px-1 mb-3">
          <span className="text-xs text-txt-secondary">
            {weekBookingCount} booking{weekBookingCount !== 1 ? "s" : ""} this week
          </span>
          <span className="text-xs text-txt-secondary">
            Total: <span className="text-earnings font-semibold">${weekTotal.toLocaleString()}</span>
          </span>
        </div>
      )}

      {/* Calendar views */}
      {view !== "list" && (
        <div className="relative">
          <CalendarView
            bookings={filteredBookings}
            view={view as "day" | "week"}
            currentDate={currentDate}
            onBookingClick={(id) => router.push(`/dashboard/bookings/${id}`)}
          />
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="space-y-2">
          {listBookings.length === 0 ? (
            <div className="bg-surface border border-dark-border rounded-xl text-center py-10">
              <p className="text-sm text-txt-secondary/50">No bookings</p>
            </div>
          ) : (
            listBookings.map((booking) => {
              const t = new Date(booking.appointmentStart);
              const badge = STATUS_BADGE[booking.status] || STATUS_BADGE.CONFIRMED;
              return (
                <div
                  key={booking.id}
                  className={`bg-surface border rounded-xl transition-all ${
                    selected.has(booking.id) ? "border-brand-500/50" : "border-dark-border hover:border-white/[0.1]"
                  }`}
                >
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => selecting && selected.size > 0 ? toggleSelect(booking.id) : router.push(`/dashboard/bookings/${booking.id}`)}
                  >
                    {/* Checkbox — only when selecting */}
                    {selecting && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelect(booking.id); }}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150 flex-shrink-0 ${
                          selected.has(booking.id) ? "bg-brand-500 border-brand-500" : "border-white/15 hover:border-white/30"
                        }`}
                      >
                        {selected.has(booking.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                    )}

                    {/* Date/time */}
                    <div className="w-16 text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-txt-primary">
                        {t.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                      <p className="text-[10px] text-txt-secondary tabular-nums">
                        {t.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                      </p>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-txt-primary truncate">
                          {booking.customerName || booking.customerPhone}
                        </p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badge.style}`}>
                          {badge.label}
                        </span>
                      </div>
                      {booking.jobDescription && (
                        <p className="text-xs text-txt-secondary truncate mt-0.5">{booking.jobDescription}</p>
                      )}
                    </div>

                    {/* Amount */}
                    <p className="text-sm font-bold text-txt-primary shrink-0 tabular-nums">
                      ${booking.quoteAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface border border-dark-border rounded-xl shadow-xl px-4 py-3 flex items-center gap-2 animate-slide-up">
          <span className="text-xs font-semibold text-txt-primary mr-1">{selected.size}</span>
          <button
            onClick={() => bulkAction("CONFIRMED")}
            disabled={bulkLoading}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 disabled:opacity-50 transition-all"
          >
            Confirm
          </button>
          <button
            onClick={() => bulkAction("COMPLETED")}
            disabled={bulkLoading}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50 transition-all"
          >
            Complete
          </button>
          <div className="w-px h-5 bg-dark-border mx-1" />
          <button
            onClick={() => bulkAction("DELETE")}
            disabled={bulkLoading}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-all"
          >
            Delete
          </button>
          <button
            onClick={() => { setSelected(new Set()); setSelecting(false); }}
            className="text-xs text-txt-secondary hover:text-txt-primary px-2 py-1.5 transition-colors ml-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
