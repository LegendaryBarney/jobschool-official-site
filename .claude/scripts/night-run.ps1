# ============================================================================
# night-run.ps1 — 夜間 headless 編排啟動器（Windows 工作排程器於凌晨 02:00 呼叫）
# ============================================================================
#
# 用途
#   啟動 headless claude 當「ORCHESTRATOR（代理業主）」。頂層 claude 不自己寫
#   code，而是讀 CLAUDE.md / PROGRESS，先確保工作樹切到常駐滾動分支 `feat/night`，
#   再透過 Workflow 工具、以 scriptPath 執行編排腳本
#   `.claude/workflows/night-orchestrate.mjs`（custom workflow 不能用 name 叫，
#   只有 built-in 才行），由它 fan-out 多個 subagent 完成規劃→切割→平行實作測試
#   →序列收斂→匯總，並把成功變更合回 feat/night。
#
# 已拍板參數（傳進 orchestrator，再由它傳給 Workflow 的 args）
#   - token 上限 1,500,000   - 並行度 3   - 每工作項一 commit
#   - 實作/測試各重試 1 次    - autoDeploy 預設關（由 KICKOFF allow_preview_deploy 控）
#   - 停止時點 07:00          - 排程 02:00
#
# 行為
#   - 全程 Tee-Object 寫 .claude/logs/night-<時間戳>.log（保留既有行為）。
#   - 停止時點 07:00：以 background job 跑 claude，動態算到下一個早上 07:00 的秒數
#     當 timeout；逾時殺掉並在 log 記 TIMED OUT。被停下時沒做完的工作由
#     night-orchestrate 的跨晚 resume 機制隔晚接續（task ID + commit 標記去重）。
#   - 嚴守 CLAUDE.md 紅線（guard.mjs + settings.json deny 雙保險，prompt 亦重申）。
#
# 注意（夜跑前置硬條件，否則 push/preview 會失敗）：
#   啟用排程前必須先完成 `gh auth login` 與（若用 preview）`vercel login`。
# ============================================================================

$ErrorActionPreference = 'Stop'
$ProjectDir = 'C:\Users\TedChipDale\Documents\jobs_official_site'
Set-Location $ProjectDir

$LogDir = Join-Path $ProjectDir '.claude\logs'
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$LogFile = Join-Path $LogDir "night-$Stamp.log"

# ---- 已拍板參數（傳給 orchestrator → Workflow args） ----------------------
$BudgetCap   = 1500000
$Parallelism = 3
$AutoDeploy  = 'false'          # 預設關；實際是否 deploy 由 KICKOFF allow_preview_deploy 決定
$KickoffPath = 'KICKOFF.md'
$NightBranch = 'feat/night'     # 常駐滾動分支：跨晚續用同一條，跨晚 resume 才成立
# Workflow 必須以 scriptPath 執行（custom workflow 用 name 會 not found，只有 built-in 可）
$WorkflowScript = 'C:\Users\TedChipDale\Documents\jobs_official_site\.claude\workflows\night-orchestrate.mjs'

# ---- 停止時點：算到下一個早上 07:00 的秒數 -------------------------------
#   夜跑 02:00 起跑、做到當天 07:00 就停（不是固定 4 小時）。
#   若現在已過 07:00（例如手動於白天試跑），則算到隔天 07:00。
#   下限 60 秒，避免極端時點算出過小/負值。
$now = Get-Date
$cutoff = (Get-Date).Date.AddHours(7)
if ($now -ge $cutoff) { $cutoff = $cutoff.AddDays(1) }
$TimeoutSec = [int]([math]::Max(60, ($cutoff - $now).TotalSeconds))

# ---- ORCHESTRATOR prompt（繁中；明確要求呼叫 Workflow，不自己實作） --------
$Prompt = @"
你是賈伯斯數理教室官網夜跑的 ORCHESTRATOR（代理業主），在 Windows 工作排程器的
headless 模式下執行。最高指導原則：CLAUDE.md。

你本身「不寫 code、不跑大段實作」；你的工作是編排與發包，全部交給 Workflow 與 subagent。

步驟：
1. 先讀 CLAUDE.md（最高指導原則）與 PROGRESS.md（接續上次斷點）。
2. 判斷今晚有無任務：讀專案根目錄的 $KickoffPath。
   - 若不存在或其中沒有任何「## 任務」區塊 → 在 PROGRESS.md 末尾記一行
     「<今天日期> 夜跑：無任務」後立即結束，不要自行發想新任務。
