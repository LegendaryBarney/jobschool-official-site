# PROGRESS — 工作進度與斷點（接手 session 先讀這裡）

> 跨 session 的權威斷點檔。**任何新 session 啟動時，讀完 CLAUDE.md 後立刻讀本檔**，
> 即可知道：做到哪、有哪些設置、業主拍板了什麼、下一步、待決策。
> 記憶另存於 `~/.claude/projects/<本專案>/memory/`（索引 MEMORY.md，每 session 自動載入）。

最後更新：2026-06-05（夜跑編排 dry-run 驗證通過、揪出 2 問題）

---

## 0. 業主工作模式（最高層）

- **我是「代理業主 / orchestrator」**：規劃、切割、實作、測試都**派 subagent 做**；我只定義工作、發包（因 subagent 不能再生 subagent，fan-out 由我代發）、驗收、回報。把 context 留給決策。
- 業主只做決策，不做苦工。需要決策時一次彙整（選項＋量化代價＋推薦）。繁體中文、直接、不 hedge。
- 紅線：永遠 feature branch；push main / `vercel --prod` / 改 DNS = 正式上線級，**夜間/headless 絕對禁止**，要業主白天親自確認。

---

## 1. 已拍板決策（locked）

| 項目 | 決定 |
|---|---|
| 首頁設計方向 | **D**＝C 黑板手感 × A 編輯誌字體 × B 師資卡/常駐試聽鈕。hero 標題須**實心**（非中空描邊） |
| 夜跑分支策略 | **常駐滾動分支 `feat/night`**：只從 main 開一次，之後每晚在它上面續做、累積 PROGRESS → 跨晚 resume 成立；業主隨時 review、準備好才 PR 進 main |
| 夜跑 token 上限 | **1,500,000 / 晚**（用完即收工） |
| 夜跑並行度 | 3 |
| 夜跑 model | 混搭：規劃/切割/測試 haiku·sonnet，實作/收斂 opus |
| 夜跑停止時點 | **早上 07:00**（02:00 起跑）；未完成**自動隔晚續做、不重做已完成項** |
| commit 粒度 | 每工作項一 commit，訊息帶 task ID：`night(Tn): …`（= 完成的持久標記） |
| 失敗策略 | 實作/測試各重試 1 次，仍失敗即記錄跳過、隔晚續做 |
| 自動 preview deploy | 預設關，由 KICKOFF `allow_preview_deploy` 控制 |
| 登入狀態 | gh ✓（LegendaryBarney）、vercel ✓ 已登入 |

待業主決策（擱置）：DNS 切換時點、Decap CMS 登入後端、Resend/Turnstile/Sentry/GA4 正式金鑰（見 CLAUDE.md §5）。

---

## 2. 已完成（commit 都在 `feat/home-d-redesign`，**尚未 push、尚未 merge main**）

- **自動化地基** `c843774`
  - `.claude/settings.json`：夜跑 allow 白名單 + production/破壞性操作 deny。
  - `.claude/hooks/guard.mjs`：PreToolUse 守門（擋 force push / push main / 在 main 上 push / reset --hard / clean -f / 刪遠端分支 / vercel prod 類）。實測通過。
  - `.claude/scripts/night-run.ps1`：夜跑啟動器。
  - Windows 排程 `JobschoolNightRun`（每日 02:00，**目前停用中**）。
  - `.gitignore` 放行 `.claude/{settings.json,hooks,scripts,workflows}` 進版控。
- **首頁改版 D** `5694286`
  - `src/pages/index.astro` 重寫為 D 版型，資料綁 content collections（課程/師資/見證/文章）。
  - 黑板 hero（純 CSS 實心 clip-reveal 標題 + 焦糖金手繪底線 + 科目跑馬燈）、編輯誌章節號、數學符號粉筆課程卡、B 式深色塊師資卡、黑板感試聽 CTA。
  - `Fonts.astro` 補 Noto Serif TC 900；`Button.astro` 加深底 `outline-chalk` variant。
  - 測試 subagent 驗收 **7/7 PASS**（標題實心無描邊、check/build 全綠、RWD 正常）。
- **夜跑編排系統** `542284d`
  - `.claude/workflows/night-orchestrate.mjs`：Workflow 編排（PLANNER→SPLITTER→pipeline 實作測試→INTEGRATOR 收斂→REPORTER）。
  - `KICKOFF.template.md`、`docs/NIGHT_RUN_DESIGN.md`。
  - 07:00 停 + 跨晚 resume（task ID + commit 標記）。

prototypes（home-a/b/c/d.html）與截圖在 `prototypes/`、根目錄 `*.jpeg`（皆 gitignored）。

---

## 3. 夜跑編排 dry-run 結果（2026-06-05）

以單一小任務（新增試聽 FAQ）跨完整鏈，**機制驗證成功**：PLANNER→SPLITTER→實作(opus,worktree)→測試(sonnet)→INTEGRATOR→push→REPORTER 全通；build 綠；326K tokens；queue-empty 收工。

