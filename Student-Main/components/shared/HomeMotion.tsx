"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** Returns true once the element has scrolled into view. */
export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Direction the element travels in from. */
  from?: "up" | "left" | "right" | "none";
  style?: CSSProperties;
}

/** Scroll-triggered fade + slide reveal. GPU-friendly (opacity/transform only). */
export function Reveal({ children, className = "", delay = 0, from = "up", style }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>(0.12);
  const offset =
    from === "left" ? "-24px" : from === "right" ? "24px" : from === "up" ? "20px" : "0px";

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : `translateY(${from === "up" ? offset : "0px"}) translateX(${from === "left" || from === "right" ? offset : "0px"})`,
        transition: `opacity 600ms cubic-bezier(0.22, 0.61, 0.36, 1) ${delay}ms, transform 600ms cubic-bezier(0.22, 0.61, 0.36, 1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface StatNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

/** Animated count-up number that starts when scrolled into view. */
export function StatNumber({ value, prefix = "", suffix = "", duration = 1100, className = "" }: StatNumberProps) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
