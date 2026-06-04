import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export default function CountUp({
  to,
  from = 0,
  duration = 1400,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState<number>(from);
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setValue(to);
      return;
    }

    const node = ref.current;
    if (!node) return;

    let raf = 0;
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (startTime == null) startTime = now;
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      setValue(from + (to - from) * eased);
      if (t < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            raf = window.requestAnimationFrame(tick);
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );

    io.observe(node);

    return () => {
      io.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [to, from, duration]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString('zh-Hant-TW');

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
