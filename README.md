# 賈伯斯數理教室 — 官方網站

> 嘉義在地的精英小班補習機構官方網站。Astro 5 + Tailwind 4 + Decap CMS。

## 專案概述

本網站取代既有 Weebly 站，目標：

1. SEO / GEO / AI 友善（Google + ChatGPT / Claude / Perplexity 可正確引用）
2. 業主可自行透過 Decap CMS 編輯內容
3. 視覺呈現咖啡館溫潤調性（依 [BRAND_GUIDELINES.md](./BRAND_GUIDELINES.md)）
4. 為未來活動 LP 預留快速複製機制

完整規格見 [WEBSITE_RFP.md](./WEBSITE_RFP.md)。

## 技術棧

| 類別 | 工具 | 版本 |
|---|---|---|
| 框架 | Astro | 5.x |
| UI 互動 | React | 19.x |
| 樣式 | Tailwind CSS | 4.x（@tailwindcss/vite） |
| 內容管理 | Astro Content Collections + Decap CMS | — |
| 動效 | GSAP + Lenis | latest |
| 站內搜尋 | Pagefind | 1.x |
| OG 圖 | @vercel/og | 0.8.x |
| 部署 | Vercel | Hobby |

## 本機開發

需求：Node 22+ / npm 11+。

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # 產出 dist/ 並執行 pagefind 建立站內搜尋索引
npm run preview      # 預覽 build 後的站台
npm run check        # astro check（TypeScript + Astro 檢查）
```

## 資料夾結構

```
src/
  components/    # 共用元件（Nav、Footer、TrialForm React Island、Button…）
  layouts/       # BaseLayout（含 ClientRouter、SEO meta）、PageLayout
  pages/         # 路由（index、about、teachers/[slug]、courses/[slug]、posts/[slug]…）
  content/       # Content Collections + zod schema（teachers/courses/posts/testimonials/faq/landing）
  lib/           # seo、jsonld 工具
  styles/        # global.css（Tailwind 4 @theme 品牌色）
public/
  robots.txt     # 含 GPTBot / Claude / Perplexity / Google-Extended / CCBot allow
  llms.txt       # 給 LLM 爬蟲的品牌摘要
  llms-full.txt  # 完整內容匯總（Phase 4 自動生成）
  admin/         # Decap CMS 入口（git-gateway backend、繁中介面）
  favicon.svg
```

## 環境變數

複製 `.env.example` 為 `.env`，依說明填值。

| 變數 | 用途 |
|---|---|
| `RESEND_API_KEY` | 試聽表單寄信（Phase 4 啟用） |
| `TURNSTILE_SECRET_KEY` / `PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile 防 spam |
| `SENTRY_DSN` / `PUBLIC_SENTRY_DSN` | 錯誤監控 |
| `PUBLIC_GA_ID` | Google Analytics 4 |
| `PUBLIC_CLARITY_ID` | Microsoft Clarity |
| `PUBLIC_LINE_URL` | LINE 官方帳號 CTA |
| `NOTIFY_EMAIL_TO` / `NOTIFY_EMAIL_FROM` | 表單通知收/寄信 |
| `PUBLIC_SITE_URL` | 站台 URL（覆寫預設） |

## 開發階段（Phase 規劃）

- **Phase 1（已完成）**：技術骨架、品牌 token、Content Collections schema、頁面 stub
- **Phase 2**：首頁完整版（含動效、JSON-LD、OG 圖自動生成）、課程頁原型
- **Phase 3**：所有一階頁面實作完整版
- **Phase 4**：SEO 結構化資料全套、Resend + Turnstile 表單接通、`llms-full.txt` 自動生成
- **Phase 5**：內容遷移、Decap CMS 培訓、文件交付

## 部署

主分支：`main` → Vercel 自動部署到正式環境。其他分支自動建立 preview。

## 品牌與內容規範

- 視覺：[BRAND_GUIDELINES.md](./BRAND_GUIDELINES.md)
- 內容編輯流程：[docs/CONTENT_EDITING.md](./docs/CONTENT_EDITING.md)（Phase 5 完成）
- 貢獻流程：[CONTRIBUTING.md](./CONTRIBUTING.md)
