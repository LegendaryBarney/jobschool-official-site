# NIGHT_RUN_DESIGN — 夜間無人化多 Agent 編排架構設計

> 對象：白天 session 的 orchestrator claude、業主（Barney）。
> 目的：讓夜跑從「單一 `claude -p` 讀 KICKOFF 跑一下就停」升級為「會規劃、會切割、會平行發包、會逐項驗收、跑到清單清空 / 預算用盡 / 早上 07:00 才停，且未完成項隔晚無痛接續」的多 agent 編排系統。
> 最高指導原則仍是 `CLAUDE.md`；本文件只描述機制，不改既有紅線。

---

## 0. 設計前提與既有約束（先對齊）

| 約束 | 來源 | 對設計的影響 |
|---|---|---|
| subagent 不能再生 subagent | 平台限制 | **所有 fan-out 必須由頂層 claude（orchestrator）發起**。Workflow 腳本就是頂層的 fan-out 工具。 |
| 併發上限 ≈ min(16, cores−2) | Workflow runtime | 本機 8 核 → 實際上限 **6**。建議夜跑用 3–4，留餘裕給 dev server / 截圖。 |
| Workflow 腳本無檔案系統 API | Workflow runtime | 腳本本身不能讀寫檔；**所有讀檔/寫檔/跑指令都要透過 `agent()` 內的 subagent 做**。 |
| 紅線由 `guard.mjs` + settings.json deny 雙重攔截 | 既有機制 | 設計上仍要主動避開（不依賴 hook 兜底）；subagent 繼承同一套 hook 與權限。 |
| 永遠 feature branch，禁 push main / vercel prod / 動 DNS | CLAUDE.md §2 | 夜跑只在單一 feature branch 收斂；preview deploy 為可選且預設關閉（見 §5、§10）。 |
| 需要業主決策的不可逆動作一律擱置 | CLAUDE.md §3 | 寫進 PROGRESS 的「待決策」，絕不自行拍板。 |

---

## 1. 整體架構

### 1.1 角色分層

```
Windows 工作排程器 (02:00)
   └─ night-run.ps1  (headless 啟動器)
        └─ claude -p  ◀── 頂層 ORCHESTRATOR（代理業主）
             │  職責：讀 CLAUDE.md/PROGRESS、決定是否有任務、呼叫 Workflow、
             │        最後彙整、寫 PROGRESS、commit、(可選)preview deploy。
             │  不自己寫 code、不自己跑大段實作 → 全部發包給 subagent。
             │
             └─ Workflow(orchestrate.mjs)  ◀── 編排腳本（純 JS，頂層的 fan-out 引擎）
                  │
                  ├─ phase「規劃」 → agent: PLANNER（1 個）
                  │      讀 KICKOFF + PROGRESS + 現況 → 產出當晚計畫（結構化）
                  │
                  ├─ phase「切割」 → agent: SPLITTER（1 個）
                  │      把計畫拆成可平行/序列的 work items，各帶驗收標準
                  │
                  ├─ phase「執行」 → pipeline(workItems, IMPLEMENT, TEST)
                  │      每個 item 獨立走：實作 subagent →(worktree 隔離)→ 測試 subagent
                  │      可平行者由 pipeline 併發消化；序列依賴者排在後批
                  │
                  ├─ phase「收斂」 → agent: INTEGRATOR（序列，1 個）
                  │      逐一把通過驗收的 worktree 變更合併回 feature branch
                  │
                  └─ phase「匯總」 → agent: REPORTER（1 個）
                         更新 PROGRESS（做了什麼/卡在哪/下一步/待決策）+ 產出夜跑摘要
```

### 1.2 職責邊界（誰做什麼、誰不做什麼）

