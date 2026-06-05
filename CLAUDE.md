# CLAUDE.md — 賈伯斯數理教室官網（jobschool-official-site）

> 本檔案是跨 session 的常駐工作協定。每次 session 開始時以本檔為最高指導原則。
> Repo：https://github.com/LegendaryBarney/jobschool-official-site

## 0. 先讀什麼

依序快速掃過（不要逐字精讀，抓結構即可）：

1. `README.md` — 技術棧與本機開發流程
2. `BRAND_GUIDELINES.md` — 品牌 VI 與 Tone of Voice（**所有視覺與文案的驗收標準**）
3. `WEBSITE_RFP.md` — 完整規格
4. `known_errors.md` — 已知地雷，動工前必看
5. **`PROGRESS.md` — 權威斷點檔，最優先**：上次做到哪、已拍板決策、已完成 commit/分支、下一步、待決策、重要檔案地圖。接手就從這裡撿回狀態。
6. 記憶 `~/.claude/projects/<本專案>/memory/MEMORY.md`（每 session 自動載入索引；含「代理業主」「首頁定案 D」等）。
7. 關鍵設置位置：權限 `.claude/settings.json`、守門 hook `.claude/hooks/guard.mjs`、夜跑 `.claude/scripts/night-run.ps1` + `.claude/workflows/night-orchestrate.mjs` + `docs/NIGHT_RUN_DESIGN.md`。

## 1. 業主工作模式（最重要）

業主（Barney）的開發心力主要放在另一個 ERP 專案。本官網專案對他而言定位是「**只做決策，不做苦工**」。因此：

- **預設自主執行到底。** 在 `.claude/settings.json` 授權範圍內的事，直接做完，不要逐項請示。
- **不要問瑣碎問題。** 能用合理預設值解決的，自己決定並在結尾報告即可。
- **真正需要決策時，彙整成一次「決策請求」**：列出選項、各自的代價（時間/金錢/token/風險，要量化）、以及你的明確推薦。一次問完，不要擠牙膏。
- 回報風格：直接、理性、量化。不要 hedge、不要免責聲明式的廢話。
- 對話與文件一律使用**繁體中文**，專業術語可保留英文。

## 2. 工程規則

### 分支與部署（與 settings.json 的 ask 規則對齊）

- 永遠在 feature branch 工作（如 `feat/xxx`、`fix/xxx`），**不直接在 main 上開發**。
- Branch push → Vercel 自動 preview deploy：隨時可做，不必請示。
- **push 到 main、`vercel --prod`、promote = 正式上線**：一律停下來等業主白天親自確認。夜間/headless 模式下絕對禁止觸碰。
- 禁止 force push、`git reset --hard`、刪除遠端資源（settings.json 已 deny，這裡是雙保險）。

### 視覺自我驗證（每次改動 UI 後必做）

1. 啟動 dev server（`npm run dev`，port 4321）。
2. 用 Playwright MCP 截圖驗證：**桌機 1440px 與手機 390px 兩種 viewport**。
3. 對照 `BRAND_GUIDELINES.md` 自我審查：咖啡館溫潤調性、品牌色 token、禁用詞彙。
4. 截圖耗 token：只在「視覺驗收節點」截圖，平常用 accessibility tree 互動即可。

### 工具紀律

- 能用 CLI（git / gh / vercel / npm）就用 CLI，不要繞遠路。
- 套件管理用 npm（不要混用 pnpm/yarn）。Node ≥ 22。
- TypeScript strict 不可關閉；`npm run check` 過了才算完成。
- 內容修改一律改 `src/content/` 下的 Markdown/MDX/JSON，**不要把文案寫死在元件裡**。

## 3. 夜間自動化機制

