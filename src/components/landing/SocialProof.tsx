"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

function useCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let raf: number;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setCount(target);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);

  return { count, start: () => setStarted(true) };
}

const stats = [
  { value: 2400, suffix: "+", label: "Quotes sent this month" },
  { value: 68, suffix: "%", label: "Average follow-up response rate" },
  { value: 1200, prefix: "£", suffix: "", label: "Average extra monthly revenue" },
  { value: 4.9, suffix: "★", label: "Contractor satisfaction", isDecimal: true },
];

export default function SocialProof() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const shouldReduceMotion = useReducedMotion();

  const counter0 = useCounter(2400);
  const counter1 = useCounter(68);
  const counter2 = useCounter(1200);
  // 4.9 handled differently
  const [decimalStarted, setDecimalStarted] = useState(false);

  useEffect(() => {
    if (isInView) {
      counter0.start();
      counter1.start();
      counter2.start();
      setDecimalStarted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);

  function formatValue(i: number) {
    if (i === 0) return counter0.count.toLocaleString() + "+";
    if (i === 1) return counter1.count + "%";
    if (i === 2) return "£" + counter2.count.toLocaleString();
    if (i === 3) return decimalStarted ? "4.9★" : "0★";
    return "";
  }

  return (
    <section className="bg-surface border-y border-dark-border">
      <div
        ref={ref}
        className="max-w-[1200px] mx-auto px-5 sm:px-8 py-16 sm:py-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0"
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`text-center ${
                i < stats.length - 1
                  ? "lg:border-r lg:border-dark-border"
                  : ""
              }`}
            >
              <p className="text-3xl sm:text-4xl font-extrabold text-txt-primary">
                {formatValue(i)}
              </p>
              <p className="text-sm text-txt-secondary mt-2">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