| 角色 | 做 | 不做 |
|---|---|---|
| **night-run.ps1** | 設定環境、起 headless claude、收 log、設總 timeout | 不含任何業務邏輯 |
| **Orchestrator（頂層 claude）** | 判斷有無任務、呼叫 Workflow、解讀 Workflow 回傳、最終 commit / PROGRESS / 可選 preview | 不親自寫 code（避免佔用頂層 context；交給 subagent） |
| **Workflow 腳本** | 純編排：排 phase、決定平行/序列、傳遞結構化資料、控重試與 budget | 不碰檔案系統、不下 git 指令（都委派 agent） |
| **PLANNER** | 把 KICKOFF 轉成可執行計畫 | 不實作 |
| **SPLITTER** | 切 work items + 標平行性 + 寫驗收標準 | 不實作 |
| **IMPLEMENT(每項一個)** | 在自己的 worktree 改檔、`npm run check` 自測 | 不 commit 到 feature branch（交 INTEGRATOR）、不 push |
| **TEST(每項一個)** | 對該 item 跑驗收（check/build/截圖/grep 事實） | 不修 code（失敗回報，由 orchestrator 決定重試/跳過） |
| **INTEGRATOR** | 序列合併各 worktree → feature branch、解衝突、清 worktree | 不 push main、不 prod |
| **REPORTER** | 寫 PROGRESS、整理待決策、輸出摘要 | 不拍板決策 |

---

## 2. KICKOFF.md 規格

業主或白天 session 把「當晚要做什麼」寫進專案根目錄 `KICKOFF.md`。PLANNER 依固定區塊解析；**格式要結構化，否則 PLANNER 只能猜**。

### 2.1 結構（YAML front-matter + 任務區塊）

```markdown
---
night: 2026-06-10
budget_tasks: 8          # 今晚最多消化幾個 work item（軟上限，超過寫進 PROGRESS 留隔天）
max_parallel: 3          # 覆寫預設並行度（不填用預設 3）
allow_preview_deploy: false   # 是否允許收斂後做 preview deploy（預設 false）
branch: feat/night-2026-06-10 # 指定夜跑 feature branch（不填則 orchestrator 自動命名）
---

# 今晚任務書

## 任務 T1：修正首頁 hero 文案的禁用詞
- 目標：移除 BRAND_GUIDELINES 禁用詞彙，改為咖啡館溫潤語氣
- 檔案範圍：src/content/ 首頁相關 markdown（不碰元件）
- 驗收標準：
  - [ ] grep 不到禁用詞清單中任何一詞
  - [ ] npm run check 綠
- 優先序：P0
- 可平行：是（與 T2、T3 無檔案重疊）

## 任務 T2：補課程內頁 SEO meta description
- 目標：每個 courses/*.md 都有 50–120 字 description
- 驗收標準：
  - [ ] 所有 courses/*.md front-matter 有 description 欄位
  - [ ] npm run build 綠
- 優先序：P1
- 可平行：是

## 任務 T3：師資頁手機版排版錯誤（known_errors.md #4）
- 目標：修 390px 下卡片溢出
- 驗收標準：
  - [ ] Playwright 390px 截圖無水平捲軸
  - [ ] npm run check 綠
- 優先序：P1
- 可平行：否（會動到共用元件，與其他改元件的任務序列化）

## 禁止事項（本晚特別註明）
- 不要動 astro.config.mjs 的 site URL
- 不要改 .env / 任何金鑰
```

### 2.2 PLANNER 解析契約

PLANNER 必須輸出符合下列 schema 的物件（供 SPLITTER 使用）：

```json
{
  "night": "2026-06-10",
  "budgetTasks": 8,
  "maxParallel": 3,
  "allowPreviewDeploy": false,
  "branch": "feat/night-2026-06-10",
  "globalForbidden": ["不動 astro.config site", "不改 .env"],
  "tasks": [
    {
      "id": "T1",
      "title": "...",
      "goal": "...",
      "fileScope": ["src/content/..."],
      "acceptance": ["grep 不到禁用詞", "npm run check 綠"],
      "priority": "P0",
      "parallelizable": true
    }
  ]
}
```

**容錯規則**：KICKOFF 不存在或沒有任何 `## 任務` 區塊 → PLANNER 回 `{ tasks: [] }`，orchestrator 在 PROGRESS 記一行「夜跑：無任務」後結束（沿用既有行為，不自行發想新任務）。