**揪出 2 個待修問題：**
1. **Workflow 不能用 name 叫**（只有 built-in 可）。`night-run.ps1` 的 prompt 要改成用 **scriptPath** `.claude/workflows/night-orchestrate.mjs`，否則真夜跑會失敗。
2. **分支策略缺陷** → 已拍板改為常駐 `feat/night`（見 §1）。原本每晚從 main 切 per-date 分支會讓跨晚 resume 失效、PROGRESS 分岔。需改：night-orchestrate.mjs 與 night-run.ps1 改用/續用 `feat/night`（不存在才從 main 建）、REPORTER **commit** PROGRESS 更新、PROGRESS 追加不覆寫、收尾不把共用工作樹遺留在別的分支（或至少明確記錄）。

dry-run 殘留物（待清理/併入）：分支 `feat/night-2026-06-05`（本地+遠端，含 FAQ commit `dbd5770`）、根目錄 `KICKOFF.md`（dry-run 任務書，**應刪掉**避免誤觸發）、`PROGRESS.dryrun-reporter.txt`（REPORTER 當時寫的報告，可參考後刪）。FAQ 內容（試聽免費/不逼當天決定）本身可用，之後可在 feat/night 重做或 cherry-pick。

---

## 4. 下一步（依序）

1. **派 fix subagent** 修 §3 的 2 問題（scriptPath + feat/night 滾動分支 + REPORTER commit PROGRESS）。
2. 修好後**再跑一次 dry-run** 驗證 feat/night 滾動分支 + 跨晚 resume（連續兩任務或兩次跑驗證去重）。
3. 通過後：清理 dry-run 殘留、push `feat/home-d-redesign`、（業主白天）決定是否 PR 首頁改版進 main。
4. 啟用排程 `JobschoolNightRun`（業主說 go 才啟用）。
5. 低優先：數據區 CountUp 啟動延遲微調（`src/components/CountUp.tsx` threshold）。
6. 後續內容工：known_errors.md 一票事實/排版錯誤（價格 9300/12 節、科目對師、開業最多 12 年、班級人數、課程頁排版、導覽列底線跟頁籤）——可寫進 KICKOFF 交夜跑。

---

## 5. 重要檔案地圖（接手者按圖索驥）

- 協定/紅線：`CLAUDE.md`｜品牌驗收：`BRAND_GUIDELINES.md`｜規格：`WEBSITE_RFP.md`｜內容地雷與事實更正：`known_errors.md`
- 權限/安全：`.claude/settings.json`、`.claude/hooks/guard.mjs`
- 夜跑：`.claude/scripts/night-run.ps1`（啟動器）、`.claude/workflows/night-orchestrate.mjs`（編排）、`KICKOFF.template.md`（任務書範本）、`docs/NIGHT_RUN_DESIGN.md`（架構）
- 設計定案：本檔 §1 + 記憶 `project_home_design`；prototype `prototypes/home-d.html`
- 記憶：`~/.claude/projects/<本專案>/memory/MEMORY.md`（索引）

---

## 6. 夜跑執行記錄（2026-06-05 — 常駐滾動分支 feat/night）

### 任務消化狀態

| ID | 標題 | 結果 | 說明 |
|---|---|---|---|
| T1 | night(T1): 新增一則「試聽」FAQ | ✅ done | 全部 6 條驗收項目均通過。trial-decision.md 已正確建立於 src/content/faq/；front-matter 欄位完整（question、category="試聽"、order=3）；內文無任何禁用詞彙；npm run check 0 errors/0 warnings（4 hints 為既有元件的預存問題）；npm run build 全綠完成；git log 確認 commit night(T1) 存在且為最新提交（1aa2e43）。 |

### 卡在哪 / 下一步 / 預算

- **無卡點**：全任務清單已完成（queue-empty）。
- **下一步**（業主決策）：待業主確認是否推進夜跑編排系統第 2 輪的生產驗證（見舊 PROGRESS §4-1）。
- **待決策**：無。
- **預算**：Token 消耗 398K / 1.5M cap（26.5%）；終止條件 queue-empty（任務清單已全數處理）。

### 跨晚待續隊列（carryover）

無。所有排定任務於本晚完成。

---

## 7. 夜跑執行記錄（2026-06-05 — 常駐滾動分支 feat/night）

### 任務消化狀態

| ID | 標題 | 結果 | 說明 |
|---|---|---|---|
| T1 | night(T1): 新增一則「試聽」FAQ | ⏭ 已於先前夜跑完成 | 本晚編排隊列為空。前次夜跑（2026-06-05）已完成 T1，commit 1aa2e43 存在於 feat/night 分支。本晚無新任務分配。 |

### 卡在哪 / 下一步 / 預算

- **無卡點**：編排隊列為空（`status: "no-tasks"`），無待執行任務。
- **下一步**（業主決策）：待業主下達新的夜跑任務書（經由 KICKOFF.md），或繼續推進優先順序 §4 的工作項（修 Workflow scriptPath + 分支策略 + 重新 dry-run + 清理殘留 + 推進首頁改版驗收）。
- **待決策**：無。
- **預算**：Token 消耗 <10K（報告掃檔）/ 1.5M cap；終止條件 queue-empty（任務清單為空）。

### 跨晚待續隊列（carryover）

無。夜跑機制驗證已通過、隊列為空。所有待做項已記入 PROGRESS.md §4「下一步」，由白天決策。
