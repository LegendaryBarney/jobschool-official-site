# 資料匯出指南

> 給業主或下任工程師參考。本站涉及的「資料」分四類：表單資料、Markdown 內容、上傳圖片、第三方分析。
> 本文件說明每類的備份與匯出方式。

---

## 1. 試聽預約表單資料

### 1.1 目前實作（v1）

表單資料**不寫入資料庫**，而是透過 [Resend](https://resend.com) 寄信給業主：

- 業主收件人：`NOTIFY_EMAIL_TO` 環境變數設定（預設 `hwjnctucsie92@gmail.com`）
- 寄件人：`NOTIFY_EMAIL_FROM`（預設 `noreply@jobsedu.com.tw`）
- 一筆預約 → 一封 email

### 1.2 備份方式

由於資料以 email 形式存在，請：

| 動作 | 建議做法 |
|---|---|
| 收件 | 在業主 Gmail 設定 filter，自動加上「試聽預約」標籤，集中管理 |
| 不刪信 | 試聽預約信至少保留 3 年（家長常會在學期初再次聯絡） |
| 二次轉存 | 每月可手動「Forward」整個標籤到第二個信箱（如 NAS Synology MailPlus） |
| 結構化 | 若需做轉換漏斗分析，可用 Zapier / Make.com 將「新郵件」自動寫入 Google Sheet |

### 1.3 Resend 平台側備份

Resend 後臺可看「過去 30 天」寄信記錄（免費方案）：

- 登入 [resend.com](https://resend.com) → Logs
- 點任一筆可看完整 email content
- 可下載為 JSON：未提供官方 export，但可用 [Resend API](https://resend.com/docs/api-reference/emails/list-emails) 自行抓取

範例腳本（Node.js）：

```bash
curl -s 'https://api.resend.com/emails?limit=100' \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  | jq '.' > resend-emails-$(date +%Y%m).json
```

---

## 2. （未來）改用 Vercel KV 時的匯出

若未來資料量大、業主想看儀表板，工程師可能改用 Vercel KV 存表單。屆時匯出方式如下：

### 2.1 Vercel CLI

```bash
# 安裝
npm i -g vercel
vercel login
vercel link  # 對應到 jobs-site 專案

# 列出全部 keys（KV 名稱依當時設定為準，假設為 `trial-signups`）
vercel kv list trial-signups

# 取單筆
vercel kv get trial-signups signup:abc123

# 刪除
vercel kv del trial-signups signup:abc123
```

### 2.2 全量 dump 為 JSON

`scripts/export-kv.mjs`（範例，未來實作時放入 repo）：

```js
import { kv } from '@vercel/kv';
import { writeFile } from 'node:fs/promises';

const out = {};
let cursor = 0;
do {
  const [next, keys] = await kv.scan(cursor, { match: 'signup:*', count: 100 });
  cursor = Number(next);
  for (const k of keys) {
    out[k] = await kv.hgetall(k);
  }
} while (cursor !== 0);

await writeFile(
  `kv-export-${new Date().toISOString().slice(0, 10)}.json`,
  JSON.stringify(out, null, 2),
);
console.log(`匯出 ${Object.keys(out).length} 筆`);
```

執行：

```bash
node scripts/export-kv.mjs
```

> **隱私守則**：匯出的 JSON 含學生姓名、電話。請存於加密磁區，不得放在公開 repo 或雲端硬碟未加密目錄。

---

## 3. Markdown 內容（師資 / 課程 / 部落格 / 見證 / FAQ / LP）

### 3.1 已有的天然備份

所有內容存在 `src/content/*` 為 markdown，**透過 Git 全程版控**。Git repo 本身就是備份：

- GitHub repo（雲端主備份）
- 業主與工程師的本機 clone（多份副本）
- Vercel build 過程中也會 clone 一份

### 3.2 建議業主每月做的事

業主本機準備一個資料夾，每月執行一次：

```bash
cd ~/jobs-site-backup
git fetch origin
git pull origin main
```

> 即使您不會用 git，工程師可幫您設定 GitHub Desktop（GUI 版本），點兩下按鈕就能更新。

### 3.3 一鍵打包匯出（給人非技術業主）

```bash
# 在 repo 根目錄執行
git archive --format=zip --output=content-$(date +%Y%m%d).zip HEAD src/content/
```

產生的 zip 含所有 markdown，可直接寄給其他工程師接手。

---

## 4. 上傳圖片（`public/uploads/`）

### 4.1 目前實作

業主透過 Decap CMS 上傳圖片，會被 commit 到 git repo 的 `public/uploads/` 目錄。

### 4.2 優點

- 與 markdown 同源，clone repo 即備份
- 無第三方依賴

### 4.3 缺點與遷移建議

當圖片數量超過 ~500 張或單檔 > 1MB 時，git repo 會肥大、clone 變慢。屆時建議遷移到 [Cloudinary](https://cloudinary.com)：

#### 遷移步驟（未來工程師參考）

1. 註冊 Cloudinary 免費帳號（25 GB 免費額度，補習班 5-10 年都用不完）
2. 用 Cloudinary CLI 批次上傳：
   ```bash
   npm i -g cloudinary-cli
   cld config
   cld uploader upload public/uploads/* --folder jobs-site/
   ```
3. 將 Decap `config.yml` 的 `media_folder` 改為 Cloudinary widget：
   ```yaml
   media_library:
     name: cloudinary
     config:
       cloud_name: jobsedu
       api_key: xxx
   ```
4. 把 `src/content/*.md` 中的 `/uploads/xxx.jpg` 用 sed 批次替換為 Cloudinary URL
5. 從 git history 移除舊 `public/uploads/`（用 `git filter-repo`）以瘦身 repo

> **遷移前提醒**：是「優化建議」，不是必做。圖片 < 500 張前不必動。

---

## 5. 第三方分析資料

### 5.1 Google Analytics 4

- **保留期**：GA4 免費版預設 14 個月，可調至 26 個月
- **匯出**：GA4 後臺 → Explore → 建立報表 → 「Export」（CSV / PDF）
- **長期保存**：建議每月匯出關鍵報表（流量總覽、熱門頁面、轉換）為 PDF 存檔
- **API 程式化匯出**：若需自動化，工程師可用 [GA4 Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)

### 5.2 Microsoft Clarity

- **保留期**：13 個月（免費版）
- **匯出**：Recordings 與 Heatmaps 無法批次下載，僅能逐項查看
- **建議**：定期截圖重要熱區圖；Session recording 重要片段可錄螢幕

### 5.3 Sentry

- **保留期**：依方案，免費 30-90 天
- **匯出**：每筆 issue 可下載為 JSON；批次用 [Sentry API](https://docs.sentry.io/api/events/)

### 5.4 Vercel Analytics

- **保留期**：Hobby 方案 30 天
- **匯出**：Dashboard → 點 metric → 「Download CSV」

---

## 6. 災難復原 checklist

當需要把站台從零搬到新環境時，順序如下：

1. **Clone repo**：`git clone https://github.com/<owner>/jobs-official-site.git`
2. **準備 .env**：對照 `.env.example` 與 `README.md` 的環境變數表，逐項填入新環境的值
3. **安裝**：`npm ci`
4. **建置**：`npm run build`
5. **部署**：上傳 `dist/` 到新 host（Vercel / NAS / Netlify 皆可）
6. **DNS 切換**：Cloudflare 改 A record 指向新 host
7. **第三方服務**：確認 Resend / Turnstile / Sentry / GA / Clarity 設定仍綁正確 domain（CSP 與 referrer 限制）
8. **驗證**：用 [Rich Results Test](https://search.google.com/test/rich-results) 與 PageSpeed Insights 跑一輪

---

## 7. 聯絡

| 項目 | 找誰 |
|---|---|
| 表單收件 / Resend 帳號 | 業主主信箱（hwjnctucsie92@gmail.com） |
| Vercel 帳號 / GitHub repo 權限 | 業主 GitHub 帳號為 Owner，工程師為 Member |
| 第三方服務帳號 | 業主自行管理（不交給工程師） |
| 緊急救援（誤刪內容、表單失靈） | 工程師（見 README §支援與聯絡） |
