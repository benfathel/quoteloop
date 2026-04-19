"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Quote = {
  id: string;
  status: "PENDING" | "WON" | "LOST";
};

type BookingSummary = {
  id: string;
  customerName: string | null;
  customerPhone: string;
  jobDescription: string | null;
  appointmentStart: string;
  status: string;
  quoteAmount: number;
};

type PlanInfo = {
  subscriptionStatus: string;
  quotesUsedThisMonth: number;
  autoFollowUpsUsedThisMonth: number;
};

function getWeekDays(): { label: string; dateStr: string; date: Date }[] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      dateStr: d.toDateString(),
      date: d,
    };
  });
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const subscribed = searchParams.get("subscribed");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [allBookings, setAllBookings] = useState<BookingSummary[]>([]);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [todayBookings, setTodayBookings] = useState<BookingSummary[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/quotes").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/stripe/billing-info").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/bookings").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([quotesData, planData, bookingsData]) => {
        setQuotes(quotesData);
        setPlanInfo(planData);
        setAllBookings(bookingsData);

        const now = new Date();
        const todayStr = now.toDateString();
        const active = (bookingsData as BookingSummary[]).filter((b) =>
          ["CONFIRMED", "PENDING_CONFIRMATION"].includes(b.status)
        );

        setTodayBookings(
          active
            .filter(
              (b) =>
                new Date(b.appointmentStart).toDateString() === todayStr
            )
            .sort(
              (a, b) =>
                new Date(a.appointmentStart).getTime() -
                new Date(b.appointmentStart).getTime()
            )
        );

        const weekFromNow = new Date(now);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        setUpcomingBookings(
          active
            .filter((b) => {
              const d = new Date(b.appointmentStart);
              return (
                d.toDateString() !== todayStr && d > now && d < weekFromNow
              );
            })
            .sort(
              (a, b) =>
                new Date(a.appointmentStart).getTime() -
                new Date(b.appointmentStart).getTime()
            )
            .slice(0, 5)
        );

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Earnings calculations
  const now = new Date();
  const completed = allBookings.filter((b) => b.status === "COMPLETED");

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const weekEarnings = completed
    .filter((b) => {
      const d = new Date(b.appointmentStart);
      return d >= weekStart && d < weekEnd;
    })
    .reduce((sum, b) => sum + (b.quoteAmount || 0), 0);

  const monthEarnings = completed
    .filter((b) => {
      const d = new Date(b.appointmentStart);
      return d >= monthStart && d < monthEnd;
    })
    .reduce((sum, b) => sum + (b.quoteAmount || 0), 0);

  const upcomingRevenue = allBookings
    .filter(
      (b) =>
        ["CONFIRMED", "PENDING_CONFIRMATION"].includes(b.status) &&
        new Date(b.appointmentStart) > now
    )
    .reduce((sum, b) => sum + (b.quoteAmount || 0), 0);

  // Bar chart data — daily earnings for current week
  const weekDays = getWeekDays();
  const dailyEarnings = weekDays.map((day) => {
    const total = completed
      .filter(
        (b) => new Date(b.appointmentStart).toDateString() === day.dateStr
      )
      .reduce((sum, b) => sum + (b.quoteAmount || 0), 0);
    return { ...day, total };
  });
  const maxDayEarning = Math.max(...dailyEarnings.map((d) => d.total), 1);

  // Pending actions
  const pendingQuotes = quotes.filter((q) => q.status === "PENDING").length;
  const pendingBookings = allBookings.filter(
    (b) => b.status === "PENDING_CONFIRMATION"
  ).length;
  const isFree = planInfo?.subscriptionStatus === "FREE";

  // Today's total
  const todayTotal = todayBookings.reduce(
    (sum, b) => sum + (b.quoteAmount || 0),
    0
  );

  return (
    <div className="max-w-lg mx-auto">
      {subscribed && (
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-3 rounded-xl text-sm mb-6">
          Welcome to QuoteLoop Plus!
        </div>
      )}

      {/* Earnings summary row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-txt-secondary mb-0.5">
              This week
            </p>
            <p className="text-2xl font-extrabold text-earnings tabular-nums">
              ${weekEarnings.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="hidden sm:block w-px h-10 bg-dark-border" />
        <div>
          <p className="text-[10px] uppercase tracking-wider text-txt-secondary mb-0.5">
            This month
          </p>
          <p className="text-2xl font-extrabold text-txt-primary tabular-nums">
            ${monthEarnings.toLocaleString()}
          </p>
        </div>
        <div className="hidden sm:block w-px h-10 bg-dark-border" />
        <div>
          <p className="text-[10px] uppercase tracking-wider text-txt-secondary mb-0.5">
            Upcoming
          </p>
          <p className="text-2xl font-extrabold text-brand-400 tabular-nums">
            ${upcomingRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Weekly earnings bar chart */}
      <div className="bg-surface border border-dark-border rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-txt-secondary mb-3">
          Weekly earnings
        </p>
        <div className="flex items-end gap-2 h-[100px]">
          {dailyEarnings.map((day) => {
            const isToday = day.dateStr === now.toDateString();
            const heightPct =
              day.total > 0 ? (day.total / maxDayEarning) * 100 : 0;
            return (
              <div
                key={day.dateStr}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="w-full relative flex items-end justify-center h-[72px]">
                  {day.total > 0 && (
                    <span className="absolute -top-5 text-[9px] text-txt-secondary tabular-nums">
                      ${day.total.toLocaleString()}
                    </span>
                  )}
                  <div
                    className={`w-full max-w-[32px] bar-chart-bar ${
                      isToday
                        ? "bg-earnings"
                        : day.total > 0
                          ? "bg-brand-500/60"
                          : "bg-white/[0.04]"
                    }`}
                    style={{
                      height: `${heightPct > 0 ? Math.max(heightPct, 4) : 4}%`,
                    }}
                  />
                </div>
                <span
                  className={`text-[10px] ${
                    isToday
                      ? "text-txt-primary font-semibold"
                      : "text-txt-secondary"
                  }`}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending actions */}
      {(pendingBookings > 0 || pendingQuotes > 0) && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-4 text-sm">
          <svg
            className="w-4 h-4 text-amber-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <div className="flex items-center gap-3 flex-1">
            {pendingBookings > 0 && (
              <Link
                href="/dashboard/bookings"
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                {pendingBookings} booking{pendingBookings !== 1 ? "s" : ""} to
                confirm
              </Link>
            )}
            {pendingBookings > 0 && pendingQuotes > 0 && (
              <span className="text-txt-secondary">·</span>
            )}
            {pendingQuotes > 0 && (
              <Link
                href="/dashboard/quotes"
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                {pendingQuotes} pending quote
                {pendingQuotes !== 1 ? "s" : ""}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Today's schedule */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-txt-primary">Today</h2>
          <Link
            href="/dashboard/bookings"
            className="text-xs text-brand-500 hover:text-brand-400 font-medium transition-colors"
          >
            Full schedule
          </Link>
        </div>

        {todayBookings.length === 0 ? (
          <div className="bg-surface border border-dark-border rounded-xl py-8 text-center">
            <p className="text-sm text-txt-secondary/50">No bookings today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayBookings.map((b) => {
              const t = new Date(b.appointmentStart);
              return (
                <Link
                  key={b.id}
                  href={`/dashboard/bookings/${b.id}`}
                  className="flex items-center gap-3 bg-surface border border-dark-border rounded-xl px-4 py-4 hover:border-white/[0.1] transition-all group"
                >
                  <div className="text-right w-14 flex-shrink-0">
                    <p className="text-sm font-semibold text-txt-primary tabular-nums">
                      {t.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                  </div>
                  <div
                    className={`w-1 h-8 rounded-full flex-shrink-0 ${
                      b.status === "CONFIRMED" ? "bg-blue-500" : "bg-amber-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-txt-primary truncate">
                      {b.customerName || b.customerPhone}
                    </p>
                    {b.jobDescription && (
                      <p className="text-xs text-txt-secondary truncate">
                        {b.jobDescription}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-txt-secondary group-hover:text-txt-primary transition-colors tabular-nums">
                    ${b.quoteAmount.toLocaleString()}
                  </span>
                </Link>
              );
            })}
            {todayTotal > 0 && (
              <div className="flex justify-end px-4 pt-1">
                <span className="text-xs text-txt-secondary">
                  Today&apos;s total:{" "}
                  <span className="text-earnings font-semibold">
                    ${todayTotal.toLocaleString()}
                  </span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upcoming this week */}
      {upcomingBookings.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-txt-primary mb-3">
            This week
          </h2>
          <div className="space-y-2">
            {upcomingBookings.map((b) => {
              const t = new Date(b.appointmentStart);
              return (
                <Link
                  key={b.id}
                  href={`/dashboard/bookings/${b.id}`}
                  className="flex items-center gap-3 bg-surface border border-dark-border rounded-xl px-4 py-4 hover:border-white/[0.1] transition-all group"
                >
                  <div className="text-right w-14 flex-shrink-0">
                    <p className="text-xs font-semibold text-txt-primary">
                      {t.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className="text-[10px] text-txt-secondary tabular-nums">
                      {t.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                  </div>
                  <div
                    className={`w-1 h-8 rounded-full flex-shrink-0 ${
                      b.status === "CONFIRMED" ? "bg-blue-500" : "bg-amber-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-txt-primary truncate">
                      {b.customerName || b.customerPhone}
                    </p>
                    {b.jobDescription && (
                      <p className="text-xs text-txt-secondary truncate">
                        {b.jobDescription}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-txt-secondary group-hover:text-txt-primary transition-colors tabular-nums">
                    ${b.quoteAmount.toLocaleString()}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-3 mb-6">
        <Link
          href="/dashboard/bookings/new"
          className="flex items-center justify-center gap-2 flex-1 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-3.5 rounded-xl transition-all duration-200 hover:shadow-glow"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          New Booking
        </Link>
        <Link
          href="/dashboard/new-quote"
          className="flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-txt-secondary hover:text-txt-primary text-sm font-medium py-3.5 px-5 rounded-xl transition-all duration-200"
        >
          New Quote
        </Link>
      </div>

      {/* Free plan usage — at the bottom, less prominent */}
      {isFree && planInfo && (
        <div className="bg-surface border border-dark-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold text-txt-secondary">
              Free Plan
            </p>
            <Link
              href="/billing"
              className="text-xs font-semibold text-brand-500 hover:text-brand-400 transition-colors"
            >
              Upgrade
            </Link>
          </div>
          <div className="flex gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-txt-secondary">
                  {planInfo.quotesUsedThisMonth}/9 quotes
                </span>
              </div>
              <div className="w-full bg-dark-border rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all duration-500 ${
                    planInfo.quotesUsedThisMonth >= 9
                      ? "bg-red-500"
                      : planInfo.quotesUsedThisMonth >= 8
                        ? "bg-amber-500"
                        : "bg-brand-500"
                  }`}
                  style={{
                    width: `${Math.min((planInfo.quotesUsedThisMonth / 9) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-txt-secondary">
                  {planInfo.autoFollowUpsUsedThisMonth}/3 follow-ups
                </span>
              </div>
              <div className="w-full bg-dark-border rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all duration-500 ${
                    planInfo.autoFollowUpsUsedThisMonth >= 3
                      ? "bg-red-500"
                      : "bg-brand-500"
                  }`}
                  style={{
                    width: `${Math.min((planInfo.autoFollowUpsUsedThisMonth / 3) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      <Link
        href="/dashboard/bookings/new"
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-600 shadow-glow flex items-center justify-center transition-all duration-200 active:scale-95"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
