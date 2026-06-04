import { useEffect, useState } from 'react';

const STORAGE_KEY = 'jobs:exit-intent-shown';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h
const MIN_DWELL_MS = 30_000;

function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function alreadyShown(): boolean {
  try {
    const ts = localStorage.getItem(STORAGE_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < COOLDOWN_MS;
  } catch {
    return false;
  }
}

function markShown(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export default function ExitIntentLine() {
  const [open, setOpen] = useState(false);
  const lineUrl = (import.meta.env.PUBLIC_LINE_URL as string | undefined) || '#';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isReducedMotion()) return;
    if (alreadyShown()) return;

    const mountedAt = Date.now();
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();
    let triggered = false;

    const trigger = () => {
      if (triggered) return;
      triggered = true;
      markShown();
      setOpen(true);
    };

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5 && e.relatedTarget == null) trigger();
    };

    const onScroll = () => {
      const now = performance.now();
      const dy = window.scrollY - lastScrollY;
      const dt = now - lastScrollTime;
      lastScrollY = window.scrollY;
      lastScrollTime = now;
      if (dt <= 0) return;
      const speed = dy / dt; // px / ms (negative when scrolling up)
      if (
        Date.now() - mountedAt > MIN_DWELL_MS &&
        speed < -1.5 // 上滑速度閾值（≈1500px/s）
      ) {
        trigger();
      }
    };

    if (isMobile) {
      window.addEventListener('scroll', onScroll, { passive: true });
    } else {
      document.addEventListener('mouseleave', onMouseLeave);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <button
        type="button"
        aria-label="關閉彈窗"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm cursor-default"
      />
      <div
        className="relative w-full max-w-md rounded-2xl bg-chalk border-2 border-caramel p-6 sm:p-8 shadow-2xl animate-[exit-intent-pop_400ms_var(--ease-brand)]"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="關閉"
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-charcoal/60 hover:bg-cream hover:text-charcoal transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <p className="font-handwriting text-2xl text-espresso">等等，再多看一眼</p>
        <h2 id="exit-intent-title" className="mt-1 font-serif text-2xl font-bold text-charcoal">
          加 LINE 領取詳細課程資訊
        </h2>
        <p className="mt-3 text-sm text-charcoal/80 leading-relaxed">
          直接和老師對話，可詢問試聽時段、課表、教材樣本。
          沒有自動推播訊息，您主動詢問才回覆。
        </p>

        <div className="mt-5 grid place-items-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-latte border border-cream">
            <span className="text-xs text-charcoal/50">LINE QR</span>
          </div>
        </div>

        <a
          href={lineUrl}
          target={lineUrl !== '#' ? '_blank' : undefined}
          rel={lineUrl !== '#' ? 'noopener noreferrer' : undefined}
          onClick={() => setOpen(false)}
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-caramel font-medium text-charcoal shadow-sm transition-transform hover:-translate-y-px"
        >
          加 LINE 領取詳細資訊
        </a>
      </div>

      <style>{`
        @keyframes exit-intent-pop {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
