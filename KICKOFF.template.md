<!--
============================================================================
KICKOFF.template.md — 夜跑「當晚任務書」範本
============================================================================

用法
  1. 白天 session 或業主把本檔複製成專案根目錄的 `KICKOFF.md`：
        Copy-Item KICKOFF.template.md KICKOFF.md
  2. 改寫 front-matter 與「## 任務」區塊，列出當晚要做的事。
  3. 凌晨 02:00 排程器執行 .claude/scripts/night-run.ps1，頂層 ORCHESTRATOR
     claude 讀 KICKOFF.md → 透過 Workflow 跑 night-orchestrate 編排。
  4. 隔天看 PROGRESS.md 的當晚夜跑區塊（逐項狀態 / 卡點 / 下一步 / 待決策）。

格式規則（PLANNER 依固定區塊解析，務必結構化，否則只能用猜的）
  - front-matter 用 YAML，欄位見下方註解。
  - 每個任務一個「## 任務 Tn：標題」區塊，欄位：目標 / 檔案範圍 / 驗收標準 / 優先序 / 可平行。
    開頭的「Tn」是這個任務的【穩定 task ID】（T1、T2、T3…）。
  - 驗收標準要「可機器驗證」（grep / npm run check / npm run build / Playwright 截圖）。
  - 「## 禁止事項」區塊收進 globalForbidden，會提醒給每個實作 subagent。

★ task ID 規則（跨晚 resume 的關鍵，務必遵守）
  - 每個「## 任務」必須有穩定的 task ID（Tn）。
  - 【ID 一旦寫定就不要改】：完成與否由系統用 commit 標記 `night(Tn): …` 追蹤；
    改了 ID（或改標題後系統認不出）會被當成全新任務從頭重做。
  - 你（業主）只要把「當晚想做的」全部列上即可：沒做完的會自動留到隔晚接著做，
    已完成的（分支上已有 `night(Tn):` commit）隔晚會自動跳過、不重做。
  - 跨晚沿用同一份 KICKOFF.md 即可（不必每晚刪掉已完成的任務；系統自行去重）。

停止時點與跨晚 resume
  - 夜跑 02:00 起跑、做到【早上 07:00】就停（不是固定時長）；token 用滿 1,500,000 也會提前收工。
  - 被停下時沒做完的任務【自動隔晚續做】，且不重做已完成的項目。
  - 隔天看 PROGRESS.md 當晚區塊的「跨晚待續隊列（carryover）」即知哪些留到下一晚。

容錯
  - 沒有 KICKOFF.md，或沒有任何「## 任務」區塊 → 夜跑只在 PROGRESS 記一行
    「<日期> 夜跑：無任務」後結束，不會自行發想新任務。
  - 已完成的任務 id 會被跳過（resume 不重做）。判定來源：
    ① 夜跑 feature branch 的 git log 出現 `night(Tn):` commit（ground truth，硬殺也不丟）；
    ② PROGRESS 最近夜跑區塊標 ✅ done。兩者取聯集。

已拍板的系統參數（寫死在 night-orchestrate.mjs / night-run.ps1，KICKOFF 只能在
允許範圍內覆寫）：
  - 單晚 token 上限 1,500,000（用完即收工）
  - 並行度預設 3
  - 每工作項完成各一 commit（訊息帶 task ID：`night(Tn): 摘要`）
  - 實作/測試各重試 1 次，失敗即記錄、隔晚續做
  - 自動 preview deploy 預設關（由本檔 allow_preview_deploy 旗標控制）
  - 停止時點 07:00、排程 02:00（未完成自動隔晚續做、不重做已完成項）
  - model 混搭：規劃/切割/測試 haiku/sonnet、實作/收斂 opus
============================================================================
-->
---
# 停止時點 07:00、未完成自動隔晚續做：夜跑 02:00 起跑、做到早上 07:00 停；
# 沒做完的 task 隔晚自動接續、不重做已完成項（完成以 git 上 `night(Tn):` commit 為準）。
# 同一份 KICKOFF.md 可跨晚沿用，不必每晚清掉已完成任務。

# 夜跑日期（YYYY-MM-DD）。用於 feature branch 命名與 PROGRESS 區塊標題。
night: 2026-06-10

# 今晚最多消化幾個 work item（軟上限）。超過的留隔天，寫進 PROGRESS。
# 注意：token 硬上限 1,500,000 仍優先；先到者為準。
budget_tasks: 6

# 覆寫並行度（同時實作的最大併發）。不填用預設 3。本機 8 核硬上限約 6。
max_parallel: 3

# 收斂後是否做 preview deploy（非 --prod）。預設 false。
# 需先完成 vercel login，否則 push/preview 會失敗（見 PROGRESS 卡點）。
allow_preview_deploy: false

# 指定夜跑 feature branch。不填則由 INTEGRATOR 自動命名 feat/night-<日期>。
branch: feat/night-2026-06-10
---

# 今晚任務書

<!-- 以下為填寫範例，請依當晚實際工作改寫；不需要的任務整段刪掉。 -->

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
- 檔案範圍：src/content/courses/*.md
- 驗收標準：
  - [ ] 所有 courses/*.md front-matter 有 description 欄位
  - [ ] npm run build 綠
- 優先序：P1
- 可平行：是

## 任務 T3：師資頁手機版排版錯誤（known_errors.md #4）
- 目標：修 390px 下卡片溢出
- 檔案範圍：src/layouts/BaseLayout.astro、src/styles/global.css（共用元件）
- 驗收標準：
  - [ ] Playwright 390px 截圖無水平捲軸
  - [ ] npm run check 綠
- 優先序：P1
- 可平行：否（會動到共用元件 / layout，與其他改元件的任務序列化）

## 禁止事項（本晚特別註明）
- 不要動 astro.config.mjs 的 site URL
- 不要改 .env / 任何金鑰
