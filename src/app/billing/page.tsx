"use client";

import { useEffect, useState } from "react";

type BillingInfo = {
  subscriptionStatus: string;
  quotesUsedThisMonth: number;
  quotesResetAt: string | null;
};

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-success-green mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetch("/api/stripe/billing-info")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setBilling(data);
        setLoading(false);
      })
      .catch(() => {
        setError("We're having trouble connecting. Please refresh.");
        setLoading(false);
      });
  }, []);

  async function handleUpgrade() {
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch("/api/stripe/create-checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setActionError("Something went wrong with billing. Please try again or contact support.");
        setActionLoading(false);
      }
    } catch {
      setActionError("Something went wrong with billing. Please try again or contact support.");
      setActionLoading(false);
    }
  }

  async function handleManageBilling() {
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setActionError("Something went wrong with billing. Please try again or contact support.");
        setActionLoading(false);
      }
    } catch {
      setActionError("Something went wrong with billing. Please try again or contact support.");
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-txt-secondary mt-4 text-sm">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!billing) return null;

  const isFree = billing.subscriptionStatus === "FREE";
  const isPlus = billing.subscriptionStatus === "PLUS";
  const isCancelled =
    billing.subscriptionStatus === "CANCELLED" ||
    billing.subscriptionStatus === "PAST_DUE";

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-txt-primary mb-6">Billing</h1>

      {actionError && (
        <div className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-3 rounded-lg text-sm mb-6">
          {actionError}
        </div>
      )}

      {/* Usage bar for free users */}
      {isFree && (
        <div className="bg-surface border border-dark-border rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-txt-secondary">
              {billing.quotesUsedThisMonth} of 9 free quotes used this month
            </p>
          </div>
          <div className="w-full bg-dark-border rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                billing.quotesUsedThisMonth >= 9
                  ? "bg-red-500"
                  : billing.quotesUsedThisMonth >= 8
                  ? "bg-amber-500"
                  : "bg-brand-500"
              }`}
              style={{ width: `${Math.min((billing.quotesUsedThisMonth / 9) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Free Plan Card */}
        <div className={`bg-surface border rounded-[20px] p-7 transition-all duration-200 ${
          isFree ? "border-brand-500 shadow-glow-lg" : "border-dark-border"
        }`}>
          {isFree && (
            <span className="inline-block text-xs font-bold bg-brand-500 text-white px-3 py-1 rounded-full mb-4">
              Current Plan
            </span>
          )}
          <h2 className="text-lg font-bold text-txt-primary">Free</h2>
          <p className="mt-3">
            <span className="text-3xl font-extrabold text-txt-primary">$0</span>
            <span className="text-txt-secondary ml-2">/ month</span>
          </p>
          <p className="text-sm text-txt-secondary mt-1">Forever free</p>

          <ul className="mt-6 space-y-3">
            {["9 quotes per month", "Automatic SMS follow-ups", "Quote dashboard"].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-txt-primary">
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>

          {isFree && (
            <p className="mt-6 text-sm text-txt-secondary">
              {billing.quotesUsedThisMonth} of 9 quotes used this month
            </p>
          )}
        </div>

        {/* Plus Plan Card */}
        <div
          className={`rounded-[20px] p-7 border transition-all duration-200 ${
            isPlus
              ? "border-brand-500 shadow-glow-lg"
              : "border-dark-border"
          }`}
          style={{
            background: "linear-gradient(135deg, #1E3A5F, #0D1B2A)",
          }}
        >
          {isPlus && (
            <span className="inline-block text-xs font-bold bg-brand-500 text-white px-3 py-1 rounded-full mb-4">
              Current Plan
            </span>
          )}
          <h2 className="text-lg font-bold text-txt-primary">Plus</h2>
          <p className="mt-3">
            <span className="text-3xl font-extrabold text-txt-primary">$36</span>
            <span className="text-txt-secondary ml-2">/ month</span>
          </p>
          <p className="text-sm text-txt-secondary mt-1">For busy contractors</p>

          <ul className="mt-6 space-y-3">
            {["Unlimited quotes", "Automatic SMS follow-ups", "Priority support"].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-txt-primary">
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>

          {(isFree || isCancelled) && (
            <button
              onClick={handleUpgrade}
              disabled={actionLoading}
              className="btn-shimmer w-full mt-7 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-3.5 rounded-btn transition-all duration-200 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center"
            >
              {actionLoading ? "Loading..." : "Upgrade to Plus"}
            </button>
          )}

          {isPlus && (
            <button
              onClick={handleManageBilling}
              disabled={actionLoading}
              className="w-full mt-7 border border-dark-border text-txt-primary text-sm font-semibold py-3.5 rounded-btn transition-all duration-200 hover:border-brand-500 hover:text-brand-400 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center"
            >
              {actionLoading ? "Loading..." : "Manage Billing"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
