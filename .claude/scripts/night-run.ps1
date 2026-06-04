# 夜間 headless 批次執行器（由 Windows 工作排程器於凌晨呼叫）
# 用途：讀取 KICKOFF.md 作為當晚任務書，以 headless claude 執行，全程遵守
#       CLAUDE.md 與 .claude/settings.json（含 guard.mjs hook）的紅線。
# 安全：永遠在 feature branch 工作；禁止任何 production / 不可逆動作（由 hook 雙保險攔截）。

$ErrorActionPreference = 'Stop'
$ProjectDir = 'C:\Users\TedChipDale\Documents\jobs_official_site'
Set-Location $ProjectDir

$LogDir = Join-Path $ProjectDir '.claude\logs'
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$LogFile = Join-Path $LogDir "night-$Stamp.log"

$Prompt = @'
你正在 Windows 工作排程器的夜間 headless 模式下執行賈伯斯數理教室官網專案。

1. 先讀 CLAUDE.md，以它為最高指導原則；再讀 PROGRESS.md 接續上次斷點。
2. 讀取專案根目錄的 KICKOFF.md 作為「今晚任務書」。若 KICKOFF.md 不存在或其中沒有可執行任務，
   只在 PROGRESS.md 末尾記一行「<今天日期> 夜跑：無任務」後立即結束，不要自行發想新任務。
3. 執行任務時嚴守紅線：永遠在 feature branch 工作（先 git switch -c feat/<name>，絕不在 main 上開發）；
   可以 commit、push feature branch、preview deploy、Playwright 截圖、跑 npm run check / build；
   禁止任何 production 操作（push main、vercel --prod / promote、改 DNS）與任何需要業主決策的不可逆動作。
   遇到需要業主決策的事，寫進 PROGRESS.md 的「待決策」清單，不要自己拍板。
4. 每完成一個階段就更新 PROGRESS.md：做了什麼、卡在哪、下一步、待決策。中斷後重跑要能從斷點接續。
'@

"=== night-run 開始 $Stamp ===" | Tee-Object -FilePath $LogFile
& claude -p $Prompt 2>&1 | Tee-Object -FilePath $LogFile -Append
"=== night-run 結束 exit=$LASTEXITCODE ===" | Tee-Object -FilePath $LogFile -Append
