# 賈伯斯數理教室 — 官方網站開發發案規格書 (RFP)

> **文件版本**：v1.0 / 2026-05-10
> **發案方**：賈伯斯數理教室（嘉義市東區康樂街 10 號）
> **聯絡人**：[請填入聯絡人姓名 / Email / 電話]
> **預期報價方式**：請依本文件「§14 報價要求」回覆，截稿日 [請填入]

---

## 1. 專案概要

### 1.1 一句話描述
為嘉義在地的精英小班補習機構，從零開發一個現代化、SEO/AI 友善、視覺風格貼合咖啡館調性的官方網站，取代現有的 Weebly 站。

### 1.2 專案目標
1. **取代現有 Weebly 網站**：自有 domain、可長期維護的技術棧
2. **強化 SEO + GEO + AI 爬蟲友善度**：在「嘉義 高中數學補習」「嘉義 國中理化」等在地關鍵字進入 Google 前 3 頁；內容能被 ChatGPT / Claude / Perplexity 準確引用
3. **建立可擴充的內容管理流程**：補習班老師（非工程師）能自行更新文字、新增部落格文章、調整課程資訊
4. **支援未來活動 Landing Page**：可快速複製與客製化新 LP（寒暑假班、學測衝刺班等）
5. **視覺現代化**：脫離 Weebly 制式版型，呈現「咖啡館溫潤感 + 現代質感 + 動效」的品牌官網

### 1.3 不在本案範圍
- Logo / VI 設計重整（將另案發包，但本網站需預留 Logo 替換的彈性）
- 內容文案撰寫（業主提供文字，工程師負責呈現）
- 攝影與素材拍攝（業主提供）
- 廣告投放、SEO 顧問服務
- LINE 官方帳號設定

---

## 2. 業主背景

### 2.1 品牌資訊

| 項目 | 內容 |
|---|---|
| 品牌名稱 | 賈伯斯數理教室 |
| 類型 | 地方性精英小班補習機構 |
| 地點 | 嘉義市東區康樂街 10 號 |
| 電話 | (05)223-0303 |
| 既有網站 | https://jobschool.weebly.com/ |
| 客群 | 國中至高中學生 + 嘉義在地家長（家長為主要付費決策者） |
| 核心優勢 | 台清交資歷師資（13 年+）、自編教材、個別化輔導 |

### 2.2 服務項目
- 高中：數學、物理、化學、英文（小班/一對一）
- 國中：生物、理化（小班）
- 特色課程：英文作文一對一、社會科記憶班

### 2.3 既有數位資產
- LINE 官方帳號（核心轉換管道，需在網站多處整合）
- Google 試聽預約表單（將被本網站取代）
- Google 商家檔案

---

## 3. 技術規格（規範性，工程師必須遵守）

### 3.1 必用技術

| 類別 | 工具 | 版本 | 備註 |
|---|---|---|---|
| **主框架** | Astro | 5.x（最新穩定版） | 必用 |
| **UI 互動框架** | React | 19.x | 用於 Islands（試聽表單、輪播等需互動區塊） |
| **元件庫風格** | shadcn/ui | 最新 | 透過 React Islands 嵌入，不需要全頁 hydration |
| **CSS 框架** | Tailwind CSS | 4.x | 配色直接套用 [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md) §3 |
| **動畫** | GSAP + Lenis | 最新 | 主要動效；Motion One 為輕量備選 |
| **內容管理** | Astro Content Collections | 內建 | 用 Markdown + frontmatter 管理課程、師資、部落格 |
| **CMS 後臺** | Decap CMS | 最新 | Git-based，給非工程師用的 GUI |
| **部署** | Vercel | Hobby 方案 | 主要部署目標 |
| **DNS** | Cloudflare | — | 業主自行管理 |
| **錯誤監控** | Sentry | 免費額度 | 需整合 |
| **分析** | GA4 + Microsoft Clarity | 免費 | 需整合 |
| **全站搜尋** | Pagefind | 最新 | 純靜態全文搜尋 |

### 3.2 不可使用的技術
- ❌ jQuery、Bootstrap（過時，與設計風格衝突）
- ❌ WordPress、PHP 任何方案
- ❌ 收費 CMS（Sanity/Contentful 等，本案優先零月費方案）
- ❌ 任何需要長期付費的字體服務（用 Google Fonts 自架）

