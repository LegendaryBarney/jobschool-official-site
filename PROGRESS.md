# PROGRESS — 工作進度

> 跨 session 斷點檔。每次工作完更新「做了什麼 / 卡在哪 / 下一步 / 待決策」。
> 最高指導原則見 CLAUDE.md。

---

## 2026-06-04 — 自動化地基（Autonomy Infrastructure）

目標：讓 headless 夜跑與 subagent 能「跑順跑通、半夜不發問、也不會誤觸 production」。

### 已完成

- **權限設定** `.claude/settings.json`（已進版控）
  - allow：git 安全子集、npm/npx/node、gh、vercel、pagefind、檔案讀寫、Web、三個 MCP（playwright / chrome-devtools / context7）→ 夜跑常用工具不再跳權限詢問。
  - deny：force push、push main、reset --hard、clean -f、刪遠端分支、`vercel --prod`/promote/rollback/alias/dns/domains/remove、`rm -rf`、寫 `.env`。
- **守門 hook** `.claude/hooks/guard.mjs`（PreToolUse，攔 Bash|PowerShell）
  - 靜態樣式抓不到的變體由它以實際邏輯攔下：force push、reset --hard、clean -f、刪遠端分支、Vercel production、push 到 main、**以及目前站在 main 分支時禁止任何 push**。
  - 已實測：force push / `vercel --prod` / 在 main 上 push 三案皆正確阻擋（exit 2）。
- **夜跑執行器** `.claude/scripts/night-run.ps1`：讀 KICKOFF.md → headless `claude -p` 執行 → log 寫 `.claude/logs/`。無任務時只記一行就結束。
- **.gitignore**：改成讓 `.claude/settings.json`、`hooks/`、`scripts/` 進版控；個人 `settings.local.json` 與 `logs/` 不進。
- **Vercel CLI** 已全域安裝（v54.9.1，user-level prefix，免管理員）。
- **環境**：Node v22.20、npm 11.6、claude CLI 2.1.138、node_modules 已就緒。
- **Windows 排程**：已建立排程任務 `JobschoolNightRun`（每日 02:00 跑 night-run.ps1），**目前停用中**，待登入完成後再啟用。

### 卡在哪 / 待業主處理（一次性，我做不了）

1. **`gh auth login`** — GitHub 認證。沒有它連 feature branch 都 push 不上去（HTTPS 需憑證）。
2. **`vercel login`** — 沒有它無法 `vercel link` 與 preview deploy（Phase 1）。

### 待決策（擱置，留白天）

- 排程啟用時點：登入完成後啟用 `JobschoolNightRun`（或改時間）。
- 以下沿用 CLAUDE.md §5：DNS 切換、Decap CMS 登入後端、Resend/Turnstile/Sentry/GA4 正式金鑰。

### 下一步（地基完成後，依 Roadmap）

- Phase 0 收尾：`npm run dev` / `check` / `build` 三綠 + 首頁桌機/手機截圖基準。
- Phase 1：`vercel link` → 第一次 preview deploy（需上面兩個登入先完成）。
- 之後內容/視覺修正可寫進 KICKOFF.md 交夜跑（known_errors.md 已列一票事實與排版錯誤）。