---

## 3. PROGRESS.md 更新協定

PROGRESS 是 resume 的唯一真相來源。協定如下：

### 3.1 每晚一個區塊，內含逐項狀態表

REPORTER 在 PROGRESS 末尾追加：

```markdown
## 2026-06-10 — 夜跑（branch: feat/night-2026-06-10）

### 任務消化狀態
| id | 標題 | 結果 | 說明 |
|----|------|------|------|
| T1 | 首頁禁用詞 | ✅ done | 已合併，commit abc123 |
| T2 | 課程 SEO meta | ✅ done | 已合併，commit def456 |
| T3 | 師資手機版 | ⏭ skipped | 連 2 次測試失敗（截圖仍有水平捲軸），詳見下方卡點 |

### 卡在哪
- T3：390px 下 .teacher-card grid 仍溢出，疑似 BaseLayout padding；嘗試過 min-w-0 無效。

### 下一步
- T3 留隔天：建議改查 src/layouts/BaseLayout 的 container padding。

### 待決策（留白天，勿自行拍板）
- （本晚無）

### 預算
- 消化 2/3 task，token 用量約 N，止於 T3 失敗跳過（非預算耗盡）。
```

### 3.2 跨晚 resume（task ID + commit 標記 + PLANNER 去重）

夜跑於 07:00 被硬停（或 token 預算耗盡提前收尾）時，沒做完的工作要「隔天晚上接著做、不重做已完成的項目」。機制以 **task ID + commit 標記** 為持久真相，三段協作：

1. **持久完成標記（ground truth = git）**：每個工作項通過後，IMPLEMENT 在自己的 worktree commit、INTEGRATOR 合回 feature branch 時，commit message 第一行**必帶 task ID**，格式 **`night(<TASK_ID>): <摘要>`**（例 `night(T2): 課程 SEO meta`，結尾仍加 `Co-Authored-By`）。
   - 關鍵性質：即使 07:00 被 `night-run.ps1` 硬殺、REPORTER 沒跑到、PROGRESS 沒寫完，這個 commit 仍落在夜跑 feature branch 上。**git 是 ground truth，PROGRESS 只是人類可讀的鏡像**；兩者衝突時以 git log 為準。
2. **PLANNER 去重**：每晚開工，PLANNER 讀 KICKOFF + CLAUDE.md + PROGRESS.md，並**額外讀夜跑 feature branch 的 git log**（`git log --format=%s <branch>`）。完成集合 `doneSet` = ①git log 中出現過的 `night(<id>):` task ID ∪ ②PROGRESS 最近夜跑區塊標 `✅ done` 的 id。
   - milestones **只放「KICKOFF 有列、但 id 不在 doneSet」** 的任務（未完成 / 失敗待重試 / 從未動過）；已完成者一律排除，不重做。
   - PLANNER 明確輸出兩個清單：`tonightTasks`（本晚要做的 task id）與 `skippedDone`（已完成而跳過的 task id），供 log 與 REPORTER 對照。
   - 若 KICKOFF 全部任務都已在 doneSet → `hasTasks=false`，當晚只記一行「全部任務已於先前夜跑完成」後結束。
3. **carryover（跨晚待續隊列）**：REPORTER 寫 PROGRESS 時輸出獨立的「跨晚待續隊列」小節，逐項列出**未完成 / 失敗的 task ID + 原因 + 下一步**（同時填進結構化的 `carryover[]` 回傳欄位），明確標示「以下會在隔天晚上自動接續，已完成的不會重做」，方便隔晚接續與業主檢視。

