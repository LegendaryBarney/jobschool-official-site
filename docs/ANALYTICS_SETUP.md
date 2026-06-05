# 分析與追蹤設定指南（Analytics & Pixel Setup）

> 本檔說明官網所有「分析 / 追蹤 / 站台驗證」相關設定的用途、現況、以及業主需要提供什麼。
> 設計原則：**全部由環境變數驅動，缺值就不渲染**。沒填的服務不會在前端產生任何腳本或 meta 標籤，
> 因此「先上線、之後再補金鑰」是安全的，補上 env 後重新 deploy 即可生效。

所有變數請填在 Vercel 專案的 Environment Variables（或本機 `.env`）。
範本見專案根目錄 `.env.example`。`PUBLIC_` 前綴的值會被打包進前端，屬於公開資訊（非機密）。

---

## 1. Google Analytics 4（GA4）

- **用途**：網站流量分析、來源歸因、轉換事件（如試聽表單送出）、受眾輪廓。為招生成效評估的核心數據。
- **現況（已有邏輯）**：`src/layouts/BaseLayout.astro` 已內建 GA4 條件渲染。
  - 讀取環境變數 `PUBLIC_GA_ID`。
  - 已尊重瀏覽器 Do Not Track（`navigator.doNotTrack === '1'` 時不載入）。
  - 已處理 Astro View Transitions：`astro:after-swap` 時重發 `page_view`，SPA 式換頁不漏記。
- **業主需提供**：GA4 的「評估 ID」（Measurement ID），格式為 `G-XXXXXXXXXX`。
  - 取得方式：GA4 後台 → 管理 → 資料串流 → 選網站串流 → 複製「評估 ID」。
  - 填入 `PUBLIC_GA_ID`。

## 2. Google Tag Manager（GTM）

- **用途**：在不改 code 的前提下，集中管理各家追蹤標籤（GA4、Meta Pixel、轉換像素等），方便行銷端自助調整。
- **現況（規劃中，目前未實作）**：本站目前採「各服務直接埋碼」策略（GA4 / Clarity / Meta Pixel 各自獨立條件渲染），
  尚未導入 GTM 容器。若未來追蹤標籤數量變多、或需要行銷人員自助配置，再評估改走 GTM 統一管理。
- **業主需提供（若決定導入）**：GTM 容器 ID，格式為 `GTM-XXXXXXX`。
  - 取得方式：Google Tag Manager 後台 → 建立容器（平台選「網站」）→ 複製容器 ID。
  - 導入時會新增環境變數（規劃名稱 `PUBLIC_GTM_ID`）並在 `BaseLayout.astro` 加上對應的條件渲染區塊。
  - 注意：若同時走 GTM 與直接埋碼，需避免同一服務（如 GA4）重複載入造成數據翻倍。

## 3. Google Search Console（GSC）網站驗證

- **用途**：向 Google 證明網站所有權，取得索引狀態、搜尋曝光/點擊、Sitemap 提交、索引錯誤通知等 SEO 資料。
- **現況（已有邏輯）**：`src/layouts/BaseLayout.astro` 已內建 meta 標籤驗證法的條件渲染。
  - 讀取環境變數 `PUBLIC_GSC_VERIFICATION`。
  - 有值時於 `<head>` 渲染 `<meta name="google-site-verification" content="..." />`，缺值不渲染。
  - 站台已輸出 `/sitemap-index.xml`（見 `BaseLayout.astro` 的 sitemap discovery link），驗證通過後可在 GSC 提交。
- **業主需提供**：GSC「HTML 標記」驗證法給的 `content` 值（一串驗證碼，**不含** `<meta>` 標籤外框）。
  - 取得方式：Search Console → 新增資源（網域或網址前置字元）→ 選「HTML 標記」驗證方式
    → 複製其中 `content="..."` 引號內的字串。
  - 填入 `PUBLIC_GSC_VERIFICATION` → 重新 deploy → 回 GSC 按「驗證」。
  - 替代方案：若改用 DNS TXT 驗證（網域層級），則不需本變數；但 DNS 切換屬待決策事項，目前以 meta 法為主。

## 4. Google 商家檔案（Google Business Profile）驗證

- **用途**：在 Google 搜尋與 Google 地圖顯示補習班的商家資訊（地址、營業時間、電話、評論、照片），
  是本地搜尋（「嘉義 補習班」「嘉義 數學家教班」）曝光的關鍵，對實體招生影響極大。
- **現況**：Google 商家檔案的驗證**不在官網程式碼範圍內**。它驗證的是「實體商家」而非「網站」，
  與本站的 env 機制無關，無需在 repo 內配置。
- **業主需提供 / 需執行（由業主在 Google 後台操作）**：
  1. 至 Google 商家檔案（business.google.com）建立或認領「賈伯斯數理教室」商家。
  2. 完成驗證 —— Google 通常以下列方式擇一：明信片郵寄驗證碼（寄到補習班地址）、電話、Email，或影片驗證。
  3. 業主需準備：正確的營業地址、市話/手機、營業時間、商家類別（教育 / 補習班）、門市照片。
  - 補充：可在商家檔案「網站」欄填本官網網址（正式網域確定後）以互相導流。
  - 此項與 GSC 是不同系統，但建議用同一個 Google 帳號管理，方便日後整合。

## 5. Meta Pixel（Facebook / Instagram 像素）

- **用途**：追蹤來自 Facebook / Instagram 廣告的訪客行為，支援再行銷受眾建立、廣告轉換最佳化與成效衡量。
  對投放 Meta 廣告招生的成效評估必要。
- **現況（已有邏輯）**：`src/layouts/BaseLayout.astro` 已內建 Meta Pixel 條件渲染。
  - 讀取環境變數 `PUBLIC_META_PIXEL_ID`。
  - 有值才載入標準 `fbq` 腳本並送 `PageView`，缺值不渲染（含 `<noscript>` fallback 也只在有值時輸出）。
  - 已尊重 Do Not Track；已處理 View Transitions（`astro:after-swap` 重發 `PageView`）。
- **業主需提供**：Meta Pixel ID（純數字，約 15-16 位）。
  - 取得方式：Meta 事件管理工具（Events Manager）→ 資料來源 → 選/建立像素 → 複製像素 ID。
  - 填入 `PUBLIC_META_PIXEL_ID`。
  - 進階（可選，未來再做）：若要做表單送出等自訂轉換事件，需在送出處呼叫 `fbq('track', 'Lead')` 之類事件；
    目前僅實作基礎 `PageView`。

---

## 對照表：環境變數一覽

| 變數 | 服務 | 格式 | 現況 |
| --- | --- | --- | --- |
| `PUBLIC_GA_ID` | Google Analytics 4 | `G-XXXXXXXXXX` | 已實作條件渲染 |
| `PUBLIC_CLARITY_ID` | Microsoft Clarity | 專案 ID 字串 | 已實作條件渲染 |
| `PUBLIC_META_PIXEL_ID` | Meta Pixel | 純數字 | 已實作條件渲染 |
| `PUBLIC_GSC_VERIFICATION` | Google Search Console | 驗證碼字串 | 已實作條件渲染 |
| （規劃）`PUBLIC_GTM_ID` | Google Tag Manager | `GTM-XXXXXXX` | 尚未實作 |
| — | Google 商家檔案 | （非 repo 範圍） | 由業主於 Google 後台操作 |

## 填值後如何生效

1. 將值填入 Vercel 專案的 Environment Variables（Production / Preview 視需要）。
2. 觸發一次重新部署（push 或 Vercel redeploy）。
3. 用瀏覽器開發者工具確認：對應腳本/meta 已出現在頁面 `<head>`。
