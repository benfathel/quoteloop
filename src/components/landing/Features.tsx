"use client";

import { motion, useReducedMotion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

/* ── SMS conversation mockup ───────────── */
function SMSMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [step, setStep] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView || shouldReduceMotion) {
      if (shouldReduceMotion) setStep(3);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 600);
    const t2 = setTimeout(() => setStep(2), 2200);
    const t3 = setTimeout(() => setStep(3), 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isInView, shouldReduceMotion]);

  return (
    <div ref={ref} className="mt-6 space-y-3 max-w-sm">
      {/* Sent message */}
      {step >= 1 && (
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="ml-auto max-w-[85%]"
        >
          <div className="bg-brand-500 text-white text-sm rounded-2xl rounded-br-sm px-4 py-3 leading-relaxed">
            Hi Mike, just following up on the quote for your kitchen sink.
            Happy to answer any questions! — Dave
          </div>
          <p className="text-[10px] text-txt-secondary mt-1 text-right">
            Sent automatically
          </p>
        </motion.div>
      )}

      {/* Typing indicator */}
      {step === 2 && (
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-[60px]"
        >
          <div className="bg-dark-border/50 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </motion.div>
      )}

      {/* Reply */}
      {step >= 3 && (
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[85%]"
        >
          <div className="bg-dark-border/30 border border-dark-border text-txt-primary text-sm rounded-2xl rounded-bl-sm px-4 py-3 leading-relaxed">
            Hi Dave, yes please go ahead!
          </div>
          <p className="text-[10px] text-txt-secondary mt-1">Just now</p>
        </motion.div>
      )}
    </div>
  );
}

/* ── Phone mockup ──────────────────────── */
function PhoneMockup() {
  return (
    <div className="flex justify-center mt-6">
      <div className="w-40 h-72 bg-page-bg border-2 border-dark-border rounded-[24px] p-2 relative">
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-dark-border rounded-full" />
        {/* Screen */}
        <div className="w-full h-full bg-surface rounded-[18px] overflow-hidden pt-6">
          <div className="px-3 py-2">
            <div className="text-[8px] font-bold text-txt-primary mb-2">
              New Quote
            </div>
            <div className="space-y-1.5">
              <div className="h-4 bg-dark-border/40 rounded w-full" />
              <div className="h-4 bg-dark-border/40 rounded w-3/4" />
              <div className="h-4 bg-dark-border/40 rounded w-full" />
              <div className="h-8 bg-dark-border/40 rounded w-full mt-2" />
              <div className="h-5 bg-brand-500 rounded w-full mt-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Small feature card ────────────────── */
function SmallCard({
  icon,
  title,
  desc,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={
        shouldReduceMotion ? { duration: 0 } : { delay, duration: 0.5 }
      }
      whileHover={shouldReduceMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
      className="bg-surface border border-dark-border rounded-2xl p-7 hover:border-brand-500 transition-colors duration-300"
    >
      <div className="text-brand-500 mb-4">{icon}</div>
      <h3 className="text-base font-bold text-txt-primary mb-2">{title}</h3>
      <p className="text-sm text-txt-secondary leading-relaxed">{desc}</p>
    </motion.div>
  );
}

/* ── Main features bento ───────────────── */
export default function Features() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="features" className="bg-surface py-[60px] sm:py-[120px] border-y border-dark-border">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold tracking-[3px] text-brand-500 uppercase mb-4">
            Features
          </p>
          <h2
            className="font-extrabold text-txt-primary leading-tight"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            Everything you need.{" "}
            <span className="text-txt-secondary">Nothing you don&apos;t.</span>
          </h2>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Large card — SMS */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}
            whileHover={shouldReduceMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
            className="lg:col-span-8 bg-page-bg border border-dark-border rounded-2xl p-8 overflow-hidden hover:border-brand-500 transition-colors duration-300"
          >
            <h3 className="text-xl font-bold text-txt-primary mb-2">
              Smart follow-ups, on autopilot
            </h3>
            <p className="text-sm text-txt-secondary leading-relaxed max-w-md">
              QuoteLoop automatically follows up with your customers by SMS.
              You focus on the work, we handle the chasing.
            </p>
            <SMSMockup />
          </motion.div>

          {/* Tall card — Phone */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { delay: 0.1, duration: 0.5 }
            }
            whileHover={shouldReduceMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
            className="lg:col-span-4 bg-page-bg border border-dark-border rounded-2xl p-8 overflow-hidden hover:border-brand-500 transition-colors duration-300 flex flex-col"
          >
            <h3 className="text-xl font-bold text-txt-primary mb-2">
              Built for your phone
            </h3>
            <p className="text-sm text-txt-secondary leading-relaxed">
              Manage bookings and check earnings between jobs. No laptop needed.
            </p>
            <div className="flex-1 flex items-center">
              <PhoneMockup />
            </div>
          </motion.div>

          {/* Bottom row — 3 small cards */}
          <div className="lg:col-span-4">
            <SmallCard
              delay={0}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              }
              title="Calendar scheduling"
              desc="See your week at a glance. Customers book through your link."
            />
          </div>
          <div className="lg:col-span-4">
            <SmallCard
              delay={0.1}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              }
              title="Earnings dashboard"
              desc="Track weekly and monthly revenue in real time."
            />
          </div>
          <div className="lg:col-span-4">
            <SmallCard
              delay={0.2}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              }
              title="Secure and private"
              desc="Your customer data is encrypted and never shared."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
