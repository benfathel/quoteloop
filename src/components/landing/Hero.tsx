"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

/* ── Animated word-by-word headline ──────── */
function AnimatedHeadline() {
  const shouldReduceMotion = useReducedMotion();
  const line1 = ["Manage", "your", "jobs."];
  const line2 = ["Grow", "your", "business."];

  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
    }),
  };

  let index = 0;

  return (
    <h1
      className="font-extrabold text-txt-primary leading-[1.1] tracking-[-2px]"
      style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
    >
      <span className="block">
        {line1.map((word) => {
          const i = index++;
          return (
            <motion.span
              key={`l1-${i}`}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={wordVariants}
              className="inline-block mr-[0.3em]"
            >
              {word}
            </motion.span>
          );
        })}
      </span>
      <span className="block">
        {line2.map((word) => {
          const i = index++;
          const isGradient = word === "Grow" || word === "business.";
          return (
            <motion.span
              key={`l2-${i}`}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={wordVariants}
              className={`inline-block mr-[0.3em] ${
                isGradient
                  ? "bg-gradient-to-r from-brand-500 to-accent-cyan bg-clip-text text-transparent"
                  : ""
              }`}
            >
              {word}
            </motion.span>
          );
        })}
      </span>
    </h1>
  );
}

/* ── Dashboard mockup ──────────────────── */
function DashboardMockup() {
  const shouldReduceMotion = useReducedMotion();

  const bookings = [
    {
      time: "9:00 AM",
      name: "Mike Johnson",
      job: "Fix kitchen sink leak",
      amount: "$350",
      status: "Confirmed",
      statusColor: "bg-blue-500/15 text-blue-400",
      borderColor: "border-l-blue-500",
    },
    {
      time: "11:30 AM",
      name: "Sarah Williams",
      job: "Rewire garage sockets",
      amount: "$890",
      status: "Completed",
      statusColor: "bg-emerald-500/15 text-emerald-400",
      borderColor: "border-l-emerald-500",
    },
    {
      time: "2:00 PM",
      name: "Tom Baker",
      job: "Boiler service + report",
      amount: "$220",
      status: "Pending",
      statusColor: "bg-amber-500/15 text-amber-400",
      borderColor: "border-l-amber-500",
    },
  ];

  return (
    <motion.div
      animate={shouldReduceMotion ? {} : { y: [-8, 8, -8] }}
      transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
      className="relative w-full max-w-md mx-auto lg:mx-0"
    >
      {/* Glow behind */}
      <div
        className="absolute inset-0 -m-10 rounded-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative bg-surface border border-dark-border rounded-2xl p-5 shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-dark-border">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-xs text-txt-secondary mx-auto pr-8">
            QuoteLoop
          </span>
        </div>

        {/* Earnings summary */}
        <div className="flex items-center gap-4 mb-4 px-1">
          <div>
            <p className="text-[10px] text-txt-secondary uppercase tracking-wider">This week</p>
            <p className="text-lg font-extrabold text-emerald-400 tabular-nums">$1,460</p>
          </div>
          <div className="w-px h-8 bg-dark-border" />
          <div>
            <p className="text-[10px] text-txt-secondary uppercase tracking-wider">Upcoming</p>
            <p className="text-lg font-extrabold text-brand-400 tabular-nums">$570</p>
          </div>
        </div>

        {/* Booking cards */}
        <div className="space-y-2.5">
          {bookings.map((b) => (
            <div
              key={b.name}
              className={`bg-page-bg border border-dark-border rounded-xl p-3.5 border-l-[3px] ${b.borderColor}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-txt-primary tabular-nums w-16 text-right shrink-0">{b.time}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-txt-primary truncate">{b.name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.statusColor} shrink-0`}>{b.status}</span>
                  </div>
                  <p className="text-xs text-txt-secondary mt-0.5">{b.job}</p>
                </div>
                <p className="text-sm font-bold text-txt-primary shrink-0">{b.amount}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Hero section ──────────────────────── */
export default function Hero() {
  const shouldReduceMotion = useReducedMotion();

  const containerAnim = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: shouldReduceMotion ? { duration: 0 } : { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: "easeOut" as const },
    },
  };

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #080C14 0%, #0D1B2A 50%, #080C14 100%)",
      }}
    >
      {/* Animated grid */}
      <div className="absolute inset-0 bg-grid-animated opacity-40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-5 sm:px-8 pt-28 pb-16 lg:pt-32 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text */}
          <motion.div
            variants={containerAnim}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div variants={itemAnim}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-success-green/40 bg-success-green/10 mb-8">
                <span className="w-2 h-2 rounded-full bg-success-green animate-pulse-dot" />
                <span className="text-sm font-medium text-emerald-400">
                  Schedule, earn, and grow
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <AnimatedHeadline />

            {/* Subheadline */}
            <motion.p
              variants={itemAnim}
              className="mt-6 text-xl text-txt-secondary leading-relaxed max-w-lg"
            >
              The simplest way for contractors to manage bookings, track
              earnings, and follow up with customers. All in one place.
            </motion.p>

            {/* Buttons */}
            <motion.div
              variants={itemAnim}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/register"
                className="btn-shimmer bg-brand-500 hover:bg-brand-600 text-white text-base font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:shadow-glow inline-flex items-center justify-center min-h-[48px]"
              >
                Start for free
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
              <a
                href="#features"
                className="text-base font-semibold px-7 py-3.5 rounded-full border border-dark-border text-txt-secondary hover:text-txt-primary hover:border-brand-500 transition-all duration-200 inline-flex items-center justify-center min-h-[48px]"
              >
                Watch how it works
              </a>
            </motion.div>

            {/* Trust line */}
            <motion.div
              variants={itemAnim}
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-txt-secondary"
            >
              {[
                "Free plan available",
                "No credit card needed",
                "Set up in 5 minutes",
              ].map((item, i) => (
                <span key={item} className="flex items-center gap-2">
                  {i > 0 && (
                    <span className="w-1 h-1 rounded-full bg-txt-secondary hidden sm:block" />
                  )}
                  <svg
                    className="w-3.5 h-3.5 text-success-green shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {item}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.7, delay: 0.4, ease: "easeOut" }
            }
            className="lg:pl-8"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
