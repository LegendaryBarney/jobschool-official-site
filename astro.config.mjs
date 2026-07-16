import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sentry from '@sentry/astro';

const SENTRY_DSN = process.env.SENTRY_DSN;

const integrations = [
  react(),
  mdx(),
  sitemap({
    filter: (page) => !page.includes('/admin') && !page.includes('/lp/'),
  }),
];

// 僅在 DSN 存在時啟用 Sentry，避免本地與預覽環境 build 失敗
if (SENTRY_DSN) {
  integrations.push(
    sentry({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.1,
      sourceMapsUploadOptions: {
        // 不在每次 build 都上傳 source map（除非設定 SENTRY_AUTH_TOKEN）
        telemetry: false,
      },
    }),
  );
}

export default defineConfig({
  site: 'https://jobschool-edu.com',
  trailingSlash: 'never',
  // /locations 已併入 /contact（忍文理據點區塊，錨點 #locations）。保留舊網址導向避免 404。
  redirects: {
    '/locations': '/contact',
  },
  // Astro 5 的 'static' 預設等同舊 hybrid：個別頁面只要 export const prerender = false 就會走 SSR
  output: 'static',
  adapter: vercel({
    webAnalytics: { enabled: false },
    maxDuration: 10,
  }),
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  devToolbar: { enabled: false },
  integrations,
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '~': new URL('./src', import.meta.url).pathname,
      },
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
  experimental: {},
});
