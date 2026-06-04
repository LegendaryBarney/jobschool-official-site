# 賈伯斯數理教室 — 官方網站

> 嘉義在地的精英小班補習機構官方網站。Astro 5 + Tailwind 4 + Decap CMS，部署於 Vercel。

本網站取代既有 Weebly 站，目標：

1. SEO / GEO / AI 友善（Google + ChatGPT / Claude / Perplexity 可正確引用）
2. 業主可自行透過 Decap CMS 編輯內容
3. 視覺呈現咖啡館溫潤調性（依 [BRAND_GUIDELINES.md](./BRAND_GUIDELINES.md)）
4. 為未來活動 LP 預留快速複製機制

完整規格見 [WEBSITE_RFP.md](./WEBSITE_RFP.md)。

---

## 技術棧

| 類別 | 工具 | 用途 |
|---|---|---|
| 主框架 | Astro 5 | 靜態建置 + Islands Architecture |
| UI 互動 | React 19 | 試聽表單、搜尋彈窗、ExitIntent 等 Islands |
| 樣式 | Tailwind CSS 4（`@tailwindcss/vite`） | 工具類 CSS、品牌色 token |
| 型別 | TypeScript 5（strict） | 全站型別檢查 |
| 內容管理 | Astro Content Collections + Decap CMS | Markdown 為單一資料來源、業主用 GUI 編輯 |
| 動效 | GSAP 3 + Lenis | 進場動畫、磁吸 CTA、smooth scroll |
| 站內搜尋 | Pagefind 1 | 純靜態全文搜尋 |
| 表單寄信 | Resend SDK | 試聽預約通知信 |
| 防 spam | Cloudflare Turnstile | 表單 verify |
| OG 圖 | `@vercel/og` | 動態 social card |
| 部署 | Vercel（Hobby） | `main` 自動上線、其他分支 preview |
| 錯誤監控 | Sentry | 前後端錯誤回報 |
| 流量分析 | Google Analytics 4 | 主分析平台 |
| 行為分析 | Microsoft Clarity | 熱區圖、Session replay |

---

## 本機開發

### 環境需求

