# 第三方授權清單

> 對應 RFP §13.3。本文件列出本站使用的主要 dependencies 與其授權，作為交付證明。
> 完整清單可用 `npm ls --all` 或 [license-checker](https://www.npmjs.com/package/license-checker) 取得。
> 版本依 `package.json` 為準；以下版本對應 v1 交付時的鎖定版。

---

## 1. 主框架與工具

| 套件 | 版本 | 授權 | 用途 |
|---|---|---|---|
| `astro` | ^5.18.1 | MIT | 主框架（靜態 + Islands） |
| `@astrojs/check` | ^0.9.9 | MIT | Astro / TS 靜態檢查 CLI |
| `@astrojs/mdx` | ^4.3.14 | MIT | MDX 支援（部落格內文） |
| `@astrojs/react` | ^4.4.2 | MIT | React Islands integration |
| `@astrojs/rss` | ^4.0.18 | MIT | RSS feed 生成 |
| `@astrojs/sitemap` | ^3.7.2 | MIT | sitemap.xml 自動生成 |
| `typescript` | ~5.9.3 | Apache-2.0 | TypeScript 編譯器 |

## 2. UI / 樣式 / 動效

| 套件 | 版本 | 授權 | 用途 |
|---|---|---|---|
| `react` | ^19.2.0 | MIT | UI Islands |
| `react-dom` | ^19.2.0 | MIT | React DOM renderer |
| `@types/react` | ^19.2.5 | MIT | React 型別 |
| `@types/react-dom` | ^19.2.3 | MIT | React DOM 型別 |
| `tailwindcss` | ^4.3.0 | MIT | 工具類 CSS |
| `@tailwindcss/vite` | ^4.3.0 | MIT | Tailwind 4 Vite plugin |
| `gsap` | ^3.13.0 | GreenSock Standard "No Charge" License | 動效引擎；商業使用免費，但販售或 SaaS 場景需 Business Green 授權 |
| `lenis` | ^1.3.23 | ISC | smooth scroll |

> **GSAP 授權注意**：GSAP 採 "Standard 'No Charge'" 授權，[條款](https://gsap.com/standard-license/)允許用於免費對外公開的網站，且**禁止用 GSAP 開發再販售給多客戶的成品**。本案為單一補習班自有官網，符合免費條款。

## 3. 內容、表單、SEO

| 套件 | 版本 | 授權 | 用途 |
|---|---|---|---|
| `zod` | ^3.25.76 | MIT | Content Collection schema、表單驗證 |
| `@vercel/og` | ^0.11.1 | Apache-2.0 | OG image 動態生成 |
| `@marsidev/react-turnstile` | ^1.5.2 | MIT | Cloudflare Turnstile React wrapper |

## 4. 站內搜尋與工具

| 套件 | 版本 | 授權 | 用途 |
|---|---|---|---|
| `pagefind` | ^1.4.0 | MIT | 靜態全文搜尋 |
| `prettier` | ^3.6.2 | MIT | 程式碼格式化 |
| `prettier-plugin-astro` | ^0.14.1 | MIT | Astro 檔案格式支援 |

## 5. 後臺 CMS（前端 CDN 載入，非 npm 依賴）

| 套件 | 版本 | 授權 | 用途 |
|---|---|---|---|
| Decap CMS | latest（CDN） | MIT | `/admin` 內容編輯 GUI |
| Netlify Identity Widget（選配） | latest | MIT | Decap 認證入口 |

## 6. 字體

| 字體 | 來源 | 授權 | 用途 |
|---|---|---|---|
| Noto Serif TC | Google Fonts | SIL Open Font License 1.1 | 中文標題（思源宋體） |
| Noto Sans TC | Google Fonts | SIL Open Font License 1.1 | 中文內文（思源黑體） |
| Fraunces | Google Fonts | SIL Open Font License 1.1 | 英文 serif 標題 |
| Inter | Google Fonts | SIL Open Font License 1.1 | 英文 sans 內文 |
| Caveat | Google Fonts | SIL Open Font License 1.1 | 手寫粉筆 accent |

> SIL OFL 1.1 允許免費商業使用、嵌入網頁、隨網站附上字體檔。本站透過 Google Fonts CDN 載入，不需要在 repo 內存放字體檔。

## 7. 線上服務（非授權但有條款依附）

| 服務 | 方案 | 用途 | 條款連結 |
|---|---|---|---|
| Vercel | Hobby（免費） | 部署主機 | [Terms](https://vercel.com/legal/terms) |
| Cloudflare DNS | Free | DNS 管理 | [Terms](https://www.cloudflare.com/terms/) |
| Cloudflare Turnstile | Free | 防 spam | 同上 |
| Resend | Free（3,000 / 月） | 寄信 | [Terms](https://resend.com/legal/terms-of-service) |
| Sentry | Developer 免費 | 錯誤監控 | [Terms](https://sentry.io/terms/) |
| Google Analytics 4 | 免費 | 流量分析 | [Terms](https://marketingplatform.google.com/about/analytics/terms/) |
| Microsoft Clarity | 免費 | 行為分析 | [Terms](https://clarity.microsoft.com/terms) |
| GitHub | Free | repo 託管 | [Terms](https://docs.github.com/en/site-policy/github-terms) |

> **業主提醒**：上述服務的 Free 方案有用量上限（Resend 3,000 信 / 月、Vercel Hobby 100GB bandwidth）。每月可登入 Dashboard 看用量；接近上限時請通知工程師評估升級方案。

---

## 8. 完整依賴審查指令

工程師交付前可執行：

```bash
# 列出全部直接 + 間接依賴
npm ls --all

# 檢查是否有 high / critical 漏洞
npm audit

# 檢查授權分布（需先安裝 license-checker）
npx license-checker --summary

# 列出非 MIT / ISC / Apache-2.0 / BSD 的套件（需人工 review）
npx license-checker --excludePackages '@types/react' \
  --exclude 'MIT,ISC,Apache-2.0,BSD-2-Clause,BSD-3-Clause,CC0-1.0,Unlicense'
```

---

## 9. 圖片與素材

| 來源 | 授權 | 用途 |
|---|---|---|
| 業主自拍 / 自製 | 業主版權所有 | 教室照、師資照、課程照 |
| Unsplash / Pexels（若有引用） | 各平台免費商用授權 | 部落格示意圖（若引用，請於文章 alt 註明出處） |
| 業主 Logo | 業主版權所有 | header / favicon |

> **建議**：所有對外公開圖片以業主自有素材為主，避免素材庫圖（會降低品牌獨特性 + 在 GEO/AI 引用時較弱）。

---

## 10. 變更紀錄

| 版本 | 日期 | 變更 |
|---|---|---|
| v1.0 | 2026-05-10 | 初版建立，對應 v1 交付 |

> 每次升級主要 dependency 或新增第三方服務時，請工程師同步更新本文件並升版。