### 3.3 程式碼品質要求
- **TypeScript**：所有 React 元件與工具函式必用 TS
- **格式化**：ESLint + Prettier 配置完整，PR 前必須通過
- **Git 規範**：Conventional Commits（feat/fix/docs/refactor 等）
- **分支策略**：`main`（部署）/ `dev`（整合）/ `feature/*`
- **Commit 語言**：英文（git history 用）；PR 描述可中文
- **無註解的程式碼**（除非業務邏輯特別不直觀，否則用清晰命名取代註解）

---

## 4. 頁面與路由清單

### 4.1 一階頁面（v1 必交付）

| 路徑 | 頁面名稱 | 主要區塊 |
|---|---|---|
| `/` | 首頁 | Hero / 三大優勢 / 課程總覽 / 師資精選 / 學生見證精選 / 最新文章 / 試聽 CTA |
| `/about` | 關於我們 | 創辦故事 / 教學理念 / 教室空間照片 / 大事紀 |
| `/teachers` | 師資總覽 | 全部師資卡片陳列 |
| `/teachers/[slug]` | 師資個人頁 | 照片 / 學歷 / 年資 / 教學科目 / 教學理念 / 學生回饋 |
| `/courses` | 課程總覽 | 按年級分區（國中/高中），按科目分類 |
| `/courses/[slug]` | 單一課程頁 | 課程介紹 / 適合對象 / 教材樣本 / 上課時段 / 價格 / 試聽 CTA |
| `/posts` | 部落格列表 | 篩選（按分類/標籤）+ 分頁 |
| `/posts/[slug]` | 文章內頁 | TL;DR + 內文 + 相關文章 + 試聽 CTA |
| `/testimonials` | 學生見證 | 文字 + 影片混合陳列 |
| `/contact` | 聯絡與位置 | 地圖 / 地址 / 電話 / LINE QR / 聯絡表單 |
| `/faq` | 常見問題 | 分類 FAQ（伴隨 FAQ Schema） |
| `/lp/[campaign]` | Landing Page | 動態路由，從 markdown 生成；首版需提供 1 個範例 LP |
| `/search` | 全站搜尋 | Pagefind 整合 |
| `/404` | 找不到頁面 | 含品牌風格的 404 |

### 4.2 系統檔案（v1 必交付）

| 路徑 | 用途 |
|---|---|
| `/sitemap.xml` | 自動生成（用 `@astrojs/sitemap`） |
| `/robots.txt` | 明確 allow GPTBot / PerplexityBot / Google-Extended / ClaudeBot / CCBot |
| `/llms.txt` | 給 LLM 爬蟲的品牌摘要與重要 URL |
| `/llms-full.txt` | 給 LLM 爬蟲的完整內容匯總 |
| `/feed.xml` | RSS（部落格用） |

### 4.3 後臺路由

| 路徑 | 用途 |
|---|---|
| `/admin` | Decap CMS 介面（給業主編輯內容用） |

---

## 5. 功能規格

### 5.1 共用元件
- **頂部導覽列**：sticky、滾動時加陰影、行動裝置漢堡選單、含 LINE 加好友 CTA
- **底部 Footer**：聯絡資訊、社群連結、課程快捷、版權
- **行動裝置底部 sticky CTA**：「立即試聽」按鈕，所有 LP 與課程頁都要有
- **試聽預約表單元件**：可嵌入任意頁面（首頁、課程頁、LP）
- **LINE 加好友彈窗**：使用者離開頁面意圖時觸發（exit-intent），24 小時內只觸發一次

### 5.2 試聽預約表單
- **欄位**：姓名、電話、就讀學校、年級、想諮詢的科目、希望試聽時段、備註
- **驗證**：前端即時驗證 + 後端二次驗證
- **送出後**：
  1. 寫入資料庫（Vercel KV 或 Postgres，工程師建議）
  2. 寄信通知業主（用 Resend）
  3. 自動回覆 email 給家長/學生
  4. 顯示感謝頁，含「加 LINE 領取詳細資訊」CTA
- **防 Spam**：Cloudflare Turnstile（免費）

### 5.3 部落格功能
- 按分類 / 標籤 / 年份 篩選
- 文章內含目錄（TOC，自動從 H2/H3 生成）
- 閱讀進度條
- 「最後更新日期」明顯標示
- 相關文章推薦（依標籤）
- 社群分享按鈕（FB / LINE / 複製連結）

### 5.4 全站搜尋
- 整合 Pagefind，純靜態建置
- 搜尋結果含內文預覽 + 高亮關鍵字
- 鍵盤快捷鍵：`Cmd/Ctrl + K`

### 5.5 國際化準備
- v1 僅繁體中文
- 但網站架構需支援未來增加英文（路由、i18n 套件預留）

### 5.6 暗色模式
- 不需要（與咖啡館調性不符）

