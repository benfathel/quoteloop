"use client";

import { motion, useReducedMotion } from "framer-motion";

const testimonials = [
  {
    quote:
      "I was losing 2-3 jobs a month just because I forgot to follow up. QuoteLoop fixed that in the first week.",
    name: "Dave M.",
    role: "Plumber, Manchester",
    initials: "DM",
  },
  {
    quote:
      "Set it up in 10 minutes. Now it just runs in the background. Best £36 I spend each month, no question.",
    name: "Carlos R.",
    role: "Electrician, Birmingham",
    initials: "CR",
  },
  {
    quote:
      "My customers actually comment on how professional the follow-up texts sound. It's made a real difference.",
    name: "Sarah T.",
    role: "HVAC Engineer, Leeds",
    initials: "ST",
  },
];

export default function Testimonials() {
  const shouldReduceMotion = useReducedMotion();

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
    }),
  };

  return (
    <section className="bg-surface py-[60px] sm:py-[120px] border-b border-dark-border">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2
            className="font-extrabold text-txt-primary leading-tight"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            Trusted by tradespeople{" "}
            <span className="text-txt-secondary">across the UK</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
              whileHover={shouldReduceMotion ? {} : { scale: 1.02, transition: { duration: 0.2 } }}
              className="bg-page-bg border border-dark-border rounded-2xl p-7 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <svg
                    key={j}
                    className="w-4 h-4 text-amber-400 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-sm text-txt-primary leading-relaxed italic flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-dark-border">
                <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-400">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-txt-primary">
                    {t.name}
                  </p>
                  <p className="text-xs text-txt-secondary">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
