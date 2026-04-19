"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Quote = {
  id: string;
  customerName: string | null;
  customerPhone: string;
  jobDescription: string | null;
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
  createdAt: string;
};

type StatusFilter = "PENDING" | "WON" | "LOST" | "ALL";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function isExpired(quote: Quote): boolean {
  return !!quote.expiresAt && new Date(quote.expiresAt).getTime() <= Date.now();
}

const borderColors = { PENDING: "border-l-brand-500", WON: "border-l-emerald-500", LOST: "border-l-txt-secondary" };
const badgeStyles = {
  PENDING: "bg-amber-500/15 text-amber-400",
  WON: "bg-emerald-500/15 text-emerald-400",
  LOST: "bg-white/5 text-txt-secondary",
};

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("PENDING");

  useEffect(() => {
    fetch("/api/quotes")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(async (data: Quote[]) => {
        // Auto-close expired quotes
        for (const q of data) {
          if (q.status === "PENDING" && isExpired(q)) {
            try {
              await fetch(`/api/quotes/${q.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "LOST" }),
              });
              q.status = "LOST";
            } catch { /* ignore */ }
          }
        }
        setQuotes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const counts = {
    PENDING: quotes.filter((q) => q.status === "PENDING").length,
    WON: quotes.filter((q) => q.status === "WON").length,
    LOST: quotes.filter((q) => q.status === "LOST").length,
    ALL: quotes.length,
  };
  const filtered = filter === "ALL" ? quotes : quotes.filter((q) => q.status === filter);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "PENDING", label: "Pending" },
    { key: "WON", label: "Won" },
    { key: "LOST", label: "Lost" },
    { key: "ALL", label: "All" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-txt-primary">Quotes</h1>
        <Link
          href="/dashboard/new-quote"
          className="text-sm font-medium text-brand-500 hover:text-brand-400 transition-colors"
        >
          Create quote
        </Link>
      </div>

      {/* Filter tabs — inline text links */}
      <div className="flex items-center gap-4 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`text-sm font-medium transition-all duration-200 ${
              filter === tab.key
                ? "text-txt-primary"
                : "text-txt-secondary hover:text-txt-primary"
            }`}
          >
            {tab.label}
            <span className={`ml-1 text-xs ${
              filter === tab.key ? "text-txt-secondary" : "text-txt-secondary/40"
            }`}>
              {counts[tab.key]}
            </span>
            {filter === tab.key && (
              <div className="h-0.5 bg-brand-500 rounded-full mt-1" />
            )}
          </button>
        ))}
      </div>

      {/* Quote list */}
      {quotes.length === 0 ? (
        <div className="bg-surface border border-dark-border rounded-2xl text-center py-16 px-6">
          <p className="text-txt-primary font-bold text-lg">No quotes yet</p>
          <p className="text-txt-secondary mt-2 text-sm max-w-xs mx-auto">
            Add your first quote and QuoteLoop will handle the follow-ups.
          </p>
          <Link
            href="/dashboard/new-quote"
            className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg text-sm font-semibold mt-6 inline-flex items-center gap-2 transition-all hover:shadow-glow min-h-[44px]"
          >
            Add Your First Quote
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-dark-border rounded-xl text-center py-10">
          <p className="text-sm text-txt-secondary/50">No {filter.toLowerCase()} quotes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((quote) => (
            <button
              key={quote.id}
              onClick={() => router.push(`/dashboard/quotes/${quote.id}`)}
              className={`w-full text-left bg-surface border border-dark-border rounded-xl border-l-[3px] ${borderColors[quote.status]} hover:border-white/[0.1] transition-all p-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-txt-primary truncate">
                      {quote.customerName || quote.customerPhone}
                    </h2>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badgeStyles[quote.status]}`}>
                      {quote.status === "PENDING" ? "Pending" : quote.status === "WON" ? "Won" : "Lost"}
                    </span>
                  </div>
                  <p className="text-[11px] text-txt-secondary/50 mt-1">
                    {new Date(quote.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {quote.jobDescription && (
                      <span> · {quote.jobDescription.length > 40 ? quote.jobDescription.slice(0, 40) + "…" : quote.jobDescription}</span>
                    )}
                  </p>
                </div>
                <p className="text-sm font-extrabold text-brand-500 shrink-0 tabular-nums">
                  {formatCurrency(quote.quoteAmount)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
