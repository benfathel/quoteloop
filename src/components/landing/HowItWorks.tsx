"use client";

import { motion, useReducedMotion } from "framer-motion";

const steps = [
  {
    num: "01",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
    iconColor: "text-brand-500",
    title: "Add a job",
    desc: "Enter customer details, job description, and amount. Takes less than 30 seconds from your phone.",
  },
  {
    num: "02",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconColor: "text-accent-cyan",
    title: "Manage your schedule",
    desc: "See your bookings on a calendar, track earnings, and let customers book through your form link.",
  },
  {
    num: "03",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.016 6.016 0 01-3.77 1.397 6.016 6.016 0 01-3.77-1.397" />
      </svg>
    ),
    iconColor: "text-success-green",
    title: "Track your earnings",
    desc: "See what you've earned this week and month. Know exactly where your business stands at a glance.",
  },
];

export default function HowItWorks() {
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
    <section id="how-it-works" className="bg-page-bg py-[60px] sm:py-[120px]">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold tracking-[3px] text-brand-500 uppercase mb-4">
            How it works
          </p>
          <h2
            className="font-extrabold text-txt-primary leading-tight"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            Three steps.{" "}
            <span className="text-txt-secondary">Your business, organized.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
              whileHover={shouldReduceMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
              className="relative bg-surface border border-dark-border rounded-2xl p-8 overflow-hidden group hover:border-brand-500 transition-colors duration-300"
            >
              {/* Big number */}
              <span className="absolute top-4 right-6 text-[80px] font-extrabold text-txt-primary/[0.03] leading-none select-none">
                {step.num}
              </span>

              <div className={`${step.iconColor} mb-5`}>{step.icon}</div>
              <h3 className="text-lg font-bold text-txt-primary mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-txt-secondary leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