3. 確保工作樹切到常駐滾動分支 `$NightBranch`（夜跑固定用這一條，跨晚續用、累積
   PROGRESS，跨晚 resume 才成立）。在呼叫 Workflow 前就要切好，這樣 Workflow 切出的
   worktree 會以 `$NightBranch` 為基底。做法（用一個 subagent 或直接下 git）：
   - 先 git fetch origin（取得最新 origin/main 與 origin/$NightBranch）。
   - 若本地或遠端已有 `$NightBranch` → git switch `$NightBranch`（已存在則續用，必要時
     git pull --ff-only 跟上 origin/$NightBranch；非 fast-forward 不要硬合，記 PROGRESS）。
   - 若 `$NightBranch` 不存在 → 從 main（優先 origin/main）建立一次：
     git switch -c `$NightBranch` origin/main（取不到 origin/main 就用本地 main）。
   - 絕不在 main/master 上動工或 push。確認 git rev-parse --abbrev-ref HEAD = `$NightBranch` 才往下。
4. 用 Workflow 工具，以 scriptPath 執行編排腳本（custom workflow 不能用 name 叫，
   只有 built-in 才行；務必用 scriptPath，否則會 not found）：
     scriptPath: "$WorkflowScript"
     args:
     {
       "kickoffPath": "$KickoffPath",
       "budgetCap": $BudgetCap,
       "parallelism": $Parallelism,
       "autoDeploy": $AutoDeploy,
       "branch": "$NightBranch"
     }
   （night 由 KICKOFF front-matter 提供，Workflow 內的 PLANNER 會解析；branch 固定傳
    `$NightBranch`，INTEGRATOR 一律把成功變更合回這條常駐分支，不另開 per-date 分支。）
    這個 Workflow 會自己 fan-out PLANNER / SPLITTER / 多個 IMPLEMENT+TEST / INTEGRATOR /
    REPORTER subagent，完成規劃→切割→平行實作測試→序列收斂→匯總，並在 token 用滿
    $BudgetCap 或隊列清空時收尾。
5. Workflow 回傳結構化總結後：確認 REPORTER 已在 `$NightBranch` 上「追加」一個帶日期的
   夜跑區塊到現有 PROGRESS.md（逐項狀態表 / 卡在哪 / 下一步 / 待決策 / 預算 / 跨晚待續
   隊列），且已 commit（訊息如 `night: update PROGRESS <date>`，日期用 git/系統取得）。
   必須是「追加」不可覆寫、不可另開新檔。若 PROGRESS 尚未更新或未 commit，讓一個
   subagent 依 Workflow 回傳補寫並 commit 到 `$NightBranch`。最後簡短回報本晚摘要。

紅線（主動避開，不靠 hook 兜底；guard.mjs + settings.json 為雙保險）：
- 永遠 feature branch；可 commit、push feature branch、npm run check/build、Playwright 截圖。
- 禁止：push main、vercel --prod / promote / rollback / alias / dns / domains / remove、
  改 DNS、寫或改 .env*、git reset --hard、force push、git clean -f、刪遠端分支。
- 任何需要業主決策的不可逆動作一律不做，寫進 PROGRESS 的「待決策」清單，絕不自行拍板。
- preview deploy 僅在 KICKOFF allow_preview_deploy=true 且 push 成功時才做（非 --prod）。
"@

$CutoffStr = $cutoff.ToString('yyyy-MM-dd HH:mm:ss')
"=== night-run 開始 $Stamp（停止時點 $CutoffStr＝${TimeoutSec}s 後，budget $BudgetCap，parallel $Parallelism）===" | Tee-Object -FilePath $LogFile

# ---- 以 background job 跑 claude，timeout 至停止時點 07:00 -----------------
$job = Start-Job -ScriptBlock {
    param($dir, $prompt)
    Set-Location $dir
    & claude -p $prompt 2>&1
} -ArgumentList $ProjectDir, $Prompt

$finished = Wait-Job -Job $job -Timeout $TimeoutSec

if ($null -eq $finished) {
    "=== TIMED OUT 至停止時點 $CutoffStr（${TimeoutSec}s）— 強制終止；未完成工作隔晚 resume 接續 ===" | Tee-Object -FilePath $LogFile -Append
    Stop-Job -Job $job
    Receive-Job -Job $job 2>&1 | Tee-Object -FilePath $LogFile -Append
    Remove-Job -Job $job -Force
    "=== night-run 結束（TIMED OUT）===" | Tee-Object -FilePath $LogFile -Append
    exit 124
}

# 正常結束：收 job 輸出寫 log
Receive-Job -Job $job 2>&1 | Tee-Object -FilePath $LogFile -Append
$jobState = $job.State
Remove-Job -Job $job -Force
"=== night-run 結束 state=$jobState ===" | Tee-Object -FilePath $LogFile -Append