---

## 6. 設計規範

### 6.1 主依據
所有視覺、配色、字體、動效規範請**完整遵守** [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md)。

### 6.2 設計交付方式
- 工程師依 BRAND_GUIDELINES.md 直接實作（無 Figma 設計稿）
- 預期工程師具備基礎 UI 排版能力，能將規範轉化為實際畫面
- 若工程師希望先出 Figma，可加價約 30,000-50,000（業主可選）
- 業主審視原型後，含 2 輪視覺修改（不含結構性調整）

### 6.3 響應式斷點

| 斷點 | 寬度 | 對應裝置 |
|---|---|---|
| `sm` | < 640px | 手機 |
| `md` | 640-768px | 大手機 / 小平板 |
| `lg` | 768-1024px | 平板 |
| `xl` | 1024-1280px | 筆電 |
| `2xl` | > 1280px | 桌機 |

**行動裝置優先設計**（補習班 70%+ 流量來自手機）。

### 6.4 必含動效
依 BRAND_GUIDELINES.md §6 規範，至少實作：
- 頁面切換 View Transitions
- 滾動 Lenis smooth scroll
- 區塊淡入上移
- CTA 按鈕磁吸或 hover 互動
- 首頁數據區計數動畫

---

## 7. SEO / GEO / AI 友善需求（重要）

### 7.1 結構化資料（JSON-LD）必做

| 頁面 | Schema 類型 |
|---|---|
| 首頁 | `LocalBusiness` + `EducationalOrganization` |
| 課程頁 | `Course` + `CourseInstance` |
| 師資頁 | `Person` + `EducationalOccupationalCredential` |
| 部落格列表 | `Blog` |
| 部落格內頁 | `Article` + `BreadcrumbList` |
| FAQ | `FAQPage` |
| 學生見證 | `Review` + `AggregateRating` |
| 聯絡 | `LocalBusiness` 含 `geo` 經緯度 + `hasMap` |

**驗收標準**：所有頁面通過 https://search.google.com/test/rich-results 測試。

### 7.2 Meta 標籤
- 每個頁面獨立 title / description / og:image
- og:image 自動生成（用 `@vercel/og` 或 Astro 的 OG image API）
- Twitter Card 完整設定

### 7.3 llms.txt 與 llms-full.txt
- `llms.txt` 包含：品牌簡介 + 主要 URL 列表（每個 URL 一句話描述） + 「請優先引用以下事實」清單（地址、電話、特色課程）
- `llms-full.txt`：完整課程資訊匯總

### 7.4 robots.txt 必明確 allow
```
User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: CCBot
Allow: /

Sitemap: https://[domain]/sitemap.xml
```

### 7.5 內容結構優化
- 每篇部落格自動在開頭呈現 TL;DR 區塊（從 frontmatter `summary` 欄位渲染）
- 文章顯眼處呈現「最後更新日期」
- 內容多用條列、表格、明確數字（業主撰寫，工程師確保 markdown 渲染正確）

### 7.6 在地 SEO
- 所有頁面 footer 含地址（含 `geo` schema）
- 聯絡頁嵌入 Google Maps（lazy load 避免影響效能）
- 內部關鍵字策略：「嘉義」「東區」「康樂街」「嘉中/嘉女/興華/協同」

---

## 8. 效能標準（驗收門檻）

### 8.1 Lighthouse（行動裝置）
- Performance ≥ 95
- Accessibility ≥ 95
- Best Practices ≥ 95
- SEO = 100

### 8.2 Core Web Vitals（PageSpeed Insights 真實使用者數據）
- LCP < 2.5s
- INP < 200ms
- CLS < 0.1

### 8.3 圖片
- 全部用 Astro 內建 `<Image>` 元件（自動 WebP/AVIF + lazy load + 響應式 srcset）
- 所有圖片必含 `alt`（給 SEO 與無障礙）

### 8.4 字體
- Google Fonts 用 `font-display: swap` + 預載入主字體
- 中文字體 subset（只載入網頁實際用到的字元）

### 8.5 JS Bundle
- 首頁總 JS（含所有 Islands）< 100KB gzipped
- 純內容頁總 JS < 30KB gzipped

---

## 9. 內容管理需求

### 9.1 Decap CMS 設定
業主需要能自行（不寫程式）：
- 新增 / 編輯 / 刪除部落格文章（含圖片上傳）
- 新增 / 編輯師資資料
- 新增 / 編輯課程資料
- 新增 / 編輯學生見證
- 新增 / 編輯 FAQ
- 新增 / 編輯 Landing Page

