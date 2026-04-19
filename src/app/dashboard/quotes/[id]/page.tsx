"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import PhoneInput from "@/components/PhoneInput";

type QuoteData = {
  id: string;
  customerName: string;
  customerPhone: string;
  jobDescription: string;
  quoteAmount: number;
  status: "PENDING" | "WON" | "LOST";
  followUpSentAt1: string | null;
  followUpSentAt2: string | null;
  followUpSentAt3: string | null;
  followUpSentAt4: string | null;
  followUpCancelled: boolean;
  expiresAt: string | null;
  formToken: string;
  formSubmittedAt: string | null;
  durationMinutes: number;
  createdAt: string;
};

type ViewMode = "detail" | "edit";

const statusLabels = { PENDING: "Pending", WON: "Won", LOST: "Lost" };
const statusStyles = {
  PENDING: "bg-amber-500/15 text-amber-400",
  WON: "bg-emerald-500/15 text-emerald-400",
  LOST: "bg-white/5 text-txt-secondary",
};

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const quoteId = params.id as string;

  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("detail");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form state (matching new quote form: name, phone, amount, duration)
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDuration, setEditDuration] = useState(60);
  const [phoneError, setPhoneError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    fetch(`/api/quotes`)
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((quotes: QuoteData[]) => {
        const q = quotes.find((q) => q.id === quoteId);
        if (!q) { setError("Quote not found."); setLoading(false); return; }
        setQuote(q);
        setLoading(false);
      })
      .catch(() => { setError("We're having trouble connecting. Please refresh."); setLoading(false); });
  }, [quoteId]);

  function initEditForm(q: QuoteData) {
    setEditName(q.customerName || "");
    setEditPhone(q.customerPhone);
    setEditAmount(q.quoteAmount.toString());
    setEditDuration(q.durationMinutes || 60);
    setEditError("");
    setPhoneError("");
  }

  async function updateStatus(status: "WON" | "LOST" | "PENDING") {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setQuote((prev) => prev ? { ...prev, status: updated.status } : prev);
        if (status === "WON") toast("Great work!", "success");
        if (status === "LOST") toast("Noted. On to the next one.", "success");
      }
    } catch { /* ignore */ }
    setUpdatingStatus(false);
  }

  function copyFormLink() {
    if (!quote) return;
    navigator.clipboard.writeText(`${window.location.origin}/form/${quote.formToken}`);
    setCopiedLink(true);
    toast("Link copied!", "success");
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
        setDeleting(false);
        setShowDeleteConfirm(false);
        return;
      }
      toast("Quote deleted", "success");
      router.push("/dashboard/quotes");
    } catch {
      setError("Something went wrong.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleSave() {
    if (!quote) return;
    setEditError("");

    if (!editPhone || !editAmount) { setEditError("Please fill in all fields."); return; }
    const digits = editPhone.replace(/\D/g, "");
    if (digits.length < 10) { setPhoneError("Please enter a valid phone number."); return; }

    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) { setEditError("Please enter a valid quote amount."); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editName.trim() || null,
          customerPhone: editPhone,
          jobDescription: quote.jobDescription,
          quoteAmount: amount,
          durationMinutes: editDuration,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setEditError(data.error || "Something went wrong.");
        setSaving(false);
        return;
      }
      const updated = await res.json();
      setQuote((prev) => prev ? { ...prev, ...updated } : prev);
      toast("Quote updated", "success");
      setViewMode("detail");
    } catch {
      setEditError("Something went wrong.");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-sm">{error || "Quote not found."}</p>
        <Link href="/dashboard/quotes" className="text-sm text-brand-500 hover:text-brand-400 mt-4 inline-block">Back to quotes</Link>
      </div>
    );
  }

  // Follow-up status
  const followUps = [
    { label: "Immediate", sent: !!quote.followUpSentAt1 },
    { label: "3h", sent: !!quote.followUpSentAt2 },
    { label: "9h", sent: !!quote.followUpSentAt3 },
    { label: "24h", sent: !!quote.followUpSentAt4 },
  ];
  const sentCount = followUps.filter((f) => f.sent).length;

  // ===== EDIT MODE =====
  if (viewMode === "edit") {
    return (
      <div className="max-w-[520px] mx-auto">
        <button
          onClick={() => setViewMode("detail")}
          className="group inline-flex items-center gap-2 text-sm text-txt-secondary hover:text-txt-primary transition-all duration-200 mb-6"
        >
          <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to quote
        </button>

        <h1 className="text-xl font-bold text-txt-primary mb-6">Edit Quote</h1>

        <div className="bg-surface border border-dark-border rounded-2xl p-7 sm:p-8">
          {editError && <div className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-3 rounded-lg text-sm mb-5">{editError}</div>}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-txt-secondary mb-2">Customer name <span className="font-normal text-txt-secondary/50">(optional)</span></label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Sarah Johnson" className="input-dark" disabled={saving} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-txt-secondary mb-2">Customer phone number</label>
              <PhoneInput
                value={editPhone}
                onChange={(val) => { setEditPhone(val); if (phoneError) setPhoneError(""); }}
                error={phoneError}
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-txt-secondary mb-2">Quote amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-txt-secondary text-sm font-semibold">$</span>
                <input type="number" inputMode="decimal" step="0.01" min="0" value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)} placeholder="0.00" className="input-dark pl-8" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-txt-secondary mb-2">Estimated job duration</label>
              <select value={editDuration} onChange={(e) => setEditDuration(Number(e.target.value))} className="input-dark">
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours (half day)</option>
                <option value={480}>8 hours (full day)</option>
              </select>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-3.5 rounded-btn transition-all duration-200 hover:shadow-glow disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2">
              {saving && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== DETAIL MODE =====
  return (
    <div className="max-w-[520px] mx-auto">
      <Link
        href="/dashboard/quotes"
        className="group inline-flex items-center gap-2 text-sm text-txt-secondary hover:text-txt-primary transition-all duration-200 mb-6"
      >
        <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to quotes
      </Link>

      {/* Quote summary card */}
      <div className="bg-surface border border-dark-border rounded-2xl p-6">
        {/* Header: name + status */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-txt-primary">
              {quote.customerName || quote.customerPhone}
            </h1>
            {quote.customerName && (
              <p className="text-sm text-txt-secondary mt-0.5">{quote.customerPhone}</p>
            )}
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyles[quote.status]}`}>
            {statusLabels[quote.status]}
          </span>
        </div>

        {/* Details grid */}
        <div className="space-y-3 mb-5">
          {quote.jobDescription && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-txt-secondary/50 font-semibold mb-1">Job</p>
              <p className="text-sm text-txt-primary">{quote.jobDescription}</p>
            </div>
          )}

          <div className="flex gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-txt-secondary/50 font-semibold mb-1">Amount</p>
              <p className="text-lg font-bold text-brand-500 tabular-nums">
                ${quote.quoteAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-txt-secondary/50 font-semibold mb-1">Duration</p>
              <p className="text-sm text-txt-primary">
                {quote.durationMinutes >= 60
                  ? `${quote.durationMinutes / 60}h`
                  : `${quote.durationMinutes}min`}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-txt-secondary/50 font-semibold mb-1">Created</p>
              <p className="text-sm text-txt-primary">
                {new Date(quote.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>
          </div>

          {/* Follow-up status */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-txt-secondary/50 font-semibold mb-1.5">
              Follow-ups <span className="normal-case">({sentCount}/4 sent)</span>
            </p>
            <div className="flex items-center gap-2.5 flex-wrap">
              {followUps.map((fu, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${fu.sent ? "bg-emerald-400" : quote.followUpCancelled ? "bg-red-400" : "bg-white/20"}`} />
                  <span className="text-xs text-txt-secondary">{fu.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Time remaining */}
          {quote.expiresAt && quote.status === "PENDING" && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-txt-secondary/50 font-semibold mb-1">Auto-closes</p>
              {(() => {
                const ms = new Date(quote.expiresAt).getTime() - Date.now();
                if (ms <= 0) return <p className="text-sm text-red-400">Expired</p>;
                const hours = Math.floor(ms / 3600000);
                const mins = Math.floor((ms % 3600000) / 60000);
                return <p className="text-sm text-amber-400">{hours > 0 ? `${hours}h ${mins}m` : `${mins}m`} remaining</p>;
              })()}
            </div>
          )}

          {/* Form submitted */}
          {quote.formSubmittedAt && (
            <div className="bg-emerald-500/10 text-emerald-400 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Customer submitted form — booking created
            </div>
          )}
        </div>

        {/* Primary actions */}
        <div className="space-y-2.5">
          {/* Create booking — only show for pending quotes without a form submission */}
          {quote.status === "PENDING" && !quote.formSubmittedAt && (
            <Link
              href={`/dashboard/bookings/new?quoteId=${quote.id}&phone=${encodeURIComponent(quote.customerPhone)}&amount=${quote.quoteAmount}&duration=${quote.durationMinutes}`}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-3 rounded-btn transition-all duration-200 hover:shadow-glow min-h-[48px] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Create booking
            </Link>
          )}

          {/* Edit quote */}
          <button
            onClick={() => { initEditForm(quote); setViewMode("edit"); }}
            className={`w-full text-sm font-semibold py-3 rounded-btn transition-all duration-200 min-h-[48px] flex items-center justify-center gap-2 ${
              quote.status === "PENDING" && !quote.formSubmittedAt
                ? "border border-dark-border text-txt-secondary hover:text-txt-primary hover:bg-white/[0.03]"
                : "bg-brand-500 hover:bg-brand-600 text-white hover:shadow-glow"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit quote
          </button>

          {/* Copy form link */}
          {quote.status === "PENDING" && !quote.formSubmittedAt && (
            <button
              onClick={copyFormLink}
              className="w-full border border-dark-border text-txt-secondary hover:text-txt-primary hover:bg-white/[0.03] text-sm font-semibold py-3 rounded-btn transition-all duration-200 min-h-[48px] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              {copiedLink ? "Copied!" : "Copy booking form link"}
            </button>
          )}
        </div>

        {/* Status actions */}
        <div className="border-t border-dark-border mt-5 pt-4">
          <p className="text-[10px] uppercase tracking-wider text-txt-secondary/50 font-semibold mb-3">Mark as</p>
          <div className="flex gap-2">
            {quote.status !== "WON" && (
              <button
                onClick={() => updateStatus("WON")}
                disabled={updatingStatus}
                className="flex-1 text-xs font-semibold py-2.5 rounded-lg text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 disabled:opacity-50 transition-all"
              >
                Won
              </button>
            )}
            {quote.status !== "LOST" && (
              <button
                onClick={() => updateStatus("LOST")}
                disabled={updatingStatus}
                className="flex-1 text-xs font-semibold py-2.5 rounded-lg text-txt-secondary border border-dark-border hover:bg-white/5 disabled:opacity-50 transition-all"
              >
                Lost
              </button>
            )}
            {quote.status !== "PENDING" && (
              <button
                onClick={() => updateStatus("PENDING")}
                disabled={updatingStatus}
                className="flex-1 text-xs font-semibold py-2.5 rounded-lg text-amber-400 border border-amber-500/20 hover:bg-amber-500/10 disabled:opacity-50 transition-all"
              >
                Pending
              </button>
            )}
          </div>
        </div>

        {/* Delete */}
        <div className="border-t border-dark-border mt-4 pt-4">
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
              Delete quote
            </button>
          ) : (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm text-red-400 mb-3">Delete this quote? This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                  className="flex-1 text-sm font-semibold py-2.5 rounded-lg border border-dark-border text-txt-secondary hover:bg-dark-border/40 transition-all min-h-[44px]">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 text-sm font-semibold py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all min-h-[44px] flex items-center justify-center gap-2">
                  {deleting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {deleting ? "Deleting..." : "Yes, delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
