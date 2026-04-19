"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SlotPicker from "@/components/SlotPicker";
import LocationInput from "@/components/LocationInput";
import PhoneInput from "@/components/PhoneInput";

interface QuoteData {
  businessName: string;
  contractorName: string;
  contractorId: string;
  customerPhone: string;
  customerName: string | null;
  jobDescription: string | null;
  quoteAmount: number;
  durationMinutes: number;
}

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  startDateTime: string;
  endDateTime: string;
}

interface LocationData {
  type: "gps" | "manual";
  address?: string;
  lat?: number;
  lng?: number;
  mapUrl?: string;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (hours === Math.floor(hours)) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours.toFixed(1)} hours`;
}

export default function CustomerFormPage() {
  const params = useParams();
  const token = params.token as string;

  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingStatus, setBookingStatus] = useState("");
  const [unavailable, setUnavailable] = useState("");

  // Form fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch(`/api/form/${token}`)
      .then(async (r) => {
        if (r.status === 410) { setExpired(true); setLoading(false); return; }
        if (r.status === 400) { setSubmitted(true); setLoading(false); return; }
        if (r.status === 403) {
          const d = await r.json();
          setUnavailable(d.error || "This form is not available.");
          setLoading(false);
          return;
        }
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setQuoteData(data);
        setCustomerName(data.customerName || "");
        setCustomerPhone(data.customerPhone || "");
        setJobDescription(data.jobDescription || "");
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load this form. The link may be invalid.");
        setLoading(false);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!customerName.trim()) { setError("Please enter your name."); return; }
    if (!customerPhone.trim()) { setError("Please enter your phone number."); return; }
    if (!jobDescription.trim()) { setError("Please describe the work needed."); return; }
    if (!selectedSlot) { setError("Please select an appointment time."); return; }
    if (!location) { setError("Please provide your location."); return; }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/form/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone,
          jobDescription: jobDescription.trim(),
          appointmentStart: selectedSlot.startDateTime,
          locationType: location.type,
          locationAddress: location.address,
          locationLat: location.lat,
          locationLng: location.lng,
          locationMapUrl: location.mapUrl,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      const result = await res.json();
      setBookingStatus(result.status);
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-txt-secondary mt-4 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // --- Expired ---
  if (expired) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center px-4">
        <div className="bg-surface border border-dark-border rounded-2xl p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-txt-primary mb-2">Link Expired</h1>
          <p className="text-sm text-txt-secondary">This link has expired. Please contact your contractor directly.</p>
        </div>
      </div>
    );
  }

  // --- Unavailable (free plan) ---
  if (unavailable) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center px-4">
        <div className="bg-surface border border-dark-border rounded-2xl p-8 max-w-md text-center">
          <h1 className="text-lg font-bold text-txt-primary mb-2">Not Available</h1>
          <p className="text-sm text-txt-secondary">{unavailable}</p>
        </div>
      </div>
    );
  }

  // --- Already submitted ---
  if (submitted) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center px-4">
        <div className="bg-surface border border-dark-border rounded-2xl p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-txt-primary mb-2">
            {bookingStatus === "CONFIRMED" ? "Booking Confirmed!" : "Request Submitted!"}
          </h1>
          <p className="text-sm text-txt-secondary">
            {bookingStatus === "CONFIRMED"
              ? "Your appointment has been confirmed. You'll receive a confirmation message shortly."
              : "Your booking request has been sent. The contractor will review and confirm your appointment."}
          </p>
        </div>
      </div>
    );
  }

  // --- Not found ---
  if (!quoteData) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center px-4">
        <div className="bg-surface border border-dark-border rounded-2xl p-8 max-w-md text-center">
          <h1 className="text-lg font-bold text-txt-primary mb-2">Form Not Found</h1>
          <p className="text-sm text-txt-secondary">{error || "This link may be invalid or expired."}</p>
        </div>
      </div>
    );
  }

  // --- Main form ---
  return (
    <div className="min-h-screen bg-page-bg py-8 px-4">
      <div className="max-w-[520px] mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-txt-primary">{quoteData.businessName}</h1>
          <p className="text-sm text-txt-secondary mt-1">Book your appointment</p>
        </div>

        {/* Quote summary card — like a bill */}
        <div className="bg-surface border border-dark-border rounded-2xl p-5 mb-4">
          <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">Quote Summary</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-extrabold text-txt-primary">${quoteData.quoteAmount.toLocaleString()}</p>
              <p className="text-xs text-txt-secondary mt-1">Estimated amount</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-txt-primary">{formatDuration(quoteData.durationMinutes)}</p>
              <p className="text-xs text-txt-secondary mt-1">Estimated duration</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-surface border border-dark-border rounded-2xl p-7 sm:p-8">
          {error && (
            <div className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-3 rounded-lg text-sm mb-5">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full name */}
            <div>
              <label htmlFor="customerName" className="block text-sm font-semibold text-txt-secondary mb-2">Your name</label>
              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                placeholder="Full name"
                className="input-dark"
              />
            </div>

            {/* Phone number — prefilled */}
            <div>
              <label className="block text-sm font-semibold text-txt-secondary mb-2">Phone number</label>
              <PhoneInput
                value={customerPhone}
                onChange={setCustomerPhone}
                disabled={submitting}
              />
              <p className="text-xs text-txt-secondary mt-1.5">Prefilled from your quote. You can update it if needed.</p>
            </div>

            {/* Job description */}
            <div>
              <label htmlFor="jobDescription" className="block text-sm font-semibold text-txt-secondary mb-2">Describe the work needed</label>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                required
                rows={3}
                placeholder="e.g. Leaking pipe under the kitchen sink, water pooling on the floor"
                className="input-dark resize-none"
              />
            </div>

            {/* Appointment time */}
            <div className="border-t border-dark-border pt-5">
              <p className="text-sm font-semibold text-txt-secondary mb-4">Choose your appointment time</p>
              <SlotPicker
                contractorId={quoteData.contractorId}
                durationMinutes={quoteData.durationMinutes}
                onSelect={setSelectedSlot}
                selectedSlot={selectedSlot}
              />
              {selectedSlot && (
                <div className="mt-3 bg-brand-500/10 border border-brand-500/30 rounded-lg px-4 py-2.5">
                  <p className="text-xs text-brand-500 font-medium">
                    Selected: {new Date(selectedSlot.startDateTime).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at{" "}
                    {new Date(selectedSlot.startDateTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                  </p>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="border-t border-dark-border pt-5">
              <p className="text-sm font-semibold text-txt-secondary mb-4">Your location</p>
              <LocationInput onLocationChange={setLocation} value={location} />
            </div>

            {/* Additional notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-txt-secondary mb-2">
                Additional notes <span className="font-normal text-txt-secondary">(optional)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Anything else we should know? e.g. gate code, parking info, pet in the house"
                className="input-dark resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedSlot || !location}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-3.5 rounded-btn transition-all duration-200 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
            >
              {submitting && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              {submitting ? "Submitting..." : "Book Appointment"}
            </button>
          </form>
        </div>

        <p className="text-xs text-txt-secondary text-center mt-4">Powered by QuoteLoop</p>
      </div>
    </div>
  );
}