- **停在哪、下次從哪續 = 由 task ID 完成集合決定**：Execute 迴圈遇 budget 超標或某項失敗時，已完成項的 commit 不受影響；resume 不是「從頭重跑」，而是隔晚 PLANNER 用 doneSet 去重後只跑剩下的。
- **冪等寫法要求**：每個 IMPLEMENT subagent 開工前先 `git status` 檢查該 item 是否已部分完成，避免重覆套用。
- **task ID 穩定性**：KICKOFF 的 task ID 一旦寫定不可更改（改了會被當成新任務重做）。業主可跨晚沿用同一份 KICKOFF.md，系統自行去重。

---

## 4. 平行衝突處理

### 4.1 什麼可平行、什麼必須序列

| 類型 | 範例 | 策略 |
|---|---|---|
| 純內容、檔案不重疊 | 各自改不同 `src/content/**/*.md` | **可平行**（worktree 隔離） |
| 改共用元件 / layout / global.css | 兩個任務都動 `BaseLayout` 或 Tailwind theme | **序列**（避免合併衝突） |
| 動 config（astro.config、package.json） | 加 integration、改 script | **序列且單獨一批**（高衝突風險） |
| 依賴前一項產出 | 「先建元件再用它」 | **pipeline 排序**或拆兩批 |

判定來源：SPLITTER 看 `fileScope` 是否交集 + KICKOFF 的「可平行」提示。**fileScope 有交集 → 強制序列**（保守優先，寧可慢不要衝突）。

### 4.2 worktree 隔離策略

- 每個可平行的 IMPLEMENT subagent 用 `isolation:'worktree'` 取得獨立 git worktree（從同一 feature branch base 切出），各自改檔互不干擾。
- worktree 內 IMPLEMENT 只「改檔 + 自測 `npm run check`」，**不 commit 到 feature branch、不 push**。
- 產出交接：IMPLEMENT 回傳「改了哪些檔 + diff 摘要 + worktree 路徑/分支」結構化物件給腳本。

### 4.3 收斂回單一 feature branch

由 **INTEGRATOR（序列，單一 agent）** 統一合併，避免並行寫同一分支：

1. 切回主 feature branch。
2. 按優先序逐一合併各通過驗收的 worktree（`git merge` 或 `git cherry-pick` 該 worktree 的暫存 commit）。
3. 每合併一項後跑一次 `npm run check`，綠了才合下一項（早發現衝突）。
4. **衝突處理**：
   - 自動可解（不同檔/不同段）→ 直接合。
   - 內容衝突且該項是純文字 → INTEGRATOR 嘗試一次手動三方合併。
   - 仍衝突 → **不硬解**，該 item 標 `❌ conflict`、保留其 worktree branch、寫進 PROGRESS 待決策/隔天，繼續合其餘項。一項衝突不拖垮整批。
5. 全部合完 → 清理已併入的 worktree（保留失敗/衝突的供白天檢查）。

> 設計取捨：之所以「IMPLEMENT 不自己 commit、集中由 INTEGRATOR 合」，是因為並行多 worktree 同時 commit 同一分支會競態。集中收斂雖序列、慢一點，但可控、可審、好 resume。

---

## 5. git / 分支 / 部署策略

- **分支**：夜跑只在一條 feature branch（KICKOFF 指定或 orchestrator 自動命名 `feat/night-YYYY-MM-DD`）。worktree 從它切出、合回它。
- **commit 粒度**：預設 **每項通過驗收即 commit 一個**，好追溯、好 resume、好 revert。匯總式 single commit 為備選（見 §10 決策點）。
- **commit 訊息帶 task ID（跨晚 resume 的完成標記）**：訊息第一行格式 **`night(<TASK_ID>): <摘要>`**（例 `night(T1): 首頁禁用詞修正`）。這是隔晚 PLANNER 用 `git log` 判定「已完成而跳過」的 ground truth（見 §3.2）；硬殺也不丟。INTEGRATOR 合回 feature branch 時須保留此格式。
- **commit 署名**：依 CLAUDE.md，commit message 結尾加 `Co-Authored-By` 行。
- **push**：只 push feature branch（`git push -u origin feat/...`，guard 會擋 main）。push 時機：所有可合的 item 收斂完、PROGRESS 更新後，一次 push。
- **preview deploy**：**預設關閉**。僅當 `KICKOFF.allow_preview_deploy: true` 且 push 成功時，orchestrator 才跑 `vercel`（非 --prod）產 preview，URL 記入 PROGRESS。
- **紅線（主動避開，不靠 hook 兜底）**：
  - 不 `git push origin main` / 不在 main 開發（夜跑第一步就 `git switch -c`）。
  - 不 `vercel --prod` / promote / rollback / alias / dns / domains / remove。
  - 不碰 DNS、不寫 `.env`、不刪遠端資源、不 force push、不 reset --hard。

