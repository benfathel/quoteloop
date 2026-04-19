"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SlotPicker from "@/components/SlotPicker";

interface BookingData {
  bookingId: string;
  customerName: string;
  businessName: string;
  contractorId: string;
  durationMinutes: number;
  currentAppointment: string;
  jobDescription: string;
  quoteAmount: number;
}

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  startDateTime: string;
  endDateTime: string;
}

export default function ReschedulePage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [unavailable, setUnavailable] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [resultStatus, setResultStatus] = useState("");

  useEffect(() => {
    fetch(`/api/reschedule/${token}`)
      .then(async (r) => {
        if (r.status === 410) { setExpired(true); setLoading(false); return; }
        if (r.status === 400) { const d = await r.json(); setUnavailable(d.error); setLoading(false); return; }
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => { if (d) setData(d); setLoading(false); })
      .catch(() => { setError("Unable to load. The link may be invalid."); setLoading(false); });
  }, [token]);

  async function handleSubmit() {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/reschedule/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentStart: selectedSlot.startDateTime }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }
      const result = await res.json();
      setResultStatus(result.status);
      setDone(true);
    } catch {
      setError("Something went wrong.");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="inline-block w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (expired || unavailable) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center px-4">
        <div className="bg-surface border border-dark-border rounded-2xl p-8 max-w-md text-center">
          <h1 className="text-lg font-bold text-txt-primary mb-2">{expired ? "Link Expired" : "Rescheduling Unavailable"}</h1>
          <p className="text-sm text-txt-secondary">{expired ? "This link has expired." : unavailable}</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center px-4">
        <div className="bg-surface border border-dark-border rounded-2xl p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-txt-primary mb-2">Rescheduled!</h1>
          <p className="text-sm text-txt-secondary">
            {resultStatus === "CONFIRMED"
              ? "Your new appointment has been confirmed. You'll receive an updated confirmation."
              : "Your reschedule request has been sent. The contractor will confirm your new time."}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center px-4">
        <div className="bg-surface border border-dark-border rounded-2xl p-8 max-w-md text-center">
          <h1 className="text-lg font-bold text-txt-primary mb-2">Not Found</h1>
          <p className="text-sm text-txt-secondary">{error || "This link may be invalid."}</p>
        </div>
      </div>
    );
  }

  const currentDate = new Date(data.currentAppointment);

  return (
    <div className="min-h-screen bg-page-bg py-8 px-4">
      <div className="max-w-[520px] mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-txt-primary">{data.businessName}</h1>
          <p className="text-sm text-txt-secondary mt-1">Reschedule your appointment</p>
        </div>

        <div className="bg-surface border border-dark-border rounded-2xl p-7 sm:p-8 space-y-6">
          {/* Current appointment */}
          <div className="bg-white/5 rounded-lg px-4 py-3">
            <p className="text-xs font-medium text-txt-secondary mb-1">Current appointment</p>
            <p className="text-sm text-txt-primary">
              {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at{" "}
              {currentDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <p className="text-sm font-semibold text-txt-secondary mb-4">Choose a new time</p>
            <SlotPicker
              contractorId={data.contractorId}
              durationMinutes={data.durationMinutes}
              onSelect={setSelectedSlot}
              selectedSlot={selectedSlot}
            />
          </div>

          {selectedSlot && (
            <div className="bg-brand-500/10 border border-brand-500/30 rounded-lg px-4 py-2.5">
              <p className="text-xs text-brand-500 font-medium">
                New time: {new Date(selectedSlot.startDateTime).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at{" "}
                {new Date(selectedSlot.startDateTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
              </p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!selectedSlot || submitting}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-3.5 rounded-btn transition-all duration-200 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
          >
            {submitting && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            {submitting ? "Rescheduling..." : "Confirm Reschedule"}
          </button>
        </div>

        <p className="text-xs text-txt-secondary text-center mt-4">Powered by QuoteLoop</p>
      </div>
    </div>
  );
}
