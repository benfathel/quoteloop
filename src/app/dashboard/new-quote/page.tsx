"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PhoneInput from "@/components/PhoneInput";

export default function NewQuotePage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+1");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [quoteAmount, setQuoteAmount] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data) => {
        if (data.jobDurationMinutes) setDurationMinutes(data.jobDurationMinutes);
        setDefaultsLoaded(true);
      })
      .catch(() => setDefaultsLoaded(true));
  }, []);

  function validatePhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) { setPhoneError("Please enter a valid phone number (at least 10 digits)."); return false; }
    setPhoneError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!customerPhone || !quoteAmount) { setError("Please fill in all fields."); return; }
    if (!validatePhone(customerPhone)) return;

    const amount = parseFloat(quoteAmount);
    if (isNaN(amount) || amount <= 0) { setError("Please enter a valid quote amount."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim() || null,
          customerPhone,
          quoteAmount: amount,
          durationMinutes,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!defaultsLoaded) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[520px] mx-auto">
      <Link href="/dashboard" className="group inline-flex items-center gap-2 text-sm text-txt-secondary hover:text-txt-primary transition-all duration-200 mb-6">
        <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to dashboard
      </Link>

      <h1 className="text-xl font-bold text-txt-primary mb-6">New Quote</h1>

      <div className="bg-surface border border-dark-border rounded-2xl p-7 sm:p-8">
        {error && (
          <div className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-3 rounded-lg text-sm mb-5">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-txt-secondary mb-2">Customer name <span className="font-normal text-txt-secondary/50">(optional)</span></label>
            <input
              type="text"
              placeholder="e.g. Sarah Johnson"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-dark"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt-secondary mb-2">Customer phone number</label>
            <PhoneInput
              value={customerPhone}
              onChange={(val) => { setCustomerPhone(val); if (phoneError) setPhoneError(""); }}
              error={phoneError}
              disabled={loading}
            />
            <p className="text-xs text-txt-secondary mt-2">We&apos;ll send follow-up messages to this number</p>
          </div>

          <div>
            <label htmlFor="quoteAmount" className="block text-sm font-semibold text-txt-secondary mb-2">Quote amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-txt-secondary text-sm font-semibold">$</span>
              <input
                id="quoteAmount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                className="input-dark pl-8"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt-secondary mb-2">Estimated job duration</label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
              className="input-dark"
            >
              <option value={30}>30 min</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
              <option value={240}>4 hours (half day)</option>
              <option value={480}>8 hours (full day)</option>
            </select>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-3.5 rounded-btn transition-all duration-200 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2">
            {loading && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            {loading ? "Saving..." : "Save Quote"}
          </button>
        </form>

        <p className="text-xs text-txt-secondary text-center mt-5">Follow-up timing and messages use your defaults from Settings</p>
      </div>
    </div>
  );
}