---

## 6. 安全與待決策

### 6.1 夜跑「絕對不做」清單

1. 任何 production：push main、`vercel --prod`、promote、rollback、alias。
2. 任何 DNS / domain 操作（`jobsedu.com.tw` 仍指向舊站期間）。
3. 寫 / 改 `.env*`、`secrets/**`、任何金鑰。
4. force push、`reset --hard`、`clean -f`、刪遠端分支、`rm -rf`。
5. 任何「需要業主主觀決策」的不可逆動作（改品牌色定義、刪內容、改網域、啟用付費服務）。
6. 自行發想 KICKOFF 以外的新任務（無任務就結束，不擴張範圍）。
7. `gh auth login` / `vercel login` 等一次性互動認證（headless 會卡死；缺認證就記 PROGRESS 待業主）。

### 6.2 待決策一律寫進 PROGRESS

遇到上述 5、或任何取捨不明的點 → REPORTER 寫入該晚「待決策」清單（描述 + 選項 + 影響），絕不替業主拍板。

---

## 7. 不會「跑一下就停」的機制

核心是 **work queue 消化到空 + 逐項把關 + 預算上限 + 07:00 停止時點**，任一觸發才停；被停下時未完成項由 §3.2 的跨晚 resume 隔晚接續。

- **隊列驅動**：SPLITTER 產出的 work items 進隊列；pipeline 持續取項執行，直到隊列空或達 `budget_tasks` 軟上限。
- **逐項 IMPLEMENT→TEST 流水線**：用 `pipeline(items, IMPLEMENT, TEST)`，stage 間無 barrier，前項在測時後項可在實作，吞吐高且不會空轉。
- **每項重試 + fallback**（見 §8）：單項失敗不結束整體。
- **token budget 控制**：
  - orchestrator 維護累計 token 估計（每個 agent 回傳後累加）；達 `TOKEN_BUDGET`（建議 800K，見決策點）→ 停止取新項、進收斂/匯總階段，剩餘 item 標 `pending` 留隔天。
  - 每個 subagent 給合理 `model`（規劃/切割/測試用較小模型，實作用較大模型）控成本。
- **停止時點 07:00**：night-run.ps1 動態算「到下一個早上 07:00 的秒數」當 background job 的 timeout（不是固定時長；若手動於白天起跑、現在已過 07:00，則算到隔天 07:00）。Workflow 背景跑、可 resume，07:00 觸發即被硬殺，未完成項下次夜跑用 task ID 去重接續。
- **終止條件（三選一）**：① 隊列清空且全部收斂；② token budget 耗盡；③ 到達停止時點 07:00（被 night-run.ps1 硬殺）。前兩者由 Workflow 內部偵測 → 進 REPORTER 收尾；第三者為外部硬殺（commit 已落地，REPORTER 即使沒跑到，隔晚 PLANNER 仍能由 git log 接續）。**不會無限跑也不會提早停**。

---

## 8. 失敗處理（避免一項拖垮整晚）

逐項採「**重試 → 降級 → 跳過記錄**」階梯：

