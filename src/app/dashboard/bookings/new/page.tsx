"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PhoneInput from "@/components/PhoneInput";
import SlotPicker from "@/components/SlotPicker";
import LocationInput from "@/components/LocationInput";
import { useToast } from "@/components/ToastProvider";

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

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours (half day)" },
  { value: 480, label: "8 hours (full day)" },
];

export default function ManualBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [contractorId, setContractorId] = useState("");
  const [customerName, setCustomerName] = useState(searchParams.get("name") || "");
  const [customerPhone, setCustomerPhone] = useState(searchParams.get("phone") || "+1");
  const [additionalPhone, setAdditionalPhone] = useState("");
  const [jobDescription, setJobDescription] = useState(searchParams.get("job") || "");
  const [quoteAmount, setQuoteAmount] = useState(searchParams.get("amount") || "");
  const [durationMinutes, setDurationMinutes] = useState(Number(searchParams.get("duration")) || 60);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [notes, setNotes] = useState("");

  const fromQuote = !!searchParams.get("quoteId");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => {
        if (data.jobDurationMinutes) {
          if (!fromQuote) setDurationMinutes(data.jobDurationMinutes);
        }
      })
      .catch(() => {});

    // Get contractor ID from session
    fetch("/api/availability")
      .then((r) => r.json())
      .catch(() => {});

    // We need contractorId for SlotPicker. Get it from a simple endpoint.
    fetch("/api/quotes")
      .then(() => {})
      .catch(() => {});
  }, [fromQuote]);

  // Get contractorId from session via a lightweight call
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(() => {
        // We need to get the user ID - use a different approach
        // The SlotPicker needs contractorId - get it from session
      })
      .catch(() => {});
  }, []);

  // Get user session to extract contractor ID
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.id) setContractorId(data.user.id);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!customerName.trim()) { setError("Customer name is required."); return; }
    if (!customerPhone.trim()) { setError("Phone number is required."); return; }
    if (!jobDescription.trim()) { setError("Job description is required."); return; }
    if (!quoteAmount || parseFloat(quoteAmount) <= 0) { setError("Enter a valid amount."); return; }
    if (!selectedSlot) { setError("Please select an appointment time."); return; }
    if (!location) { setError("Please provide a location."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone,
          additionalPhone: additionalPhone.trim() || null,
          jobDescription: jobDescription.trim(),
          quoteAmount: parseFloat(quoteAmount),
          durationMinutes,
          appointmentStart: selectedSlot.startDateTime,
          locationType: location.type,
          locationAddress: location.address,
          locationLat: location.lat,
          locationLng: location.lng,
          locationMapUrl: location.mapUrl,
          notes: notes.trim() || null,
          quoteId: searchParams.get("quoteId") || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      toast("Booking created! Customer has been notified.", "success");
      router.push("/dashboard/bookings");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[520px] mx-auto">
      <Link href="/dashboard/bookings" className="group inline-flex items-center gap-2 text-sm text-txt-secondary hover:text-txt-primary transition-all duration-200 mb-6">
        <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to bookings
      </Link>

      <h1 className="text-xl font-bold text-txt-primary mb-6">Manual Booking</h1>

      <div className="bg-surface border border-dark-border rounded-2xl p-7 sm:p-8">
        {error && (
          <div className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-3 rounded-lg text-sm mb-5">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-txt-secondary mb-2">Customer name</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required placeholder="e.g. Sarah Johnson" className="input-dark" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt-secondary mb-2">Customer phone</label>
            <PhoneInput value={customerPhone} onChange={setCustomerPhone} disabled={loading} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt-secondary mb-2">Additional phone <span className="font-normal">(optional)</span></label>
            <input type="tel" value={additionalPhone} onChange={(e) => setAdditionalPhone(e.target.value)} placeholder="Alternative number" className="input-dark" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt-secondary mb-2">Job description</label>
            <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} required rows={3} placeholder="Describe the work" className="input-dark resize-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt-secondary mb-2">Quote amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-txt-secondary text-sm font-semibold">$</span>
              <input type="number" step="0.01" min="0" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} required placeholder="0.00" className="input-dark pl-8" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt-secondary mb-2">Job duration</label>
            <select value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))} className="input-dark !w-auto">
              {DURATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Slot picker */}
          <div className="border-t border-dark-border pt-5">
            <p className="text-sm font-semibold text-txt-secondary mb-4">Appointment time</p>
            {contractorId ? (
              <SlotPicker
                contractorId={contractorId}
                durationMinutes={durationMinutes}
                onSelect={setSelectedSlot}
                selectedSlot={selectedSlot}
              />
            ) : (
              <p className="text-xs text-txt-secondary">Loading...</p>
            )}
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
            <p className="text-sm font-semibold text-txt-secondary mb-4">Location</p>
            <LocationInput onLocationChange={setLocation} value={location} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt-secondary mb-2">Notes <span className="font-normal">(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional notes" className="input-dark resize-none" />
          </div>

          <button type="submit" disabled={loading || !selectedSlot || !location}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-3.5 rounded-btn transition-all duration-200 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2">
            {loading && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            {loading ? "Creating..." : "Create Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}
