# CLAUDE.md — 賈伯斯數理教室官網（jobschool-official-site）

> 本檔案是跨 session 的常駐工作協定。每次 session 開始時以本檔為最高指導原則。
> Repo：https://github.com/LegendaryBarney/jobschool-official-site

## 0. 先讀什麼

依序快速掃過（不要逐字精讀，抓結構即可）：

1. `README.md` — 技術棧與本機開發流程
2. `BRAND_GUIDELINES.md` — 品牌 VI 與 Tone of Voice（**所有視覺與文案的驗收標準**）
3. `WEBSITE_RFP.md` — 完整規格
4. `known_errors.md` — 已知地雷，動工前必看
5. `PROGRESS.md`（若存在）— 上次工作進度，從斷點接續

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

業主會用 Windows 工作排程器在凌晨以 headless 模式（`claude -p`）執行本專案的批次工作：

- **任務書 = `KICKOFF.md`**（專案根目錄）：當晚要完成的具體任務清單，由業主或白天 session 寫好。
- **進度檔 = `PROGRESS.md`**：每完成一個階段就更新（做了什麼、卡在哪、下一步）。中斷後重跑要能從斷點接續，不重做已完成的步驟。
- 夜間模式只允許：寫 code、commit、push feature branch、preview deploy、截圖驗證、跑檢查。
- 夜間模式禁止:任何 production 操作、任何需要業主決策的不可逆動作。遇到就寫進 PROGRESS.md 的「待決策」清單，留給白天。

## 4. Roadmap（按順序接手）

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

- 自訂網域 `jobsedu.com.tw` 的 DNS 切換時點（仍指向舊 Weebly 站期間，不要動 DNS）。
- Decap CMS 的登入後端方案（本機測試用 `test-repo` 即可）。
- Resend / Turnstile / Sentry / GA4 的正式金鑰（試聽表單未串接前可留空）。