| 階段 | 失敗 | 處置 |
|---|---|---|
| IMPLEMENT 報錯 | check 不過 / 改不出來 | **重試 1 次**（把錯誤訊息回灌給新的 IMPLEMENT agent）。 |
| 重試仍失敗 | | **降級**：若任務可拆（如「修 5 個檔」），只交付能過驗收的子集，其餘標 partial。不可降級則跳過。 |
| TEST 不過 | 驗收標準未達 | 退回 IMPLEMENT **重試 1 次**；再不過 → 標 `❌ failed`。 |
| INTEGRATOR 合併衝突 | | 試一次三方合併；不成標 `❌ conflict`、保留 worktree、繼續其餘項。 |
| subagent crash / timeout | | 記 `❌ error`，跳過該項，繼續隊列。 |

- **失敗不可逆性**：所有失敗項只「記錄 + 跳過」，**永不**自行擴大權限或硬幹。全部寫進 PROGRESS 的狀態表與卡點，供白天接手。
- **重試上限**：每項實作重試 ≤1、測試重試 ≤1（共 ≤2 次嘗試），避免單項燒光 budget。

---

## 9. night-run.ps1 的改法

從「單一 `claude -p` 讀 KICKOFF 自己做」改成「`claude -p` 當 orchestrator → 呼叫 Workflow 跑編排腳本」。

### 9.1 ps1 改動要點（結構不變，換 prompt + 加參數）

- 保留：`Set-Location`、log 寫 `.claude/logs/`、`Tee-Object`。
- 新增：停止時點 07:00 的 timeout 包裝（job + `Wait-Job -Timeout`），逾時殺掉並在 log 記 `TIMED OUT`。timeout 秒數**動態算到下一個 07:00**（非固定時長）：

  ```powershell
  $now = Get-Date
  $cutoff = (Get-Date).Date.AddHours(7)
  if ($now -ge $cutoff) { $cutoff = $cutoff.AddDays(1) }   # 已過 07:00 → 隔天 07:00
  $TimeoutSec = [int]([math]::Max(60, ($cutoff - $now).TotalSeconds))
  ```
- 換掉 `$Prompt`：改成「orchestrator 指示」，要求頂層 claude 呼叫 Workflow 工具執行 `orchestrate.mjs`，而不是自己動手實作。

### 9.2 新 orchestrator prompt（骨架，繁中）

```
你是賈伯斯數理教室官網夜跑的 ORCHESTRATOR（代理業主），在 Windows headless 模式執行。
最高指導原則：CLAUDE.md。先讀 CLAUDE.md 與 PROGRESS.md。

你本身不寫 code、不跑大段實作；你的工作是「編排與發包」：
1. 用一個 subagent 讀 KICKOFF.md + PROGRESS 最近夜跑區塊 + git log，判斷今晚有哪些「未 done」任務 id。
   若無任務 → 在 PROGRESS 記一行「<日期> 夜跑：無任務」後結束。
2. 確保在 feature branch 上（git switch -c feat/night-<date>，若 KICKOFF 指定則用指定名）。絕不在 main 上動工。
3. 呼叫 Workflow 工具執行編排腳本 orchestrate.mjs，傳入未 done 任務、budget、max_parallel、allow_preview_deploy。
4. Workflow 回傳後：依其結果讓 subagent 更新 PROGRESS（逐項狀態/卡點/下一步/待決策），
   commit（每項一 commit 或匯總，依設定），push feature branch（guard 會擋 main）。
5. 僅當 allow_preview_deploy=true 才做 vercel preview（非 --prod），URL 記入 PROGRESS。
紅線：不 push main、不 vercel prod、不碰 DNS/.env、遇需決策一律寫 PROGRESS 不拍板。
```

### 9.3 orchestrate.mjs phase 骨架