- Node.js **≥ 22**（建議 LTS 22.x；用 [Volta](https://volta.sh/) 或 [nvm](https://github.com/nvm-sh/nvm) 管理）
- npm **≥ 10**（隨 Node 22 內建）
- Git ≥ 2.40

### 啟動步驟

```bash
git clone https://github.com/<owner>/jobs-official-site.git
cd jobs-official-site
npm install
cp .env.example .env        # Windows PowerShell：Copy-Item .env.example .env
# 依 .env 註解填入各服務 key（試聽表單未串接前可留空）
npm run dev
# 開瀏覽器 http://localhost:4321
```

預設 hot reload 開啟，存檔即重整。Decap CMS 後臺位於 `http://localhost:4321/admin`（本機需手動開啟 Netlify Identity 或改 backend 為 `test-repo` 才能登入測試）。

---

## 可用 scripts

| 指令 | 說明 |
|---|---|
| `npm run dev` | 啟動 Astro dev server，含 HMR；預設 port 4321 |
| `npm run build` | 產出 `dist/` 並執行 `pagefind --site dist` 建立站內搜尋索引 |
| `npm run preview` | 用 Astro preview server 預覽 `dist/`（用於上線前檢查） |
| `npm run check` | 執行 `astro check`：TypeScript + Astro 元件靜態檢查 |
| `npm run astro -- <cmd>` | 直接呼叫 Astro CLI（如 `npm run astro -- add ...`） |

---

## 資料夾結構

```
jobs_official_site/
├── src/
│   ├── components/    # 共用元件（Nav、Footer、TrialForm React Island…）詳見 docs/COMPONENT_INDEX.md
│   ├── content/       # Content Collections + zod schema 定義
│   │   ├── teachers/  # 師資 markdown
│   │   ├── courses/   # 課程 markdown
│   │   ├── posts/     # 部落格 mdx
│   │   ├── testimonials/
│   │   ├── faq/
│   │   └── landing/   # 活動 LP
│   ├── layouts/       # BaseLayout（含 ClientRouter、SEO meta）、PageLayout
│   ├── lib/           # seo、jsonld、animations 工具函式
│   ├── pages/         # 路由（含 api/trial-signup.ts、feed.xml.ts、404）
│   └── styles/        # global.css（Tailwind 4 @theme 品牌色）
├── public/
│   ├── admin/         # Decap CMS 入口（git-gateway backend、繁中介面）
│   ├── uploads/       # 業主上傳圖片（透過 Decap）
│   ├── robots.txt     # 含 GPTBot / ClaudeBot / Perplexity / Google-Extended / CCBot allow
│   ├── llms.txt       # 給 LLM 爬蟲的品牌摘要
│   └── llms-full.txt  # 完整內容匯總（建置時自動生成）
├── docs/              # 專案文件（本文件、CONTENT_EDITING、NAS_DEPLOY 等）
├── astro.config.mjs   # Astro 設定（site URL、integrations、image domain）
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 環境變數說明

完整範本見 `.env.example`。`PUBLIC_` 前綴的變數會被打包到前端 bundle，**不可放機密**。

| 變數 | 必填 | 用途 | 取得方式 |
|---|---|---|---|
| `PUBLIC_SITE_URL` | 必填 | 站台 canonical URL（sitemap、OG、JSON-LD 用） | 業主自行決定（預設 `https://jobsedu.com.tw`） |
| `PUBLIC_LINE_URL` | 必填 | LINE 官方帳號加好友連結 | LINE Official Account Manager → 加入好友連結 |
| `PUBLIC_GA_ID` | 必填 | GA4 評估 ID（`G-XXXXXXXXXX`） | GA4 後臺 → 管理 → 資源設定 → 資料串流 → 點該站台串流 |
| `PUBLIC_CLARITY_ID` | 選填 | Microsoft Clarity Project ID | clarity.microsoft.com → 該專案 → Settings → Setup |
| `PUBLIC_SENTRY_DSN` | 選填 | Sentry 前端 DSN | Sentry → Settings → Projects → 該專案 → Client Keys (DSN) |
| `SENTRY_DSN` | 選填 | Sentry 伺服器端 DSN | 同上（可與前端共用） |
| `PUBLIC_TURNSTILE_SITE_KEY` | 必填 | Cloudflare Turnstile widget 用 site key | Cloudflare Dashboard → Turnstile → Add site |
| `TURNSTILE_SECRET_KEY` | 必填 | Turnstile 後端 verify 用 secret | 同上（建立 site 時一併產生） |
| `RESEND_API_KEY` | 必填 | Resend SDK 寄信 | resend.com → API Keys → Create API Key |
| `NOTIFY_EMAIL_FROM` | 必填 | 表單通知信寄件人（domain 須在 Resend 驗證過） | 自定義（預設 `noreply@jobsedu.com.tw`） |
| `NOTIFY_EMAIL_TO` | 必填 | 業主收件信箱（可逗號分隔多人） | 業主自行決定 |

> **保密守則**：`.env` 檔已加入 `.gitignore`，不會推上 git。Vercel 上的機密請於「Project Settings → Environment Variables」設定，避免存於本機 plain text。

---

## 內容更新

### 業主自行編輯（最常見情境）

1. **改文字、新增文章、改師資 / 課程資料** → 用 Decap CMS：開啟 `https://jobsedu.com.tw/admin`，登入後操作。詳見 [docs/CONTENT_EDITING.md](./docs/CONTENT_EDITING.md)。
2. **改視覺、改版型** → 不在 Decap 範圍，請聯絡工程師。
3. **改網站結構（新增頁面、加新功能）** → 開 GitHub issue，由工程師排期處理。

### 工程師調整內容（特殊情境）

需要直接改 markdown 時，編輯 `src/content/<collection>/*.md`，commit 後推 `dev` 觸發 preview build；確認 OK 再 PR 到 `main`。

---

## 部署

### 主要：Vercel

- 連接 GitHub repo（業主帳號為 Owner，工程師為 Member）
- `main` 分支 → 正式環境（`https://jobsedu.com.tw`）
- 其他分支 → 自動 preview（`https://<branch>--jobsedu.vercel.app`）
- 環境變數於 Vercel Project Settings 設定（請對照本 README 的環境變數表格逐項填入）
- 建置指令：`npm run build`；輸出目錄：`dist/`

### 備援：自架 NAS（Caddy / Nginx）

詳見 [docs/NAS_DEPLOY.md](./docs/NAS_DEPLOY.md)。當 Vercel 額度用完或暫時不可用時，可將 `dist/` 同步到家用 NAS 對外提供服務。

---

## 支援與聯絡

| 用途 | 管道 |
|---|---|
| 業主聯絡（招生 / 課程 / 試聽） | (05)223-0303、嘉義市東區康樂街 10 號 |
| 業主信箱（網站通知信收件人） | hwjnctucsie92@gmail.com |
| 回報網站 bug | 開 GitHub issue（建議附 URL、瀏覽器、複現步驟、螢幕截圖） |
| 內容急修 | 業主可直接於 Decap CMS 修改；若 CMS 故障，請聯絡工程師 |
| 工程師交接 / 文件補充 | 開 issue 並標註 `docs` 標籤 |

### 報 Bug 範本

```
標題：[bug] 課程頁手機版 hero 圖片裁切異常

URL：https://jobsedu.com.tw/courses/high-school-math
裝置 / 瀏覽器：iPhone 13 / Safari 17
複現步驟：
1. 開啟上述 URL
2. 滾動到 hero 區塊
3. 圖片右側被裁切約 1/4

預期行為：圖片應完整呈現
實際行為：右半部被切掉
螢幕截圖：[附圖]
```

---

## 授權與第三方

- 本專案原始碼版權歸**賈伯斯數理教室**所有（依 RFP §13.1）
- 第三方套件授權清單見 [docs/THIRD_PARTY_LICENSES.md](./docs/THIRD_PARTY_LICENSES.md)
- 字體：Google Fonts（SIL OFL 1.1）

---

## 更多文件

| 文件 | 對象 | 用途 |
|---|---|---|
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 工程師 | 分支策略、commit 規範、PR 流程 |
| [BRAND_GUIDELINES.md](./BRAND_GUIDELINES.md) | 全部外包 | 品牌 VI 視覺規範 |
| [docs/CONTENT_EDITING.md](./docs/CONTENT_EDITING.md) | 業主 | Decap CMS 操作手冊 |
| [docs/SITE_ARCHITECTURE.md](./docs/SITE_ARCHITECTURE.md) | 工程師 | 路由地圖、資料流 |
| [docs/COMPONENT_INDEX.md](./docs/COMPONENT_INDEX.md) | 工程師 | 元件清單與 props |
| [docs/NAS_DEPLOY.md](./docs/NAS_DEPLOY.md) | 工程師 | NAS 備援部署 |
| [docs/DATA_EXPORT.md](./docs/DATA_EXPORT.md) | 業主 / 工程師 | 表單與內容備份 |
| [docs/THIRD_PARTY_LICENSES.md](./docs/THIRD_PARTY_LICENSES.md) | 工程師 / 法務 | 第三方套件授權 |
