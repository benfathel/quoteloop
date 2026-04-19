"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

interface BookingData {
  id: string;
  customerName: string;
  customerPhone: string;
  additionalPhone: string | null;
  jobDescription: string;
  quoteAmount: number;
  durationMinutes: number;
  appointmentStart: string;
  appointmentEnd: string;
  locationType: string;
  locationAddress: string | null;
  locationMapUrl: string | null;
  notes: string | null;
  status: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  declinedAt: string | null;
  isManualBooking: boolean;
  createdAt: string;
  rescheduleToken: string | null;
  cancelToken: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_CONFIRMATION: { label: "Pending", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  CONFIRMED: { label: "Confirmed", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  COMPLETED: { label: "Completed", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  CANCELLED: { label: "Cancelled", color: "bg-gray-500/10 text-gray-400 border-gray-500/30" },
  DECLINED: { label: "Declined", color: "bg-red-500/10 text-red-400 border-red-500/30" },
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/${params.id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setBooking)
      .catch(() => setLoading(false));
    setLoading(false);
  }, [params.id]);

  async function handleAction(action: "confirm" | "decline" | "complete") {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "Something went wrong.", "error");
        setActionLoading("");
        return;
      }
      const updated = await res.json();
      setBooking(updated);
      const messages = {
        confirm: "Booking confirmed! Customer has been notified.",
        decline: "Booking declined. Customer has been notified.",
        complete: "Booking marked as completed.",
      };
      toast(messages[action], "success");
    } catch {
      toast("Something went wrong.", "error");
    }
    setActionLoading("");
  }

  if (loading || !booking) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const startDate = new Date(booking.appointmentStart);
  const endDate = new Date(booking.appointmentEnd);
  const status = STATUS_LABELS[booking.status] || STATUS_LABELS.PENDING_CONFIRMATION;

  return (
    <div className="max-w-[520px] mx-auto">
      <Link href="/dashboard/bookings" className="group inline-flex items-center gap-2 text-sm text-txt-secondary hover:text-txt-primary transition-all duration-200 mb-6">
        <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to bookings
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-txt-primary">Booking Details</h1>
        <span className={`text-xs font-medium px-3 py-1 rounded-full border ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="bg-surface border border-dark-border rounded-2xl p-7 sm:p-8 space-y-6">
        {/* Customer info */}
        <div>
          <p className="text-xs font-medium text-txt-secondary mb-3">Customer</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-txt-secondary">Name</span>
              <span className="text-sm text-txt-primary font-medium">{booking.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-txt-secondary">Phone</span>
              <span className="text-sm text-txt-primary">{booking.customerPhone}</span>
            </div>
            {booking.additionalPhone && (
              <div className="flex justify-between">
                <span className="text-sm text-txt-secondary">Alt phone</span>
                <span className="text-sm text-txt-primary">{booking.additionalPhone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-dark-border" />

        {/* Appointment */}
        <div>
          <p className="text-xs font-medium text-txt-secondary mb-3">Appointment</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-txt-secondary">Date</span>
              <span className="text-sm text-txt-primary font-medium">
                {startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-txt-secondary">Time</span>
              <span className="text-sm text-txt-primary">
                {startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                {" — "}
                {endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-txt-secondary">Duration</span>
              <span className="text-sm text-txt-primary">{booking.durationMinutes} min</span>
            </div>
          </div>
        </div>

        <div className="border-t border-dark-border" />

        {/* Job */}
        <div>
          <p className="text-xs font-medium text-txt-secondary mb-3">Job</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-txt-secondary">Description</span>
              <span className="text-sm text-txt-primary text-right max-w-[250px]">{booking.jobDescription}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-txt-secondary">Amount</span>
              <span className="text-sm text-txt-primary font-semibold">${booking.quoteAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-dark-border" />

        {/* Location */}
        <div>
          <p className="text-xs font-medium text-txt-secondary mb-3">Location</p>
          {booking.locationAddress && (
            <p className="text-sm text-txt-primary">{booking.locationAddress}</p>
          )}
          {booking.locationMapUrl && (
            <a
              href={booking.locationMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-500 hover:underline mt-1 inline-block"
            >
              Open in Google Maps
            </a>
          )}
        </div>

        {booking.notes && (
          <>
            <div className="border-t border-dark-border" />
            <div>
              <p className="text-xs font-medium text-txt-secondary mb-2">Notes</p>
              <p className="text-sm text-txt-primary">{booking.notes}</p>
            </div>
          </>
        )}

        {/* Action buttons */}
        {booking.status === "PENDING_CONFIRMATION" && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleAction("confirm")}
              disabled={!!actionLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-3 rounded-btn transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading === "confirm" && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              Confirm
            </button>
            <button
              onClick={() => handleAction("decline")}
              disabled={!!actionLoading}
              className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-semibold py-3 rounded-btn transition-all duration-200 disabled:opacity-50 border border-red-500/30 flex items-center justify-center gap-2"
            >
              {actionLoading === "decline" && <span className="inline-block w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></span>}
              Decline
            </button>
          </div>
        )}

        {booking.status === "CONFIRMED" && (
          <button
            onClick={() => handleAction("complete")}
            disabled={!!actionLoading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-3 rounded-btn transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading === "complete" && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            Mark as Completed
          </button>
        )}

        {/* Delete */}
        <div className="border-t border-dark-border pt-4">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-sm text-txt-secondary hover:text-red-400 py-2 transition-colors duration-200"
            >
              Delete booking
            </button>
          ) : (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <p className="text-sm text-red-400 font-medium mb-1">Delete this booking?</p>
              <p className="text-xs text-txt-secondary mb-4">This action cannot be undone. The time slot will be released.</p>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setActionLoading("delete");
                    try {
                      const res = await fetch(`/api/bookings/${params.id}`, { method: "DELETE" });
                      if (!res.ok) {
                        const data = await res.json();
                        toast(data.error || "Failed to delete.", "error");
                        setActionLoading("");
                        return;
                      }
                      toast("Booking deleted.", "success");
                      router.push("/dashboard/bookings");
                    } catch {
                      toast("Something went wrong.", "error");
                      setActionLoading("");
                    }
                  }}
                  disabled={!!actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-btn transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === "delete" && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  Yes, delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={!!actionLoading}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-txt-primary text-sm font-semibold py-2.5 rounded-btn transition-all duration-200 border border-dark-border"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