```js
export const meta = {
  name: 'night-orchestrate',
  description: '夜跑：規劃→切割→平行實作測試→收斂→匯總',
  phases: ['規劃', '切割', '執行', '收斂', '匯總'],
};

export default async function ({ agent, parallel, pipeline, phase, log, input }) {
  // input: { tasks(未done), budgetTasks, maxParallel, allowPreviewDeploy, branch }

  phase('規劃');
  const plan = await agent(PLANNER_PROMPT(input), {
    schema: PlanSchema, label: 'planner', model: 'small',
  });
  if (!plan.tasks.length) { log('無任務'); return { status: 'no-tasks' }; }

  phase('切割');
  const items = await agent(SPLITTER_PROMPT(plan), {
    schema: WorkItemsSchema, label: 'splitter', model: 'small',
  }); // 每 item: { id, goal, fileScope, acceptance, parallelizable }

  // 依 fileScope 交集分批：可平行批 + 序列批（腳本內純 JS 分組）
  const { parallelBatch, serialBatch } = groupByConflict(items, input.maxParallel);

  phase('執行');
  // 可平行：pipeline 逐項 實作→測試（worktree 隔離），併發消化到空或達 budget
  const results = [];
  for (const item of [...parallelBatch, ...serialBatch].slice(0, input.budgetTasks)) {
    // pipeline 對單項即「實作→測試」兩段；批次用 parallel 包多個 pipeline
  }
  const done = await pipeline(parallelBatch, IMPLEMENT_STAGE, TEST_STAGE);
  const doneSerial = await runSerial(serialBatch, IMPLEMENT_STAGE, TEST_STAGE); // 序列

  phase('收斂');
  const merged = await agent(INTEGRATOR_PROMPT([...done, ...doneSerial]), {
    label: 'integrator', model: 'large',
  }); // 序列合併 worktree → feature branch，逐項 check，衝突跳過記錄

  phase('匯總');
  const report = await agent(REPORTER_PROMPT(merged), {
    label: 'reporter', model: 'small',
  }); // 寫 PROGRESS 狀態表/卡點/待決策 + 回傳摘要
  return { status: 'done', report };
}

// 各 STAGE 即一個 agent(...) 呼叫：
// IMPLEMENT_STAGE: agent(改檔+自測 npm run check, { isolation:'worktree', model:'large' })，含重試1次
// TEST_STAGE:      agent(對該 item 跑驗收 check/build/截圖/grep, { model:'small' })，含重試1次
```

> 註：`groupByConflict` / `runSerial` 為腳本內純 JS helper（無檔案 IO），只做分組與序列排程；任何讀寫檔/跑指令都在 agent 內。

---

## 10. 需要業主拍板的決策點

> 以下每點都能用「我的推薦」當預設值直接跑；列出來是因為有取捨成本，業主可一次拍板覆寫。

### D1. commit 粒度
- **選項 A — 每項一 commit**：可追溯、好 revert、resume 友善；缺點是 commit 數多。
- **選項 B — 匯總一 commit**：歷史乾淨；缺點是單項出錯難 revert、resume 顆粒粗。
- **代價**：A 多花極少 token（多幾次 git）；B 省一點但可追溯性差。
- **推薦：A（每項一 commit）**。本專案重 resume 與審查，顆粒細的好處遠大於 commit 數多。

### D2. 並行度上限（max_parallel）
- **選項**：2 / 3 / 4。本機 8 核硬上限 6。
- **代價**：越高越快但 token 峰值與 dev server/截圖資源競爭越大；夜跑同時要留資源給 Playwright。
- **推薦：3**。8 核留 2 給系統、留 1 給可能的截圖，3 個實作併發安全。

### D3. token budget 上限（單晚）
- **選項**：500K / 800K / 1.2M tokens。
- **代價**：越高一晚做越多，但失控成本越大；本專案是 1M context Opus，單晚易堆量。
- **推薦：800K**。約可穩定消化 5–8 個中型 item；達上限即收尾留隔天，避免燒爆。

### D4. 失敗策略（重試次數）
- **選項**：實作/測試各重試 1 次（共≤2 嘗試）/ 各 2 次（共≤3）。
- **代價**：重試越多成功率略升，但單項可能吃掉大量 budget。
- **推薦：各 1 次**。失敗即記 PROGRESS 跳過，把 budget 留給更多 item。

### D5. 是否自動 preview deploy
- **選項**：永遠關 / 由 KICKOFF 旗標逐晚開 / 永遠開。
- **代價**：preview 會用 Vercel Hobby 額度與 build 時間；且目前 `vercel login` 尚未完成（PROGRESS 卡點），現階段做不了。
- **推薦：由 KICKOFF 旗標控、預設關**。等 `vercel login` 完成後再逐晚視需要開。

