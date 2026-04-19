"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-success-green mt-0.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function Pricing() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="pricing" className="bg-page-bg py-[60px] sm:py-[120px]">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold tracking-[3px] text-brand-500 uppercase mb-4">
            Pricing
          </p>
          <h2
            className="font-extrabold text-txt-primary leading-tight"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            Start free.{" "}
            <span className="text-txt-secondary">
              Upgrade when you&apos;re ready.
            </span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-[800px] mx-auto">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.02, transition: { duration: 0.2 } }}
            className="bg-surface border border-dark-border rounded-[20px] p-8 sm:p-10 flex flex-col"
          >
            <span className="inline-block text-xs font-semibold text-txt-secondary border border-dark-border rounded-full px-3 py-1 w-fit mb-6">
              Free
            </span>
            <p className="mb-1">
              <span className="text-5xl font-extrabold text-txt-primary">
                $0
              </span>
              <span className="text-txt-secondary ml-2">/month</span>
            </p>
            <p className="text-sm text-txt-secondary mb-8">
              Forever free. No card needed.
            </p>

            <div className="h-px bg-dark-border mb-8" />

            <ul className="space-y-4 flex-1">
              {[
                "9 quotes per month",
                "Booking management",
                "Earnings dashboard",
                "Mobile friendly",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-3 text-sm text-txt-primary"
                >
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="mt-8 w-full text-center text-sm font-semibold py-3.5 rounded-btn border border-dark-border text-txt-primary hover:bg-txt-primary hover:text-page-bg transition-all duration-200 block min-h-[48px] flex items-center justify-center"
            >
              Get started free
            </Link>
          </motion.div>

          {/* Plus */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { delay: 0.1, duration: 0.5 }
            }
            whileHover={shouldReduceMotion ? {} : { scale: 1.02, transition: { duration: 0.2 } }}
            className="relative border border-brand-500 rounded-[20px] p-8 sm:p-10 flex flex-col"
            style={{
              background:
                "linear-gradient(135deg, #1E3A5F, #0D1B2A)",
              boxShadow: "0 0 40px rgba(59,130,246,0.1)",
            }}
          >
            <span className="inline-block text-xs font-bold bg-brand-500 text-white rounded-full px-3 py-1 w-fit mb-6">
              Most popular
            </span>
            <p className="mb-1">
              <span className="text-5xl font-extrabold text-txt-primary">
                $36
              </span>
              <span className="text-txt-secondary ml-2">/month</span>
            </p>
            <p className="text-sm text-txt-secondary mb-8">
              Everything you need.
            </p>

            <div className="h-px bg-dark-border mb-8" />

            <ul className="space-y-4 flex-1">
              {[
                "Unlimited quotes and bookings",
                "Automatic SMS follow-ups",
                "Full scheduling + calendar",
                "Earnings tracking",
                "Customer intake forms",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-3 text-sm text-txt-primary"
                >
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="btn-shimmer mt-8 w-full text-center text-sm font-semibold py-3.5 rounded-btn bg-brand-500 hover:bg-brand-600 text-white transition-all duration-200 hover:shadow-glow block min-h-[48px] flex items-center justify-center"
            >
              Start with Plus
            </Link>
          </motion.div>
        </div>

        {/* Trust note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={
            shouldReduceMotion ? { duration: 0 } : { delay: 0.3, duration: 0.5 }
          }
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10 text-sm text-txt-secondary"
        >
          {[
            "Cancel anytime",
            "No setup fees",
            "Instant activation",
          ].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <svg
                className="w-3.5 h-3.5 text-success-green"
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
      </div>
    </section>
  );
}