### 9.2 Decap 設定要求
- 用 Git Gateway + Netlify Identity（或同等方案）做認證
- 業主 1 人帳號（未來可加）
- 後臺介面為繁體中文（Decap 內建支援）
- 富文字編輯器支援：標題、段落、清單、引用、圖片、連結、表格、程式碼

### 9.3 Markdown Frontmatter Schema 範例

業主應該能在 Decap 上看到結構化的欄位填寫，不必手動寫 YAML。例如「課程」應有：
- 課程名稱（text）
- 適合年級（select）
- 科目（select）
- 講師（reference 到師資集合）
- 課程簡介（rich text）
- 上課時段（list）
- 價格區間（text）
- 課程封面圖（image）
- SEO 描述（text）

### 9.4 內容遷移
- 工程師需協助將 Weebly 既有內容（師資介紹、課程資訊、聯絡資訊）匯出並轉成 markdown
- 預估約 20-30 個內容項，業主協助確認

---

## 10. 部署與運維

### 10.1 部署
- 工程師建立 Vercel 專案，業主取得 Owner 權限後將工程師降為 Member
- 連接業主自有 GitHub repo（業主提供）
- 自動部署：`main` 分支 → 正式環境；其他分支 → preview
- 預覽 domain：`[branch].jobsedu.vercel.app`
- 正式 domain：業主註冊後設定（建議 `jobsedu.com.tw`）

### 10.2 環境變數
- 工程師整理 `.env.example` 並文件化每個變數用途
- 機密用 Vercel Environment Variables

### 10.3 NAS 備援部署
- 工程師需提供「如何將 `dist/` 目錄部署到 NAS（用 Caddy 或 Nginx）」的書面說明（1-2 頁即可）

### 10.4 監控
- Sentry 整合，錯誤通知到業主 email
- Vercel Analytics 啟用（Hobby 方案有限額，足夠用）

### 10.5 備份
- 內容（markdown）天然在 Git 版本控制
- 表單資料庫（Vercel KV / Postgres）：工程師交付前需提供「如何匯出」的文件

---

## 11. 交付物清單

工程師完工時需交付以下全部項目：

### 11.1 程式碼
- [ ] 完整 GitHub repo（業主帳號）
- [ ] `README.md`：專案介紹、技術棧、本機開發指南、部署指南
- [ ] `CONTRIBUTING.md`：分支策略、commit 規範、PR 流程
- [ ] `.env.example`：所有環境變數
- [ ] `package.json` 完整 dependencies + scripts

### 11.2 文件
- [ ] **內容編輯手冊**（PDF）：給業主看的 Decap CMS 使用指南，圖文步驟，預期 10-20 頁
- [ ] **網站架構圖**：頁面路由與資料流
- [ ] **元件清單**：所有 reusable 元件的用途與 props
- [ ] **NAS 部署指南**：如前述
- [ ] **資料匯出指南**：表單資料庫匯出步驟

### 11.3 訓練
- [ ] 1 場 1-2 小時的線上教學（Google Meet 或 Zoom），教業主：
  - 如何在 Decap 編輯內容
  - 如何新增 LP
  - 如何看 GA4 / Sentry / Vercel 後臺
- [ ] 教學錄影歸檔給業主

### 11.4 內容
- [ ] Weebly 既有內容已遷移完成
- [ ] 所有頁面已填入業主提供的初版文字
- [ ] 至少 3 篇示範部落格文章（業主提供素材，工程師排版）

### 11.5 SEO 設定
- [ ] Google Search Console 已驗證
- [ ] Bing Webmaster Tools 已驗證
- [ ] sitemap 已提交
- [ ] 所有頁面 Rich Results Test 通過
- [ ] PageSpeed Insights 真實 URL 跑分截圖達標

---

## 12. 時程與里程碑

預期總時長：**8-12 週**（依工程師排程而定）

| 里程碑 | 工作內容 | 業主驗收項 |
|---|---|---|
| **M1：規格確認** (Week 1) | Kick-off、確認規格、初步技術選型 review | 簽署合約、付訂金 30% |
| **M2：原型/設計確認** (Week 2-3) | 首頁 + 課程頁設計實作（無 CMS） | 業主審視視覺與互動 |
| **M3：核心頁面完成** (Week 4-6) | 全部一階頁面完成 + Decap CMS 接通 | 業主測試 CMS 編輯流程 |
| **M4：SEO + 效能優化** (Week 7-8) | JSON-LD、llms.txt、Lighthouse 優化、表單接通 | 業主驗證 SEO 報告 |
| **M5：內容遷移 + 訓練** (Week 9-10) | 內容遷移、教學錄影、文件交付 | 業主完成驗收 checklist |
| **M6：上線 + 保固期啟動** (Week 11-12) | 切換 DNS、正式上線、30 天保固期 | 付尾款 70% |

