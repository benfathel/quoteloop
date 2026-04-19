"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PhoneInput from "@/components/PhoneInput";

const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours (half day)" },
  { value: 480, label: "8 hours (full day)" },
];

const BUFFER_OPTIONS = [
  { value: 0, label: "None" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
];

const FOLLOW_UP_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 360, label: "6 hours" },
  { value: 540, label: "9 hours" },
  { value: 720, label: "12 hours" },
  { value: 1440, label: "24 hours" },
  { value: 2880, label: "2 days" },
  { value: 4320, label: "3 days" },
  { value: 10080, label: "7 days" },
];

interface ScheduleDay {
  dayOfWeek: number;
  isWorking: boolean;
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
  hasMorning: boolean;
  hasEvening: boolean;
  hasSplit: boolean; // UI-only: whether the user has split into morning/evening
}

interface BlockedDateItem {
  id: string;
  date: string;
  reason: string | null;
}

interface NewBlockedDate {
  key: number;
  date: string;
  reason: string;
}

function generateTimeOptions() {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      options.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return options;
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

const TIME_OPTIONS = generateTimeOptions();

export default function SettingsPage() {
  // Profile
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("+1");
  const [phoneError, setPhoneError] = useState("");

  // Follow-up timing
  const [fu2Minutes, setFu2Minutes] = useState(180);
  const [fu3Minutes, setFu3Minutes] = useState(540);
  const [fu4Minutes, setFu4Minutes] = useState(1440);

  // Availability
  const [schedules, setSchedules] = useState<ScheduleDay[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      isWorking: i >= 1 && i <= 5,
      hasMorning: true,
      hasEvening: true,
      hasSplit: false,
      morningStart: "08:00",
      morningEnd: "12:00",
      eveningStart: "13:00",
      eveningEnd: "17:00",
    }))
  );
  const [jobDuration, setJobDuration] = useState(60);
  const [bufferTime, setBufferTime] = useState(0);
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [blockedDates, setBlockedDates] = useState<BlockedDateItem[]>([]);
  const [newBlockedDates, setNewBlockedDates] = useState<NewBlockedDate[]>([]);
  const [blockingDates, setBlockingDates] = useState(false);
  const nextKeyRef = useRef(0);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<string>("profile");

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch("/api/availability").then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch("/api/availability/blocked-dates").then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
    ])
      .then(([settings, availability, blocked]) => {
        setName(settings.name || "");
        setBusinessName(settings.businessName || "");
        setPhone(settings.phone || "+1");
        setFu2Minutes(settings.defaultFollowUp2Minutes ?? 180);
        setFu3Minutes(settings.defaultFollowUp3Minutes ?? 540);
        setFu4Minutes(settings.defaultFollowUp4Minutes ?? 1440);

        setJobDuration(availability.jobDurationMinutes);
        setBufferTime(availability.bufferMinutes);
        setAutoConfirm(availability.autoConfirmBookings);

        if (availability.schedules && availability.schedules.length > 0) {
          interface ScheduleRecord {
            dayOfWeek: number;
            isWorking: boolean;
            morningStart: string | null;
            morningEnd: string | null;
            eveningStart: string | null;
            eveningEnd: string | null;
          }
          const merged = Array.from({ length: 7 }, (_, i) => {
            const existing = availability.schedules.find((s: ScheduleRecord) => s.dayOfWeek === i);
            if (existing) {
              const hasMorning = existing.morningStart ? true : (!existing.eveningStart && existing.isWorking);
              const hasEvening = existing.eveningStart ? true : (!existing.morningStart && existing.isWorking);
              // Detect if both shifts exist (split mode)
              const hasSplit = hasMorning && hasEvening && existing.isWorking;
              return {
                dayOfWeek: i,
                isWorking: existing.isWorking,
                hasMorning,
                hasEvening,
                hasSplit,
                morningStart: existing.morningStart || "08:00",
                morningEnd: existing.morningEnd || "12:00",
                eveningStart: existing.eveningStart || "13:00",
                eveningEnd: existing.eveningEnd || "17:00",
              };
            }
            return {
              dayOfWeek: i,
              isWorking: false,
              hasMorning: true,
              hasEvening: true,
              hasSplit: false,
              morningStart: "08:00",
              morningEnd: "12:00",
              eveningStart: "13:00",
              eveningEnd: "17:00",
            };
          });
          setSchedules(merged);
        }

        setBlockedDates(blocked);
        setLoading(false);
      })
      .catch(() => {
        setError("We're having trouble connecting. Please refresh.");
        setLoading(false);
      });
  }, []);

  function validatePhone(p: string): boolean {
    const digits = p.replace(/\D/g, "");
    if (digits.length < 10) { setPhoneError("Please enter a valid phone number (at least 10 digits)."); return false; }
    setPhoneError("");
    return true;
  }

  function updateSchedule(dayOfWeek: number, field: string, value: string | boolean) {
    setSchedules((prev) =>
      prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s))
    );
  }

  function toggleSplit(dayOfWeek: number) {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.dayOfWeek !== dayOfWeek) return s;
        if (s.hasSplit) {
          // Merge back to single range: use morningStart to eveningEnd
          return { ...s, hasSplit: false, hasMorning: true, hasEvening: false };
        } else {
          // Split into two
          return { ...s, hasSplit: true, hasMorning: true, hasEvening: true };
        }
      })
    );
  }

  function addBlockedDateRow() {
    const key = nextKeyRef.current++;
    setNewBlockedDates((prev) => [...prev, { key, date: "", reason: "" }]);
  }

  function updateNewBlockedDate(key: number, field: "date" | "reason", value: string) {
    setNewBlockedDates((prev) =>
      prev.map((d) => (d.key === key ? { ...d, [field]: value } : d))
    );
  }

  function removeNewBlockedDate(key: number) {
    setNewBlockedDates((prev) => prev.filter((d) => d.key !== key));
  }

  async function handleSaveBlockedDates() {
    const toSave = newBlockedDates.filter((d) => d.date);
    if (toSave.length === 0) return;
    setBlockingDates(true);
    try {
      for (const d of toSave) {
        const res = await fetch("/api/availability/blocked-dates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: d.date, reason: d.reason.trim() || null }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to block date.");
          setBlockingDates(false);
          return;
        }
        const bd = await res.json();
        setBlockedDates((prev) => [...prev, bd].sort((a, b) => a.date.localeCompare(b.date)));
      }
      setNewBlockedDates([]);
    } catch {
      setError("Failed to block dates.");
    }
    setBlockingDates(false);
  }

  async function handleUnblockDate(id: string) {
    try {
      const res = await fetch(`/api/availability/blocked-dates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBlockedDates((prev) => prev.filter((d) => d.id !== id));
      }
    } catch {
      setError("Failed to unblock date.");
    }
  }

  async function handleSave() {
    if (!name.trim()) { setError("Name is required."); return; }
    if (!businessName.trim()) { setError("Business name is required."); return; }
    if (!validatePhone(phone)) return;

    if (fu2Minutes >= fu3Minutes || fu3Minutes >= fu4Minutes) {
      setError("Follow-up times must be in increasing order.");
      return;
    }

    setSaving(true);
    setSuccess(false);
    setError("");

    const apiSchedules = schedules.map((s) => {
      if (!s.isWorking) {
        return { dayOfWeek: s.dayOfWeek, isWorking: false, morningStart: null, morningEnd: null, eveningStart: null, eveningEnd: null };
      }
      if (s.hasSplit) {
        return {
          dayOfWeek: s.dayOfWeek, isWorking: true,
          morningStart: s.morningStart, morningEnd: s.morningEnd,
          eveningStart: s.eveningStart, eveningEnd: s.eveningEnd,
        };
      }
      // Single range mode — use morningStart to morningEnd as the full range
      return {
        dayOfWeek: s.dayOfWeek, isWorking: true,
        morningStart: s.morningStart, morningEnd: s.morningEnd,
        eveningStart: null, eveningEnd: null,
      };
    });

    try {
      const [settingsRes, availabilityRes] = await Promise.all([
        fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            businessName: businessName.trim(),
            phone,
            defaultFollowUp2Minutes: fu2Minutes,
            defaultFollowUp3Minutes: fu3Minutes,
            defaultFollowUp4Minutes: fu4Minutes,
          }),
        }),
        fetch("/api/availability", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schedules: apiSchedules,
            jobDurationMinutes: jobDuration,
            bufferMinutes: bufferTime,
            autoConfirmBookings: autoConfirm,
          }),
        }),
      ]);

      if (!settingsRes.ok) {
        const data = await settingsRes.json();
        setError(data.error || "Something went wrong. Please try again.");
        setSaving(false);
        return;
      }
      if (!availabilityRes.ok) {
        const data = await availabilityRes.json();
        setError(data.error || "Something went wrong. Please try again.");
        setSaving(false);
        return;
      }

      if (newBlockedDates.filter((d) => d.date).length > 0) {
        await handleSaveBlockedDates();
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSaving(false);
  }

  const sections = [
    { id: "profile", label: "Profile" },
    { id: "business", label: "Business" },
  ];

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-0">
      <Link href="/dashboard" className="group inline-flex items-center gap-2 text-sm text-txt-secondary hover:text-txt-primary transition-all duration-200 mb-6">
        <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back
      </Link>

      <h1 className="text-xl font-bold text-txt-primary mb-4">Settings</h1>

      {/* Section tabs — 2 tabs */}
      <div className="flex gap-1 mb-6">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all duration-200 ${
              activeSection === s.id
                ? "bg-brand-500 text-white"
                : "text-txt-secondary hover:text-txt-primary hover:bg-white/5"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-dark-border rounded-2xl p-6 sm:p-8 space-y-8">
        {error && <div className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-3 rounded-lg text-sm">{error}</div>}
        {success && <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-3 rounded-lg text-sm">Settings saved</div>}

        {/* Profile Section */}
        {activeSection === "profile" && (
          <div>
            <p className="text-sm font-semibold text-txt-primary mb-1">Profile</p>
            <p className="text-xs text-txt-secondary mb-5">Your personal and business information</p>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-txt-secondary mb-2">Your name</label>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Smith" className="input-dark" />
              </div>
              <div>
                <label htmlFor="businessName" className="block text-xs font-medium text-txt-secondary mb-2">Business name</label>
                <input id="businessName" type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Smith Plumbing" className="input-dark" />
              </div>
              <div>
                <label className="block text-xs font-medium text-txt-secondary mb-2">Phone number</label>
                <PhoneInput value={phone} onChange={(val) => { setPhone(val); if (phoneError) setPhoneError(""); }} error={phoneError} disabled={saving} />
              </div>
            </div>
          </div>
        )}

        {/* Business Section — combines follow-ups + availability */}
        {activeSection === "business" && (
          <div className="space-y-8">
            {/* Follow-up timing */}
            <div>
              <p className="text-sm font-semibold text-txt-primary mb-1">Follow-up timing</p>
              <p className="text-xs text-txt-secondary mb-5">The first follow-up is sent immediately. Set when the rest are sent.</p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5">
                  <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
                  <span className="text-sm text-txt-primary">Immediately</span>
                  <span className="text-xs text-txt-secondary ml-auto">automatic</span>
                </div>

                {[
                  { num: 2, value: fu2Minutes, set: setFu2Minutes },
                  { num: 3, value: fu3Minutes, set: setFu3Minutes },
                  { num: 4, value: fu4Minutes, set: setFu4Minutes },
                ].map(({ num, value, set }) => (
                  <div key={num} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-dark-border text-txt-secondary text-[10px] font-bold flex items-center justify-center flex-shrink-0">{num}</span>
                    <label className="text-sm text-txt-primary flex-shrink-0">After</label>
                    <select
                      value={value}
                      onChange={(e) => set(parseInt(e.target.value, 10))}
                      className="input-dark !w-auto !py-2 !px-3 text-sm"
                    >
                      {FOLLOW_UP_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-dark-border" />

            {/* Working hours — simplified single range by default */}
            <div>
              <p className="text-sm font-semibold text-txt-primary mb-1">Working hours</p>
              <p className="text-xs text-txt-secondary mb-5">Set your hours for each day</p>

              <div className="space-y-3">
                {schedules.map((day) => (
                  <div key={day.dayOfWeek} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateSchedule(day.dayOfWeek, "isWorking", !day.isWorking)}
                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${day.isWorking ? "bg-brand-500" : "bg-dark-border"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${day.isWorking ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                      <span className={`text-sm w-10 flex-shrink-0 font-medium ${day.isWorking ? "text-txt-primary" : "text-txt-secondary"}`}>
                        {SHORT_DAY_NAMES[day.dayOfWeek]}
                      </span>

                      {day.isWorking && !day.hasSplit && (
                        <div className="flex items-center gap-2 flex-1">
                          <select
                            value={day.morningStart}
                            onChange={(e) => updateSchedule(day.dayOfWeek, "morningStart", e.target.value)}
                            className="input-dark !w-auto !py-1.5 !px-1.5 text-[11px]"
                          >
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>{formatTime12(t)}</option>
                            ))}
                          </select>
                          <span className="text-txt-secondary text-[11px]">–</span>
                          <select
                            value={day.morningEnd}
                            onChange={(e) => updateSchedule(day.dayOfWeek, "morningEnd", e.target.value)}
                            className="input-dark !w-auto !py-1.5 !px-1.5 text-[11px]"
                          >
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>{formatTime12(t)}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {!day.isWorking && <span className="text-xs text-txt-secondary">Off</span>}
                    </div>

                    {/* Split mode — morning + evening */}
                    {day.isWorking && day.hasSplit && (
                      <div className="ml-[52px] space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-txt-secondary w-14 flex-shrink-0">Morning</span>
                          <select value={day.morningStart} onChange={(e) => updateSchedule(day.dayOfWeek, "morningStart", e.target.value)} className="input-dark !w-auto !py-1.5 !px-1.5 text-[11px]">
                            {TIME_OPTIONS.map((t) => <option key={t} value={t}>{formatTime12(t)}</option>)}
                          </select>
                          <span className="text-txt-secondary text-[11px]">–</span>
                          <select value={day.morningEnd} onChange={(e) => updateSchedule(day.dayOfWeek, "morningEnd", e.target.value)} className="input-dark !w-auto !py-1.5 !px-1.5 text-[11px]">
                            {TIME_OPTIONS.map((t) => <option key={t} value={t}>{formatTime12(t)}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-txt-secondary w-14 flex-shrink-0">Afternoon</span>
                          <select value={day.eveningStart} onChange={(e) => updateSchedule(day.dayOfWeek, "eveningStart", e.target.value)} className="input-dark !w-auto !py-1.5 !px-1.5 text-[11px]">
                            {TIME_OPTIONS.map((t) => <option key={t} value={t}>{formatTime12(t)}</option>)}
                          </select>
                          <span className="text-txt-secondary text-[11px]">–</span>
                          <select value={day.eveningEnd} onChange={(e) => updateSchedule(day.dayOfWeek, "eveningEnd", e.target.value)} className="input-dark !w-auto !py-1.5 !px-1.5 text-[11px]">
                            {TIME_OPTIONS.map((t) => <option key={t} value={t}>{formatTime12(t)}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Add/remove break link */}
                    {day.isWorking && (
                      <button
                        onClick={() => toggleSplit(day.dayOfWeek)}
                        className="ml-[52px] text-[10px] text-brand-500 hover:text-brand-400 transition-colors"
                      >
                        {day.hasSplit ? "Remove break" : "Add break"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-dark-border" />

            {/* Job duration & buffer */}
            <div>
              <p className="text-sm font-semibold text-txt-primary mb-1">Appointments</p>
              <p className="text-xs text-txt-secondary mb-5">Default duration and buffer time</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-2">Job duration</label>
                  <select value={jobDuration} onChange={(e) => setJobDuration(parseInt(e.target.value, 10))} className="input-dark !w-auto">
                    {DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-2">Buffer between jobs</label>
                  <select value={bufferTime} onChange={(e) => setBufferTime(parseInt(e.target.value, 10))} className="input-dark !w-auto">
                    {BUFFER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <p className="text-xs text-txt-secondary mt-1.5">Travel time between jobs</p>
                </div>
              </div>
            </div>

            <div className="border-t border-dark-border" />

            {/* Auto-confirm */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-txt-primary">Auto-confirm bookings</p>
                <p className="text-xs text-txt-secondary mt-0.5">Bookings are confirmed instantly without your review</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoConfirm(!autoConfirm)}
                className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${autoConfirm ? "bg-brand-500" : "bg-dark-border"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${autoConfirm ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>

            <div className="border-t border-dark-border" />

            {/* Blocked dates */}
            <div>
              <p className="text-sm font-semibold text-txt-primary mb-1">Blocked dates</p>
              <p className="text-xs text-txt-secondary mb-4">Days you&apos;re unavailable</p>

              {blockedDates.length > 0 && (
                <div className="space-y-2 mb-4">
                  {blockedDates.map((bd) => {
                    const d = new Date(bd.date);
                    return (
                      <div key={bd.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                        <div>
                          <span className="text-sm text-txt-primary">
                            {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                          {bd.reason && <span className="text-xs text-txt-secondary ml-2">({bd.reason})</span>}
                        </div>
                        <button onClick={() => handleUnblockDate(bd.id)} className="text-red-400 hover:text-red-300 text-xs transition-colors">
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {newBlockedDates.length > 0 && (
                <div className="space-y-2 mb-4">
                  {newBlockedDates.map((d) => (
                    <div key={d.key} className="flex items-center gap-2">
                      <input type="date" value={d.date} onChange={(e) => updateNewBlockedDate(d.key, "date", e.target.value)}
                        min={new Date().toISOString().split("T")[0]} className="input-dark text-sm flex-1" />
                      <input type="text" value={d.reason} onChange={(e) => updateNewBlockedDate(d.key, "reason", e.target.value)}
                        placeholder="Reason (optional)" className="input-dark text-sm flex-1" />
                      <button onClick={() => removeNewBlockedDate(d.key)} className="text-red-400 hover:text-red-300 p-2 transition-colors flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button onClick={addBlockedDateRow} className="flex items-center gap-1.5 text-brand-500 hover:text-brand-400 text-xs font-medium transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add date
                </button>
                {newBlockedDates.filter((d) => d.date).length > 0 && (
                  <button onClick={handleSaveBlockedDates} disabled={blockingDates}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors ml-auto disabled:opacity-50">
                    {blockingDates ? "Saving..." : `Save ${newBlockedDates.filter((d) => d.date).length} date${newBlockedDates.filter((d) => d.date).length > 1 ? "s" : ""}`}
                  </button>
                )}
              </div>

              {blockedDates.length === 0 && newBlockedDates.length === 0 && (
                <p className="text-xs text-txt-secondary mt-2">No blocked dates</p>
              )}
            </div>
          </div>
        )}

        {/* Save button inside card for desktop */}
        <button onClick={handleSave} disabled={saving}
          className="hidden md:flex w-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-3.5 rounded-btn transition-all duration-200 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] items-center justify-center gap-2">
          {saving && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>

      {/* Sticky save button on mobile */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 z-40 px-3 pb-2 pt-2 bg-page-bg/90 backdrop-blur-sm border-t border-dark-border">
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-3 rounded-btn transition-all duration-200 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2">
          {saving && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </div>
  );
}
