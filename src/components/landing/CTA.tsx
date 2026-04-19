"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export default function CTA() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="border-y border-dark-border py-[60px] sm:py-[120px]"
      style={{
        background:
          "linear-gradient(135deg, #1E3A5F 0%, #0D1117 100%)",
      }}
    >
      <div className="max-w-[700px] mx-auto px-5 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6 }}
        >
          <h2
            className="font-extrabold text-txt-primary leading-tight"
            style={{ fontSize: "clamp(28px, 5vw, 48px)" }}
          >
            Ready to organize your work?
          </h2>
          <p className="mt-5 text-lg text-txt-secondary max-w-md mx-auto leading-relaxed">
            Join hundreds of contractors who manage their schedule and earnings with QuoteLoop.
          </p>
          <div className="mt-10">
            <Link
              href="/register"
              className="btn-shimmer bg-brand-500 hover:bg-brand-600 text-white text-base font-semibold px-8 py-4 rounded-full transition-all duration-200 hover:shadow-glow inline-flex items-center justify-center min-h-[52px]"
            >
              Start for free today
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
          </div>
          <p className="mt-5 text-sm text-txt-secondary">
            Takes 5 minutes to set up.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
