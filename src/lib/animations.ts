/**
 * 動效工具函式（GSAP / IntersectionObserver / 純 JS）
 * 全域尊重 prefers-reduced-motion
 */
import { gsap } from 'gsap';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const MAGNETIC_RANGE = 8; // px
const MAGNETIC_RADIUS = 64; // px hover radius

interface MagneticInstance {
  el: HTMLElement;
  cleanup: () => void;
}

const magneticInstances = new WeakMap<HTMLElement, MagneticInstance>();

export function initMagneticButtons(scope: ParentNode = document): () => void {
  if (prefersReducedMotion()) return () => {};
  if (typeof window === 'undefined') return () => {};

  const buttons = scope.querySelectorAll<HTMLElement>('[data-magnetic]');
  const cleanups: Array<() => void> = [];

  buttons.forEach((el) => {
    if (magneticInstances.has(el)) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > Math.max(rect.width, rect.height) / 2 + MAGNETIC_RADIUS) return;
      const strength = Math.min(1, MAGNETIC_RADIUS / Math.max(dist, 1));
      xTo((dx / Math.max(dist, 1)) * MAGNETIC_RANGE * strength);
      yTo((dy / Math.max(dist, 1)) * MAGNETIC_RANGE * strength);
    };

    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    const cleanup = () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      gsap.set(el, { clearProps: 'transform' });
      magneticInstances.delete(el);
    };

    magneticInstances.set(el, { el, cleanup });
    cleanups.push(cleanup);
  });

  return () => cleanups.forEach((c) => c());
}

/**
 * Hero 文字逐字浮現（不依賴 GSAP plus 的 SplitText，純 char split）
 * 將 selector 內每個字符（含中文）切分為 <span> 後 stagger 浮現。
 */
export function initSplitTextHero(selector: string): () => void {
  if (typeof window === 'undefined') return () => {};
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return () => {};

  if (prefersReducedMotion()) {
    el.style.opacity = '1';
    return () => {};
  }

  if (el.dataset.splitDone === 'true') return () => {};
  el.dataset.splitDone = 'true';

  const original = el.textContent ?? '';
  const chars = Array.from(original.trim());
  el.textContent = '';
  el.setAttribute('aria-label', original);
  const frag = document.createDocumentFragment();
  const spans: HTMLSpanElement[] = [];
  chars.forEach((ch) => {
    const span = document.createElement('span');
    span.textContent = ch === ' ' ? ' ' : ch;
    span.style.display = 'inline-block';
    span.style.opacity = '0';
    span.style.transform = 'translateY(0.4em)';
    span.style.willChange = 'opacity, transform';
    span.setAttribute('aria-hidden', 'true');
    frag.appendChild(span);
    spans.push(span);
  });
  el.appendChild(frag);

  const tl = gsap.to(spans, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    ease: 'power3.out',
    stagger: 0.025,
    onComplete: () => {
      spans.forEach((s) => {
        s.style.willChange = 'auto';
      });
    },
  });

  return () => {
    tl.kill();
  };
}
