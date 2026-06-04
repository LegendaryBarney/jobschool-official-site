import { useEffect, useRef, useState } from 'react';

const PAGEFIND_SCRIPT = '/pagefind/pagefind-ui.js';
const PAGEFIND_CSS = '/pagefind/pagefind-ui.css';

interface PagefindUIConstructor {
  new (options: {
    element: string | HTMLElement;
    showSubResults?: boolean;
    showImages?: boolean;
    translations?: Record<string, string>;
  }): unknown;
}

declare global {
  interface Window {
    PagefindUI?: PagefindUIConstructor;
  }
}

type LoadState = 'idle' | 'loading' | 'ready' | 'unavailable';

function loadCss(href: string): void {
  if (document.querySelector(`link[data-pagefind-css]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.pagefindCss = 'true';
  document.head.appendChild(link);
}

async function loadPagefindUi(): Promise<boolean> {
  if (typeof window.PagefindUI === 'function') return true;
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-pagefind]');
    if (existing) {
      existing.addEventListener('load', () => resolve(typeof window.PagefindUI === 'function'));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = PAGEFIND_SCRIPT;
    script.async = true;
    script.dataset.pagefind = 'true';
    script.onload = () => resolve(typeof window.PagefindUI === 'function');
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>('idle');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isCmdK) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (state === 'ready' || state === 'unavailable') return;
    setState('loading');

    let cancelled = false;
    (async () => {
      loadCss(PAGEFIND_CSS);
      const ok = await loadPagefindUi();
      if (cancelled) return;
      if (!ok || typeof window.PagefindUI !== 'function' || !containerRef.current) {
        setState('unavailable');
        return;
      }
      try {
        new window.PagefindUI({
          element: containerRef.current,
          showSubResults: true,
          showImages: false,
          translations: {
            placeholder: '搜尋課程、文章、師資…',
            clear_search: '清除',
            load_more: '載入更多',
            search_label: '站內搜尋',
            zero_results: '找不到「[SEARCH_TERM]」相關結果',
          },
        });
        setState('ready');
      } catch {
        setState('unavailable');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, state]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="站內搜尋" className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]">
      <button
        type="button"
        aria-label="關閉搜尋"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm cursor-default"
      />
      <div className="relative w-full max-w-2xl rounded-xl bg-chalk border border-cream shadow-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-charcoal/60">
            按 <kbd className="px-1.5 py-0.5 rounded bg-cream text-charcoal">Esc</kbd> 關閉
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-charcoal/60 hover:text-charcoal text-sm"
          >
            關閉
          </button>
        </div>

        {state === 'unavailable' ? (
          <div className="rounded-lg border border-cream bg-latte p-6 text-center">
            <p className="font-serif text-lg text-charcoal">搜尋功能於正式環境啟用</p>
            <p className="mt-2 text-sm text-charcoal/70">
              本站搜尋使用 Pagefind 在 build 時建立索引，dev 模式下無索引可查詢。
            </p>
          </div>
        ) : (
          <div ref={containerRef} className="pagefind-ui" />
        )}
      </div>
    </div>
  );
}