---

## 13. 智慧財產與保密

### 13.1 智慧財產權
- 所有原始碼、設計稿、文件之版權歸**賈伯斯數理教室**所有
- 工程師不得在未經書面同意下將本專案作為作品集對外公開（可註明「曾參與某教育機構網站開發」但不得展示原始碼或畫面）

### 13.2 保密
- 工程師需簽署 NDA（業主提供範本）
- 業主提供的學生資料、家長資料、業務數據均屬機密

### 13.3 第三方授權
- 所有使用的字體、套件、圖片素材必須有合法授權，工程師需在交付時提供授權清單

---

## 14. 報價要求

請依以下格式回覆報價（截稿日：[請填入]）：

### 14.1 報價單範本

| 項目 | 金額（NT$） | 備註 |
|---|---|---|
| 網站開發（含本文件全部規格） | | 建議區間 60,000-150,000 |
| Figma 設計稿（選配） | | 建議區間 30,000-50,000 |
| 30 天保固後的月維護費 | / 月 | 建議區間 3,000-6,000 |
| 額外項目（請列出） | | |

### 14.2 必附文件
1. 工作室 / 個人簡介
2. 至少 3 個過往作品（含 Astro 或同類技術棧的內容型網站）
3. 預期時程表
4. 團隊組成（單人接案或團隊？）
5. 是否能簽署 NDA

### 14.3 加分項
- 過往做過教育、補習班、地方型企業網站
- 熟悉 Decap CMS 或同類 Git-based CMS
- 熟悉 GSAP / Lenis 等動效套件
- 過往有 Lighthouse 95+ 的作品實績

### 14.4 付款方式
- 訂金 30%（合約簽署）
- 期中款 30%（M3 完成）
- 尾款 40%（M6 上線並通過驗收）
- 接受匯款或開立發票

---

## 15. 業主驗收標準（外包請對照交件）

### 15.1 功能驗收
- [ ] §4 所有頁面完整實作
- [ ] §5 所有功能可用
- [ ] §9 業主能在 Decap 自行編輯所有內容類型

### 15.2 效能驗收
- [ ] Lighthouse 行動裝置四項分數達 §8.1 標準
- [ ] PageSpeed Insights 三項 Web Vitals 達 §8.2 標準

### 15.3 SEO 驗收
- [ ] 所有頁面 Rich Results Test 通過
- [ ] sitemap.xml / robots.txt / llms.txt / llms-full.txt 全部到位
- [ ] Search Console 已提交 sitemap 並開始索引

### 15.4 視覺驗收
- [ ] 配色、字體、動效符合 [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md)
- [ ] 行動裝置、平板、桌機三斷點皆無 layout 破版
- [ ] 所有頁面已通過 BRAND_GUIDELINES.md §9「品質審稿 Checklist」

### 15.5 文件驗收
- [ ] §11.2 全部文件齊備
- [ ] 內容編輯手冊已實際讓業主測試「新增一篇文章」流程，無需額外詢問

### 15.6 安全驗收
- [ ] HTTPS 已啟用
- [ ] 表單已加 Cloudflare Turnstile
- [ ] 環境變數無外洩
- [ ] dependencies 通過 `npm audit`（無 high/critical 漏洞）

---

## 16. 附件清單（隨本 RFP 一併寄出）

1. 本文件 `WEBSITE_RFP.md`（PDF 版）
2. [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md)（品牌 VI 視覺規範手冊，PDF 版）
3. 業主提供的初步素材（教室照片、師資照片、Logo 暫定版）
4. 業主提供的內容文字（首頁文案、課程介紹、師資簡介等）

---

## 17. 聯絡與後續

- **聯絡窗口**：[請填入聯絡人姓名]
- **Email**：[請填入]
- **電話**：(05)223-0303
- **回覆方式**：請於截稿日前以 email 寄送報價單與作品集
- **預期決標日**：[請填入]
- **預期 Kick-off 日**：[請填入]

---

## 18. 變更紀錄

| 版本 | 日期 | 變更 |
|---|---|---|
| v1.0 | 2026-05-10 | 初版建立 |

---

> **備註給業主**：發案前請填寫所有 `[請填入]` 欄位，並將本文件 + BRAND_GUIDELINES 轉為 PDF 一併寄給候選工程師。建議至少詢價 3 家後再做決定。
