"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A number that counts up to `value` when it appears, and from the old value
 * to the new one when it changes. `delay` lets it wait for the card around it
 * to finish appearing. With "reduce motion" on it just shows the number.
 */
export function CountUp({
  value,
  duration = 700,
  delay = 0,
}: {
  value: number;
  duration?: number;
  delay?: number;
}) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (from.current === value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      setShown(value);
      return;
    }

    const startValue = from.current;
    let frame = 0;
    const timer = window.setTimeout(() => {
      const startedAt = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const current = Math.round(startValue + (value - startValue) * eased);
        from.current = current;
        setShown(current);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [value, duration, delay]);

  return <>{shown}</>;
}
