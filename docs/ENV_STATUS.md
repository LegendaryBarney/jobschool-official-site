# 雲端環境變數現況（ENV_STATUS）

> 本文檔讓業主隨時掌握 **Vercel 雲端實際設了哪些環境變數**。
> 機密值（API 金鑰）**永不寫進進 git 的檔案**；本文檔只記公開值與「是否已設定」狀態。
> 最後校對：以 `vercel env ls` 為準（2026-06-08）。

---

## 一、三地模型：env 值到底在哪？

環境變數在三個地方各有一份，用途不同，**別搞混**：

| 位置 | 檔案/來源 | 進 git？ | 內容 | 角色 |
|---|---|---|---|---|
| **範本** | `.env.example` | ✅ 進 git | **全空**（只有變數名與註解） | 告訴開發者「有哪些變數要填」。**故意留空**，因為 git 公開不能放真值。 |
| **本地開發** | `.env`（自己 `cp .env.example .env` 建立） | ❌ gitignore | 開發測試值 | `npm run dev` 在本機讀這份。 |
| **雲端生產** | **Vercel → Settings → Environment Variables** | ❌（在 Vercel 平台） | **正式生產值（權威來源）** | 線上網站實際用的值。**這份才是真正上線跑的。** |

**為什麼 `.env.example` 是空的？** 因為它進 git、公開可見，不能放金鑰。線上實際用的值全部存在 Vercel 平台（加密），本文檔負責記錄「Vercel 上到底設了什麼」這個可見性缺口。

---

## 二、變數現況總表

公開/機密判定：`PUBLIC_` 前綴 + 社群/GA/LINE 連結為**公開值**（會打包進前端，本就外露，可直接寫）；Resend/Turnstile/Sentry 等為**機密金鑰**（永不寫進本文檔）。

| 變數 | 用途 | 公開/機密 | 目前值 | 已設於 Vercel production |
|---|---|---|---|---|
| `PUBLIC_GA_ID` | Google Analytics 4 追蹤 ID | 公開 | `G-6WM9G6HMGG` | ✅ |
| `PUBLIC_LINE_URL` | LINE 官方帳號連結（CTA） | 公開 | `http://line.me/ti/p/@jfp3998u` | ✅ |
| `PUBLIC_INSTAGRAM_URL` | Instagram（Footer / JSON-LD sameAs） | 公開 | `https://www.instagram.com/jobschool_ig/` | ✅ |
| `PUBLIC_FACEBOOK_URL` | Facebook（Footer / JSON-LD sameAs） | 公開 | `https://www.facebook.com/JobsSchool/?locale=zh_TW` | ✅ |
| `PUBLIC_YOUTUBE_URL` | YouTube（Footer / JSON-LD sameAs） | 公開 | `https://www.youtube.com/@%E8%B3%88%E4%BC%AF%E6%96%AF%E4%B8%AD%E5%B0%8F%E7%8F%AD%E9%AB%98%E4%B8%AD%E6%95%B8%E7%90%86` | ✅ |
| `PUBLIC_GOOGLE_BUSINESS_URL` | Google 商家檔案（Footer / JSON-LD） | 公開 | `https://maps.app.goo.gl/E95P1Mk4JU9PGZAF8` | ✅ |
| `NOTIFY_EMAIL_TO` | 試聽表單收件信箱 | 半公開（信箱） | `hwjnctucsie92@gmail.com` | ✅ |
| `NOTIFY_EMAIL_FROM` | 試聽表單寄件信箱 | 半公開（信箱） | `hwjnctucsie92@gmail.com` | ✅ |
| `RESEND_API_KEY` | Resend 寄信服務金鑰 | 機密 | 未設定 | ❌ |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile 後端密鑰 | 機密 | 未設定 | ❌ |
| `PUBLIC_TURNSTILE_SITE_KEY` | Turnstile 前端 site key | 公開 | 未設定 | ❌ |
| `SENTRY_DSN` | Sentry 錯誤監控（後端） | 機密 | 未設定 | ❌ |
| `PUBLIC_SENTRY_DSN` | Sentry 錯誤監控（前端） | 公開 | 未設定 | ❌ |
| `PUBLIC_CLARITY_ID` | Microsoft Clarity 行為分析 | 公開 | 未設定 | ❌ |
| `PUBLIC_META_PIXEL_ID` | Meta Pixel（廣告再行銷） | 公開 | 未設定 | ❌ |
| `PUBLIC_GSC_VERIFICATION` | Google Search Console 驗證 meta | 公開 | 未設定 | ❌ |
| `PUBLIC_SITE_URL` | 站台 URL（覆寫 astro.config 預設） | 公開 | 未設定（用 `astro.config` 內建 `https://jobsedu.com.tw`） | ❌ |

### `vercel env ls` 實際列到（2026-06-08）

```
NOTIFY_EMAIL_FROM            Encrypted   Production
NOTIFY_EMAIL_TO             Encrypted   Production
PUBLIC_GOOGLE_BUSINESS_URL  Encrypted   Production
PUBLIC_YOUTUBE_URL          Encrypted   Production
PUBLIC_FACEBOOK_URL         Encrypted   Production
PUBLIC_INSTAGRAM_URL        Encrypted   Production
PUBLIC_LINE_URL             Encrypted   Production
PUBLIC_GA_ID                Encrypted   Production
```

共 8 個，全部位於 **Production** 環境。與本 session 設定清單**完全相符，無出入**。
（Vercel 一律將值標示為 `Encrypted`，不會吐出明文——這是正常且正確的；本文檔的「目前值」欄是另外記錄的公開值。）

> 備註：Preview / Development 環境目前**未單獨設定**任何變數。若日後要讓 preview deploy 也有這些值，需 `vercel env add <NAME> preview`。

---

## 三、如何更新

**新增/修改一個變數（CLI）：**

```bash
vercel env add <NAME> production      # 互動式貼上值
vercel env rm  <NAME> production      # 移除
vercel env ls                          # 確認現況
```

**或用 Vercel 後台：** 專案 → Settings → Environment Variables。

**更新後務必：**
1. 同步更新本文檔（總表的「目前值」與「已設於 Vercel production」欄）。
2. 若是新變數，記得也在 `.env.example` 加一行空佔位（含註解），讓本地開發者知道有這變數。
3. 改 env 後 Vercel 不會自動重部署，需 redeploy 才生效。