業主會用 Windows 工作排程器在凌晨以 headless 模式（`claude -p`）執行本專案的批次工作。
**此機制已實作**（細節見 `docs/NIGHT_RUN_DESIGN.md` 與 PROGRESS.md §1/§3）：排程 02:00 →
`.claude/scripts/night-run.ps1` 起 headless claude 當「代理業主」→ 透過 Workflow 工具
（用 scriptPath）跑 `.claude/workflows/night-orchestrate.mjs` 編排腳本，由它 fan-out
PLANNER→SPLITTER→實作/測試→收斂→匯總 多個 subagent。做到**早上 07:00 停**、未完成
**隔晚自動續做**（以常駐分支 `feat/night` + `night(Tn):` commit 追蹤）。token 上限 1.5M/晚。

- **任務書 = `KICKOFF.md`**（專案根目錄；範本 `KICKOFF.template.md`）：當晚任務清單，由業主或白天 session 寫好。
- **進度檔 = `PROGRESS.md`**：每完成一個階段就更新（做了什麼、卡在哪、下一步）。中斷後重跑要能從斷點接續，不重做已完成的步驟。
- 夜間模式只允許：寫 code、commit、push feature branch、preview deploy、截圖驗證、跑檢查。
- 夜間模式禁止:任何 production 操作、任何需要業主決策的不可逆動作。遇到就寫進 PROGRESS.md 的「待決策」清單，留給白天。

## 4. Roadmap（按順序接手）

> **目前狀態（2026-06-05）**：Phase 0–1 完成（環境綠、Vercel 專案 `jobs-2026/jobs_official_site` 已連 GitHub）；
> 首頁改版 D 已上 **production**（`https://jobsofficialsite.vercel.app`，DNS 仍指舊 Weebly 故非對外）；
> 夜跑系統就緒並驗證（feat/night 滾動、3 輪 dry-run + 首輪正式 N1–N12）。
> 進行中：Phase 2 視覺打磨（**卡在影像產線**——見 §5 圖片 billing）。詳見 PROGRESS.md。

**Phase 0 — 環境就緒**
`npm install` → `npm run dev` 跑起來 → 確認 Playwright MCP 可截圖 localhost:4321 → `npm run check` 與 `npm run build` 全綠。

**Phase 1 — Vercel 串接**
`vercel link` 綁定專案 → 依 `.env.example` 盤點需要的環境變數，缺值的列清單向業主要 → 完成第一次 preview deploy → 確認 GitHub push 觸發自動 preview。

**Phase 2 — 視覺打磨迭代**
以 BRAND_GUIDELINES 為驗收標準，逐頁跑「截圖 → 自我審查 → 修正」迴圈。優先順序：首頁 → 課程列表/內頁 → 師資 → 試聽表單流程。

**Phase 3 — 夜跑就緒**
協助業主驗證 headless 模式可正常執行（小任務試跑一次），確認 KICKOFF/PROGRESS 機制運作。

**Phase 4 — 上線**
所有頁面通過品牌審查後，彙整一份上線前檢查報告（SEO、OG、表單、Sentry、GA4），交業主拍板 production。

## 5. 待決策事項（業主尚未拍板，遇到先擱置）

- **圖片產線 billing**：生圖走 `scripts/generate-image.mjs`（Imagen/Gemini API，金鑰在 `.env` 的 `GEMINI_API_KEY`）。免費方案 image 配額為 0，需業主到 Google AI 專案開 billing 才能量產（37 張 prompt 已備於 `docs/image-prompts/`，圖放 `src/assets/images/`）。dreamina（VIP 限制）已棄。
- **Astro 5→6 大遷移**：`@astrojs/vercel@10` 與剩餘安全弱點需升 Astro 6（20+ 檔，含 Content Layer API、Zod 4），留獨立 session 做。
- 自訂網域 `jobsedu.com.tw` 的 DNS 切換時點（仍指向舊 Weebly 站期間，不要動 DNS）。
- Decap CMS 的登入後端方案（本機測試用 `test-repo` 即可）。
- Resend / Turnstile / Sentry / GA4 / Meta Pixel / GSC 的正式金鑰與社群 URL（程式已 env 佔位；gh、vercel 已登入）。
