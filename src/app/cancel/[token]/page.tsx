"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface BookingData {
  bookingId: string;
  customerName: string;
  businessName: string;
  appointmentStart: string;
  jobDescription: string;
  quoteAmount: number;
}

export default function CancelPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [unavailable, setUnavailable] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/cancel/${token}`)
      .then(async (r) => {
        if (r.status === 410) { setExpired(true); setLoading(false); return; }
        if (r.status === 400) { const d = await r.json(); setUnavailable(d.error); setLoading(false); return; }
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => { if (d) setData(d); setLoading(false); })
      .catch(() => { setError("Unable to load. The link may be invalid."); setLoading(false); });
  }, [token]);

  async function handleCancel() {
    setConfirming(true);
    setError("");

    try {
      const res = await fetch(`/api/cancel/${token}`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Something went wrong.");
        setConfirming(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong.");
    }
    setConfirming(false);
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
          <h1 className="text-lg font-bold text-txt-primary mb-2">{expired ? "Link Expired" : "Cancellation Unavailable"}</h1>
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
          <h1 className="text-lg font-bold text-txt-primary mb-2">Booking Cancelled</h1>
          <p className="text-sm text-txt-secondary">Your booking has been cancelled. The contractor has been notified.</p>
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

  const appointmentDate = new Date(data.appointmentStart);

  return (
    <div className="min-h-screen bg-page-bg py-8 px-4">
      <div className="max-w-[520px] mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-txt-primary">{data.businessName}</h1>
          <p className="text-sm text-txt-secondary mt-1">Cancel your appointment</p>
        </div>

        <div className="bg-surface border border-dark-border rounded-2xl p-7 sm:p-8 space-y-6">
          {/* Appointment details */}
          <div className="bg-white/5 rounded-lg px-4 py-3 space-y-2">
            <div>
              <p className="text-xs font-medium text-txt-secondary mb-1">Appointment</p>
              <p className="text-sm text-txt-primary">
                {appointmentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at{" "}
                {appointmentDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-txt-secondary mb-1">Job</p>
              <p className="text-sm text-txt-primary">{data.jobDescription}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-txt-secondary mb-1">Quote</p>
              <p className="text-sm text-txt-primary">${data.quoteAmount.toLocaleString()}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
            <p className="text-sm text-amber-400 font-medium">Are you sure you want to cancel?</p>
            <p className="text-xs text-amber-400/70 mt-1">This action cannot be undone. The contractor will be notified.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 bg-white/5 hover:bg-white/10 text-txt-primary text-sm font-semibold py-3.5 rounded-btn transition-all duration-200 min-h-[48px]"
            >
              Go Back
            </button>
            <button
              onClick={handleCancel}
              disabled={confirming}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-3.5 rounded-btn transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
            >
              {confirming && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              {confirming ? "Cancelling..." : "Cancel Booking"}
            </button>
          </div>
        </div>

        <p className="text-xs text-txt-secondary text-center mt-4">Powered by QuoteLoop</p>
      </div>
    </div>
  );
}