### D6. 各 subagent 的 model 配置
- **選項**：全用 Opus / 規劃·切割·測試用較小模型、實作用 Opus。
- **代價**：全 Opus 品質一致但貴；混搭省 token。
- **推薦：混搭**（PLANNER/SPLITTER/TEST/REPORTER 用較小模型，IMPLEMENT/INTEGRATOR 用 Opus）。

### D7. 停止時點與排程時點（已拍板：07:00 停止）
- **現行設計**：排程 **02:00 起跑**、做到**早上 07:00 停止**（night-run.ps1 動態算到下一個 07:00 的秒數當 timeout，非固定時長）。配合 D3 的 token budget，通常 budget 先到；07:00 是時間安全網。
- **跨晚 resume**：07:00（或 budget 用盡）被停下時，未完成的 task **隔晚自動接續、不重做已完成項**（機制見 §3.2：task ID + `night(<id>):` commit 標記 + PLANNER 去重 + REPORTER carryover）。因 commit 是 ground truth，硬殺不影響已完成項的續做正確性。
- **若要改停止時點**：只需改 night-run.ps1 中 `AddHours(7)` 的小時數即可（例如改 06:00 → `AddHours(6)`）；resume 機制與停止時點無耦合。
- **附帶提醒**：排程任務 `JobschoolNightRun` 目前停用中，且 `gh auth login` / `vercel login` 未完成 → 夜跑 push 與 preview 都會失敗。**啟用夜跑前必須先補這兩個登入**（PROGRESS 既有卡點）。

---

## 11. 可行性與風險評估

| 面向 | 風險 | 評估 / 緩解 |
|---|---|---|
| **Windows 環境** | 中。worktree 路徑、PowerShell quoting、路徑分隔。 | git worktree 在 Windows 可用；ps1 用 here-string 傳 prompt（既有寫法 OK）。多 worktree 在同碟即可。 |
| **headless 互動卡死** | 高（若缺認證）。`gh/vercel login` 互動式會卡死整晚。 | **前置硬條件**：啟用夜跑前完成兩個 login（PROGRESS 既有卡點）。缺認證時 push/preview 失敗 → 設計上記 PROGRESS 跳過，不卡死流程，但整晚產出無法 push。 |
| **worktree 收斂衝突** | 中。並行改重疊檔→合併衝突。 | 用 fileScope 交集判定強制序列化（§4.1 保守策略）；INTEGRATOR 序列合併、衝突即跳過記錄，不硬解。 |
| **token 成本失控** | 中高。多 agent + Opus + 1M context 易堆量。 | D3 budget 800K 硬上限 + D6 model 混搭 + 重試 ≤1 + 逐項 budget 檢查。達上限即收尾。 |
| **subagent 不能再生 subagent** | 設計已規避。 | 所有 fan-out 由頂層 Workflow 發起；subagent 只做單一職責、不再分包。 |
| **resume 正確性** | 中。中斷後重做風險。 | 以「已合併到 feature branch + PROGRESS 狀態表」為真相；done 跳過、IMPLEMENT 開工前 git status 冪等檢查。 |
| **紅線誤觸** | 低。 | settings.json deny + guard.mjs 雙保險，且設計上主動避開；subagent 繼承同一 hook。 |
| **dev server / 截圖資源競爭** | 低。 | 並行度 3、截圖只在驗收節點做（CLAUDE.md §2 紀律）。 |

**總體判斷**：架構可行，最大的兩個前置依賴是「`gh login` / `vercel login` 必須先完成」（否則整晚白做無法 push）與「token budget 紀律」。worktree 收斂用保守序列化策略可把衝突風險壓到可接受。建議第一次以單一小任務 KICKOFF 試跑驗證整條鏈路（CLAUDE.md §4 Phase 3 的精神），再放大 budget 與並行度。
