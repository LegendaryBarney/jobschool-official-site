// ============================================================================
// night-orchestrate.mjs — 夜間無人化多 agent 編排 Workflow（核心腳本）
// ============================================================================
//
// 用途
//   賈伯斯數理教室官網夜跑的 fan-out 編排引擎。由頂層 ORCHESTRATOR claude
//   （night-run.ps1 啟動的 headless session）以 Workflow 工具、用 scriptPath 呼叫
//   （custom workflow 不能用 name 叫，只有 built-in 才行）。流程：規劃(Plan)→切割
//   (Split)→執行(Execute)→收斂(Integrate)→匯總(Report)。本腳本只做純 JS 編排，
//   所有讀寫檔/git/測試都委派 ag() 內的 subagent 去做（Workflow runtime 無檔案系統 API）。
//
// 呼叫方式（由頂層 claude 透過 Workflow 工具）
//   以 scriptPath 執行 .claude/workflows/night-orchestrate.mjs，傳入 args：
//     {
//       kickoffPath:   'KICKOFF.md',          // 任務書路徑（預設 KICKOFF.md）
//       budgetCap:     1500000,               // 單晚 output token 硬上限
//       parallelism:   3,                     // 同時實作的最大併發
//       autoDeploy:    false,                 // 是否允許收斂後 preview deploy
//       night:         '2026-06-10',          // 可選；夜跑日期（給 PROGRESS 區塊標題用）
//       branch:        'feat/night'           // 常駐滾動分支（預設 feat/night）
//     }
//   所有 args 皆有 fallback 預設，缺值不會 throw。
//
// 分支模型（常駐滾動分支 feat/night）
//   夜跑固定在單一常駐滾動分支 `feat/night` 上累積（不每晚從 main 切 per-date 分支）：
//   只從 main 開一次，之後每晚在它上面續做、累積 commit 與 PROGRESS，跨晚 resume 才成立。
//   頂層 ORCHESTRATOR（night-run.ps1）在呼叫本 Workflow 前已確保工作樹切到 feat/night，
//   所有 worktree 以 feat/night 為基底；INTEGRATOR 把成功變更合回 feat/night（每項一個
//   `night(Tn): …` commit），REPORTER 在 feat/night 上「追加」並 commit PROGRESS。
//
// 跨晚 resume 模型（07:00 硬停 → 隔晚無痛接續）
//   夜跑於 02:00 起跑、做到早上 07:00 就被 night-run.ps1 硬殺（或 token 預算耗盡
//   而提前收尾）。被停下時沒做完的工作，隔天晚上要「接著做、不重做已完成的項目」。
//   因為固定用同一條 feat/night，前一晚的 `night(Tn):` commit 隔晚仍在同一分支看得到。
//   機制以「task ID + commit 標記」為持久真相，三段協作：
//     1. 持久標記（ground truth = git）：每個工作項通過後，IMPLEMENT/INTEGRATOR 的
//        commit message 必帶 task ID，格式 `night(T2): <摘要>`。即使 07:00 被硬殺、
//        REPORTER 沒跑到、PROGRESS 沒寫完，commit 仍落在 feat/night 上。
//     2. PLANNER 去重：每晚開工先讀 KICKOFF + CLAUDE.md + PROGRESS.md，再額外讀
//        「夜跑 feature branch 的 git log」，把 commit 訊息中出現過的 task ID（或
//        PROGRESS 標 ✅ done 的 id）視為「已完成」並排除；只把「未完成 / 失敗待重試 /
//        從未動過」的 task 放進本晚隊列。PLANNER 明確輸出 tonightTasks 與 skippedDone。
//     3. carryover：REPORTER 寫 PROGRESS 時輸出清楚的「跨晚待續隊列」（未完成/失敗的
//        task ID + 原因 + 下一步），方便隔晚接續與業主檢視。
//   Execute 迴圈遇 budget 超標或某項失敗時，已完成項的 commit 不受影響；「停在哪、
//   下次從哪續」由 task ID 的完成集合決定（git log 為準），而非從頭重跑。
//   注意：commit 的 task ID 是 ground truth，PROGRESS 只是人類可讀的鏡像；兩者衝突
//   時以 git log 的 commit 標記為準（因為硬殺可能讓 PROGRESS 落後於 commit）。
//
// 設計約束（嚴格）
//   - meta 為純 literal（無變數/函式/template/spread）。
//   - 禁用 Date.now() / Math.random() / 無參數 new Date()（會 throw）。
//     需要日期/隨機 id 一律交給 subagent 用 `git log` / 系統取得。
//   - subagent 不能再生 subagent；本腳本是唯一的 fan-out 來源。
//   - budget.spent() 為本回合已花 output tokens（跨主迴圈共用）；用它做硬上限。
//
// 安全紅線（每個會動 git/部署的 agent prompt 都重申）
//   永遠 feature branch；可 commit / push feature branch / preview(若開) /
//   npm run check|build / Playwright 截圖。禁止 push main、vercel --prod /
//   promote / rollback / alias、改 DNS、寫 .env、reset --hard、force push、
//   刪遠端資源、任何需業主決策的不可逆動作（遇到寫進 PROGRESS 待決策）。
//
// 對應設計文件：docs/NIGHT_RUN_DESIGN.md（§1 架構、§2 KICKOFF、§3 PROGRESS、
//   §4 平行衝突、§5 git/部署、§7 不會跑一下就停、§8 失敗處理）。
// ============================================================================

export const meta = {
  name: 'night-orchestrate',
  description: '夜跑多 agent 編排：規劃→切割→逐項平行實作測試→序列收斂→匯總 PROGRESS。跑到隊列清空、token 預算耗盡或 07:00 硬停才停；未完成項以 task ID + commit 標記隔晚 resume 接續。',
  phases: [
    { title: 'Plan' },
    { title: 'Split' },
    { title: 'Execute' },
    { title: 'Integrate' },
    { title: 'Report' },
  ],
};

// ---------------------------------------------------------------------------
// 共用安全條款（塞進每個會動 git / 部署的 agent prompt）
// ---------------------------------------------------------------------------
const SAFETY = [
  '【紅線・務必遵守】',
  '- 永遠只在 feature branch 工作，絕不在 main/master 上動工或 push。',
  '- 可做：commit、push feature branch、npm run check / npm run build、Playwright 截圖。',
  '- 禁止：git push main、vercel --prod / promote / rollback / alias / dns / domains / remove、',
  '  改 DNS、寫或改 .env*、git reset --hard、force push、git clean -f、刪除遠端分支。',
  '- 任何需要業主主觀決策的不可逆動作一律不做，改寫進 PROGRESS 的「待決策」清單。',
  '- guard.mjs 與 settings.json 會雙重攔截，但你必須設計上主動避開，不靠 hook 兜底。',
].join('\n');

// commit 訊息結尾署名（CLAUDE.md 要求）
const COAUTHOR = 'Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>';

// ---------------------------------------------------------------------------
// JSON Schemas
// ---------------------------------------------------------------------------

// PLANNER 產出：當晚計畫
//   resume：milestones 僅含「本晚要做」的 task（已完成的已被 PLANNER 去重排除）。
//   tonightTasks / skippedDone 為跨晚 resume 的明確清單，供 log / REPORTER 檢視。
const PlanSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['hasTasks', 'milestones', 'notes'],
  properties: {
    hasTasks: { type: 'boolean' },
    night: { type: 'string' },                  // 夜跑日期（agent 從 KICKOFF/系統取得）
    branch: { type: 'string' },                 // 指定 feature branch（可空）
    allowPreviewDeploy: { type: 'boolean' },    // KICKOFF 旗標解析結果
    budgetTasks: { type: 'number' },            // 軟上限：今晚最多消化幾項（可選）
    globalForbidden: { type: 'array', items: { type: 'string' } },
    // 跨晚 resume：本晚要做的 task id 清單（= milestones 的 id；已完成者已排除）
    tonightTasks: { type: 'array', items: { type: 'string' } },
    // 跨晚 resume：判定為「已完成」而跳過的 task id 清單（git log 帶 night(<id>) 或 PROGRESS 標 done）
    skippedDone: { type: 'array', items: { type: 'string' } },
    milestones: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'goal'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          goal: { type: 'string' },
          fileScope: { type: 'array', items: { type: 'string' } },
          acceptance: { type: 'array', items: { type: 'string' } },
          priority: { type: 'string' },         // P0 / P1 / P2
          parallelizable: { type: 'boolean' },
        },
      },
    },
    notes: { type: 'array', items: { type: 'string' } },
  },
};

// SPLITTER 產出：work items 陣列
const WorkItemsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'instructions', 'acceptance', 'fileScope', 'parallelSafe', 'priority'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          instructions: { type: 'string' },
          acceptance: { type: 'array', items: { type: 'string' } },
          fileScope: { type: 'array', items: { type: 'string' } },
          parallelSafe: { type: 'boolean' },
          priority: { type: 'string' },
        },
      },
    },
  },
};

// IMPLEMENT 產出
const ImplementSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'success', 'summary'],
  properties: {
    id: { type: 'string' },
    success: { type: 'boolean' },
    worktreePath: { type: 'string' },   // 隔離 worktree 路徑
    worktreeBranch: { type: 'string' }, // 該 worktree 的暫存 branch
    commit: { type: 'string' },         // worktree 內的 commit hash（若有）
    changedFiles: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
    error: { type: 'string' },
  },
};

// TEST 產出（verdict）
const VerdictSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'passed', 'verdict'],
  properties: {
    id: { type: 'string' },
    passed: { type: 'boolean' },
    verdict: { type: 'string' },                          // pass / fail / needs-attention
    failedChecks: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
    // 帶過上一階段 implement 結果，供 Integrate 階段參照
    worktreePath: { type: 'string' },
    worktreeBranch: { type: 'string' },
    commit: { type: 'string' },
    title: { type: 'string' },
  },
};

// INTEGRATOR 產出
const IntegrateSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['branch', 'merged', 'conflicts'],
  properties: {
    branch: { type: 'string' },
    merged: { type: 'array', items: { type: 'string' } },     // 成功併入的 item id
    conflicts: { type: 'array', items: { type: 'string' } },  // 衝突跳過的 item id
    pushed: { type: 'boolean' },
    summary: { type: 'string' },
  },
};

// REPORTER 產出
const ReportSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['progressUpdated', 'summary'],
  properties: {
    progressUpdated: { type: 'boolean' },
    summary: { type: 'string' },
    pendingDecisions: { type: 'array', items: { type: 'string' } },
    previewUrl: { type: 'string' },
    // 跨晚待續隊列（carryover）：未完成 / 失敗的 task，供隔晚 resume 與業主檢視
    carryover: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'reason'],
        properties: {
          id: { type: 'string' },          // task ID（隔晚 PLANNER 接續用）
          status: { type: 'string' },      // pending | failed | conflict
          reason: { type: 'string' },      // 為何沒完成（budget-cap / 07:00 硬停 / 測試未過 / 衝突…）
          nextStep: { type: 'string' },    // 下一步建議
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// 純 JS helper：依 fileScope 交集分組（無檔案 IO）
//   parallelSafe 且與其他項 fileScope 無交集 → 可平行批；其餘 → 序列批。
// ---------------------------------------------------------------------------
function hasOverlap(a, b) {
  const sa = new Set(a || []);
  for (const f of b || []) if (sa.has(f)) return true;
  return false;
}

function groupByConflict(items) {
  const parallelBatch = [];
  const serialBatch = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it.parallelSafe) { serialBatch.push(it); continue; }
    // 與其他任一項 fileScope 交集 → 強制序列（保守優先）
    let conflict = false;
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      if (hasOverlap(it.fileScope, items[j].fileScope)) { conflict = true; break; }
    }
    (conflict ? serialBatch : parallelBatch).push(it);
  }
  return { parallelBatch, serialBatch };
}

// 依優先序排序（P0 < P1 < P2 < 其他）
function byPriority(a, b) {
  const rank = (p) => {
    const m = String(p || '').toUpperCase().match(/P(\d+)/);
    return m ? Number(m[1]) : 99;
  };
  return rank(a.priority) - rank(b.priority);
}

// 切批：把陣列切成每批最多 n 個
function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------
function plannerPrompt(kickoffPath, branchHint) {
  return [
    '你是夜跑的 PLANNER（小模型角色）。讀以下檔案後輸出結構化計畫，本身不實作任何東西。',
    `1. 讀任務書：${kickoffPath}（若不存在，回 hasTasks=false、milestones=[]）。`,
    '2. 讀 CLAUDE.md（最高指導原則）與 PROGRESS.md（接續斷點）。',
    '3. 解析 KICKOFF 的 YAML front-matter（night / budget_tasks / max_parallel /',
    '   allow_preview_deploy / branch）與每個「## 任務 Tn：標題」區塊（穩定 task ID、目標、',
    '   檔案範圍、驗收標準、優先序、可平行）。把「## 禁止事項」收進 globalForbidden。',
    '',
    '4.【跨晚 resume 去重 — 最關鍵】判斷哪些 task ID 已完成並排除，只把未完成的放進本晚隊列。',
    '   完成判定有兩個來源，git 為 ground truth（因 07:00 可能硬殺，PROGRESS 可能落後於 commit）：',
    `   (a) git log（ground truth）：夜跑常駐滾動分支固定為 ${branchHint || 'feat/night'}（不是 per-date 分支），`,
    `       對它跑 \`git log --format=%s ${branchHint || 'feat/night'}\`（你此刻通常已在該分支上，亦可直接 \`git log --format=%s\`），`,
    '       凡 commit 訊息符合 `night(<TASK_ID>):` 格式（例如 `night(T2): ...`）→ 該 TASK_ID 視為「已完成」。',
    '       分支不存在（首夜）→ 視為沒有任何已完成 commit。',
    '   (b) PROGRESS.md：最近夜跑區塊狀態表中標 ✅ done 的 task ID，也視為已完成。',
    '   兩來源取聯集 = 已完成集合 doneSet。',
    '5. 產出本晚隊列：milestones 只放「KICKOFF 有列、但 ID 不在 doneSet」的任務',
    '   （= 未完成 / 失敗待重試 / 從未動過）。已在 doneSet 的一律不放（不重做）。',
    '   - tonightTasks = milestones 的所有 id（本晚要做的 task 清單）。',
    '   - skippedDone = doneSet 中、且確實出現在 KICKOFF 的 task id（已完成跳過的 task 清單）。',
    '6. 容錯：KICKOFF 不存在、或沒有任何「## 任務」區塊、或全部任務都已在 doneSet →',
    '   回 hasTasks=false、milestones=[]、tonightTasks=[]、skippedDone 列出已完成者、',
    '   在 notes 說明原因（如「全部任務已於先前夜跑完成」）。絕不自行發想 KICKOFF 以外的新任務。',
    '輸出嚴格符合 schema：{ hasTasks, night?, branch?, allowPreviewDeploy?, budgetTasks?,',
    'globalForbidden[], tonightTasks[], skippedDone[],',
    'milestones[{id,title,goal,fileScope[],acceptance[],priority,parallelizable}], notes[] }。',
  ].join('\n');
}

function splitterPrompt(plan) {
  return [
    '你是夜跑的 SPLITTER（小模型角色）。把下列計畫拆成可執行的 work items 陣列，本身不實作。',
    '計畫 JSON：',
    JSON.stringify(plan),
    '',
    '規則：',
    '- 每個 item 給清楚的 instructions（讓 IMPLEMENT subagent 能照做）與可機器驗證的 acceptance',
    '  （例如「grep 不到禁用詞」「npm run check 綠」「Playwright 390px 無水平捲軸」）。',
    '- fileScope 要精確列出會改到的檔案/目錄。',
    '- parallelSafe 判定：純內容、檔案不重疊 → true；改共用元件/layout/global.css/config → false。',
    '  另外：凡 fileScope 與其他任一 item 有交集 → 一律 parallelSafe=false（保守優先，避免合併衝突）。',
    '- priority 沿用計畫的 P0/P1/P2。',
    '- 把計畫的 globalForbidden 寫進每個 item 的 instructions 末尾提醒。',
    '輸出嚴格符合 schema：{ items[{id,title,instructions,acceptance[],fileScope[],parallelSafe,priority}] }。',
  ].join('\n');
}

function implementPrompt(item, attemptNote) {
  return [
    `你是夜跑的 IMPLEMENT subagent，負責單一 work item：${item.id} — ${item.title}。`,
    'isolation:worktree 已替你切出獨立 git worktree（從夜跑 feature branch base）。只在你的 worktree 內動工。',
    '',
    '步驟：',
    '1. 先 git status 檢查該 item 是否已部分完成（冪等：別重覆套用已存在的修改）。',
    '2. 依下列指示改檔：',
    item.instructions,
    `   檔案範圍（盡量只動這些）：${JSON.stringify(item.fileScope || [])}`,
    '   內容修改一律改 src/content/ 下的 Markdown/MDX/JSON，不要把文案寫死進元件。',
    '3. 自測：npm run check 必須綠（TypeScript strict 不可關閉）。',
    '4. 在你的 worktree 內 commit 一個。【commit 訊息格式硬性要求 — 跨晚 resume 的完成標記】：',
    '   第一行必須是 `night(' + item.id + '): ' + item.title + '`（task ID 用括號包住，務必精確），',
    `   結尾加一行「${COAUTHOR}」。此 task ID 是隔晚 PLANNER 判定「已完成而跳過」的 ground truth，`,
    '   即使 07:00 被硬殺、REPORTER 沒跑到，這個 commit 仍會留在分支上被看到；格式錯了會被當成未完成而重做。',
    '   不要 push、不要合回 feature branch（交給 INTEGRATOR）。',
    attemptNote ? `\n【這是重試】上一次失敗原因，請針對性修正：${attemptNote}` : '',
    '',
    SAFETY,
    '',
    '輸出嚴格符合 schema：{ id, success, worktreePath?, worktreeBranch?, commit?, changedFiles[]?, summary, error? }。',
    'success=false 時把錯誤寫進 error，別硬幹也別擴大範圍。',
  ].join('\n');
}

function testPrompt(item, impl, attemptNote) {
  return [
    `你是夜跑的 TEST subagent（小模型角色），對 work item ${item.id} — ${item.title} 跑驗收。你不改 code。`,
    'IMPLEMENT 的結果：',
    JSON.stringify({ worktreePath: impl.worktreePath, worktreeBranch: impl.worktreeBranch, commit: impl.commit, changedFiles: impl.changedFiles, summary: impl.summary }),
    '',
    '在該 item 的 worktree 內，逐條檢查 acceptance：',
    JSON.stringify(item.acceptance || []),
    '可用手段：npm run check / npm run build / grep 事實 / Playwright 截圖（1440px 與 390px）。截圖只在必要時做（耗 token）。',
    attemptNote ? `\n【這是重試】上一輪驗收失敗：${attemptNote}` : '',
    '',
    '輸出嚴格符合 schema：{ id, passed, verdict(pass|fail|needs-attention), failedChecks[]?, notes?,',
    '  worktreePath?, worktreeBranch?, commit?, title? }。',
    '請把 worktreePath / worktreeBranch / commit / title 原樣帶回，供收斂階段使用。',
  ].join('\n');
}

function integratorPrompt(passed, branchHint, night) {
  return [
    '你是夜跑的 INTEGRATOR（opus 角色）。把下列「通過驗收」的 worktree 變更，序列收斂回常駐滾動分支。',
    '通過驗收的項目（含 worktree 路徑/分支/commit）：',
    JSON.stringify(passed),
    '',
    '步驟：',
    `1. 夜跑常駐滾動分支固定為 ${branchHint || 'feat/night'}（不另開 per-date 分支）。頂層 orchestrator 已先切到它；`,
    `   你只要確認當前分支是 ${branchHint || 'feat/night'}（git rev-parse --abbrev-ref HEAD），不是就 git switch ${branchHint || 'feat/night'}。`,
    `   若該分支不存在（理論上不該發生），從 origin/main（取不到用本地 main）切出一次：git switch -c ${branchHint || 'feat/night'} origin/main。絕不在 main 上動工。`,
    `2. 按優先序逐一把各 worktree 的暫存 commit 合進 ${branchHint || 'feat/night'}（git merge 或 cherry-pick），每項落成一個 night(Tn) commit。`,
    `   【跨晚 resume 完成標記 — 務必保留】合進 ${branchHint || 'feat/night'} 後，該項在分支上的 commit 訊息`,
    '   第一行必須是 `night(<TASK_ID>): <摘要>`（cherry-pick 預設會原樣保留 IMPLEMENT 寫的訊息；',
    '   若你做了 squash/改寫，務必確保第一行仍帶 `night(<TASK_ID>):`）。這是隔晚 PLANNER 用',
    `   \`git log --format=%s ${branchHint || 'feat/night'}\` 判定「已完成而跳過」的唯一持久依據；遺漏會導致該項隔晚被重做。`,
    '3. 每合併一項後跑 npm run check，綠了才合下一項（早發現衝突）。',
    '4. 衝突處理：自動可解（不同檔/段）直接合；純文字衝突可試一次三方合併；',
    '   仍衝突 → 不硬解，該 item 記為 conflict、保留其 worktree branch、繼續合其餘項。',
    '5. 全部合完 → 清理已成功併入的 worktree（保留失敗/衝突的供白天檢查）。',
    '6. push feature branch（git push -u origin <branch>；guard 會擋 main）。push 失敗（如未登入）→',
    '   記下來、pushed=false，不要卡死。',
    '',
    SAFETY,
    '',
    '輸出嚴格符合 schema：{ branch, merged[id], conflicts[id], pushed?, summary }。',
  ].join('\n');
}

function reporterPrompt(payload, autoDeploy) {
  return [
    '你是夜跑的 REPORTER（小模型角色）。更新 PROGRESS.md、commit，並輸出當晚摘要。你不拍板任何決策。',
    '本晚編排資料：',
    JSON.stringify(payload),
    '',
    '步驟：',
    '0. 確認當前分支是常駐滾動分支 `feat/night`（git rev-parse --abbrev-ref HEAD）。所有讀寫與 commit 都在它上面。',
    '1.【追加，不可覆寫/另開新檔】先讀 feat/night 上現有的 PROGRESS.md，在「檔案末尾追加」一個',
    '   「## <日期> — 夜跑（branch: feat/night）」區塊（保留既有所有內容；嚴禁覆寫整檔、嚴禁新建別的 PROGRESS 檔）。區塊含：',
    '   - 任務消化狀態表（| id | 標題 | 結果(✅done/⏭skipped/❌failed/❌conflict) | 說明 |）。',
    '     本晚跳過、判定「先前已完成」的 task（payload.skippedDone）也列一列，結果標「⏭ 已於先前夜跑完成」。',
    '   - 卡在哪 / 下一步 / 待決策（留白天，勿自行拍板）/ 預算（token 花費、止於何種終止條件',
    '     ；stoppedBy 可能是 queue-empty / budget-cap / task-cap / 07:00 硬停被外部殺掉）。',
    '   - 【跨晚待續隊列（carryover）】獨立一小節，逐項列出未完成/失敗的 task ID + 原因 + 下一步，',
    '     明確標示「以下會在隔天晚上自動接續，已完成的不會重做」。同時填進輸出的 carryover[] 欄位。',
    '   日期請用 `git log -1 --format=%cd` 或系統取得（腳本不提供日期）。',
    '1b.【commit PROGRESS — 務必做】把 PROGRESS.md 的追加變更 commit 到 feat/night：',
    '   git add PROGRESS.md && git commit。commit 訊息第一行用 `night: update PROGRESS <date>`',
    '   （<date> 同上由 git/系統取得），結尾加一行「' + COAUTHOR + '」。',
    '   即使被 07:00 硬殺，已 commit 的 PROGRESS 也會留在 feat/night 上，隔晚接得上。progressUpdated 反映是否成功 commit。',
    autoDeploy
      ? '2. autoDeploy=true：若 feature branch 已成功 push，可跑 vercel（非 --prod）產 preview，URL 記入 PROGRESS 與 previewUrl。'
      : '2. autoDeploy=false：不要做任何 preview deploy。',
    '',
    SAFETY,
    '',
    '輸出嚴格符合 schema：{ progressUpdated, summary, pendingDecisions[]?, previewUrl?,',
    '  carryover[{id,status,reason,nextStep}]? }。carryover 要含本晚所有 pending + failed + conflict 的 task。',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// 帶重試的 agent 包裝（實作/測試各重試 1 次 = 共 ≤2 次嘗試）
// ---------------------------------------------------------------------------
async function withRetry(makePrompt, opts, isOk) {
  // 第一次
  let lastNote = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    const note = attempt === 0 ? '' : lastNote;
    let res = null;
    try {
      res = await agent(makePrompt(note), opts);
    } catch (e) {
      lastNote = '上一次 subagent 執行出錯：' + String(e && e.message ? e.message : e);
      continue;
    }
    if (res == null) {            // 被略過
      lastNote = '上一次被略過（回 null）。';
      continue;
    }
    if (isOk(res)) return res;    // 通過
    lastNote = (res.error || (res.failedChecks && res.failedChecks.join('; ')) || res.notes || res.summary || '未通過');
    // 不通過 → 進下一輪重試
    // 保留最後一次結果以便回傳（即使失敗也要記錄）
    if (attempt === 1) return res;
  }
  return null;
}

// ===========================================================================
// 主腳本本體
// ===========================================================================

// ---- 讀設定（全部給 fallback 預設） --------------------------------------
const KICKOFF = (args && args.kickoffPath) || 'KICKOFF.md';
const CAP = (args && args.budgetCap) || 1_500_000;          // 單晚 output token 硬上限
const PARALLELISM = Math.max(1, (args && args.parallelism) || 3);
const AUTO_DEPLOY = !!(args && args.autoDeploy);
// 常駐滾動分支：預設 feat/night（夜跑固定續用同一條，跨晚 resume 才成立）。
const BRANCH_HINT = (args && args.branch) || 'feat/night';
const NIGHT = (args && args.night) || '';

const summary = {
  status: 'unknown',
  tonightTasks: [],       // 本晚 PLANNER 排入的 task id（已去重，排除先前已完成者）
  skippedDone: [],        // 跨晚 resume：判定已完成而本晚跳過的 task id
  completed: [],          // 通過驗收的 item id
  failed: [],             // 實作或測試失敗的 item id
  conflicts: [],          // 收斂衝突的 item id
  pending: [],            // 因預算/07:00 硬停/未取到而留隔天的 item id（carryover）
  carryover: [],          // 跨晚待續隊列（pending+failed+conflict 的 task + 原因 + 下一步）
  pendingDecisions: [],
  branch: BRANCH_HINT,
  pushed: false,
  previewUrl: '',
  tokenSpent: 0,
  stoppedBy: '',          // queue-empty | budget-cap | no-tasks
};

// ===== Phase 1：Plan =======================================================
phase('Plan');
log(`讀取任務書 ${KICKOFF}，token 上限 ${CAP}，並行度 ${PARALLELISM}，autoDeploy=${AUTO_DEPLOY}`);

// 傳給 PLANNER 的 branch hint：args 指定優先；缺值時 PLANNER 自己從 KICKOFF/feat/night-<night> 推。
const plan = await agent(plannerPrompt(KICKOFF, BRANCH_HINT), {
  label: 'planner',
  phase: 'Plan',
  model: 'haiku',
  schema: PlanSchema,
});

if (!plan || !plan.hasTasks || !plan.milestones || plan.milestones.length === 0) {
  // 注意：這條路也涵蓋「KICKOFF 有任務、但全部 task ID 已在先前夜跑完成」的情形
  // （PLANNER 去重後 milestones=[]）。此時 skippedDone 會列出已完成者，不算異常。
  const allDone = !!(plan && plan.skippedDone && plan.skippedDone.length);
  log(allDone
    ? `無待做任務：KICKOFF 全部 task 已於先前夜跑完成並跳過 [${plan.skippedDone.join(', ')}]。直接結束，不重做。`
    : '無任務（KICKOFF 不存在 / 無任務區塊）。不自行發想新任務，直接結束。');
  // 仍跑 Report 讓 REPORTER 在 PROGRESS 記一行「夜跑：無任務 / 全部已完成」
  phase('Report');
  const noTaskReport = await agent(reporterPrompt({ status: 'no-tasks', notes: plan && plan.notes, skippedDone: (plan && plan.skippedDone) || [] }, false), {
    label: 'reporter-no-tasks',
    phase: 'Report',
    model: 'haiku',
    schema: ReportSchema,
  });
  summary.status = 'no-tasks';
  summary.stoppedBy = 'no-tasks';
  summary.skippedDone = (plan && plan.skippedDone) ? plan.skippedDone.slice() : [];
  summary.tokenSpent = budget.spent();
  if (noTaskReport && noTaskReport.summary) log(noTaskReport.summary);
  return summary;
}

// 收斂用的分支 hint：常駐滾動分支固定為 feat/night（args.branch 預設即 feat/night）。
const branchHint = BRANCH_HINT || (plan.branch || 'feat/night');
const night = NIGHT || (plan.night || '');
summary.branch = branchHint;

// 跨晚 resume：記錄本晚要做 / 已完成跳過的 task id（供 log 與 REPORTER carryover 對照）
summary.tonightTasks = (plan.tonightTasks || plan.milestones.map((m) => m.id)).slice();
summary.skippedDone = (plan.skippedDone || []).slice();
log(`跨晚 resume：本晚要做 ${summary.tonightTasks.length} 項 [${summary.tonightTasks.join(', ')}]；已完成跳過 ${summary.skippedDone.length} 項 [${summary.skippedDone.join(', ')}]`);

// ===== Phase 2：Split ======================================================
phase('Split');
const split = await agent(splitterPrompt(plan), {
  label: 'splitter',
  phase: 'Split',
  model: 'haiku',
  schema: WorkItemsSchema,
});

let items = (split && split.items) ? split.items.slice() : [];
if (items.length === 0) {
  log('SPLITTER 未產出任何 work item，結束。');
  summary.status = 'no-tasks';
  summary.stoppedBy = 'no-tasks';
  summary.tokenSpent = budget.spent();
  return summary;
}

// 軟上限：KICKOFF 的 budget_tasks（若有）
const taskCap = (plan.budgetTasks && plan.budgetTasks > 0) ? plan.budgetTasks : items.length;

// 依 fileScope 交集分組 + 依優先序排序
items.sort(byPriority);
const { parallelBatch, serialBatch } = groupByConflict(items);
parallelBatch.sort(byPriority);
serialBatch.sort(byPriority);
log(`work items：${items.length}（可平行 ${parallelBatch.length} / 序列 ${serialBatch.length}），軟上限 ${taskCap} 項`);

// ===== Phase 3：Execute ====================================================
// pipeline(items, implement, test)：stage 間無 barrier，逐項流水線。
// implement(opus, worktree) 重試1次；test(sonnet) 重試1次。
// 併發以「分批」控制：parallelBatch 切成每批 PARALLELISM 個，序列批每批 1 個。
phase('Execute');

const verdicts = [];        // 所有跑完的 verdict（含失敗）
let consumed = 0;           // 已投入的項數（對 taskCap 軟上限）
let stopNewWork = false;    // budget 觸頂 → 停派新項

function budgetLeft() { return budget.spent() < CAP; }

// implement stage callback（pipeline 用）
const implementStage = async (item) => {
  if (!budgetLeft()) { throw new Error('budget-cap'); }
  const impl = await withRetry(
    (note) => implementPrompt(item, note),
    { label: `impl-${item.id}`, phase: 'Execute', model: 'opus', isolation: 'worktree', schema: ImplementSchema },
    (r) => r && r.success === true,
  );
  if (!impl || impl.success !== true) {
    // 實作失敗 → 拋出讓 pipeline 把該 item 後續 stage 跳過
    throw new Error(`implement-failed:${item.id}:${impl ? (impl.error || 'unknown') : 'null'}`);
  }
  return impl;
};

// test stage callback
const testStage = async (impl, item) => {
  if (!budgetLeft()) { throw new Error('budget-cap'); }
  const verdict = await withRetry(
    (note) => testPrompt(item, impl, note),
    { label: `test-${item.id}`, phase: 'Execute', model: 'sonnet', schema: VerdictSchema },
    (r) => r && r.passed === true,
  );
  if (!verdict) {
    // 測試 agent 完全沒回 → 標 needs-attention
    return { id: item.id, passed: false, verdict: 'needs-attention', title: item.title,
             worktreePath: impl.worktreePath, worktreeBranch: impl.worktreeBranch, commit: impl.commit,
             notes: 'TEST agent 無回應' };
  }
  // 補齊交接欄位（防 test agent 漏帶）
  if (!verdict.worktreePath) verdict.worktreePath = impl.worktreePath;
  if (!verdict.worktreeBranch) verdict.worktreeBranch = impl.worktreeBranch;
  if (!verdict.commit) verdict.commit = impl.commit;
  if (!verdict.title) verdict.title = item.title;
  return verdict;
};

// 跑一批（透過 pipeline）；每項失敗回 null（filter 掉）並記錄
async function runBatch(batch) {
  if (batch.length === 0) return;
  // taskCap / budget 雙重節流：只取還能塞進軟上限的項
  const room = Math.max(0, taskCap - consumed);
  const slice = batch.slice(0, room);
  if (slice.length === 0) { stopNewWork = true; return; }
  consumed += slice.length;

  // pipeline：每個 item 獨立流過 implement → test
  const results = await pipeline(slice, implementStage, testStage);
  for (let i = 0; i < slice.length; i++) {
    const item = slice[i];
    const r = results[i];
    if (r && r.passed === true) {
      verdicts.push(r);
      summary.completed.push(item.id);
    } else if (r && r.id) {
      verdicts.push(r);              // 測試未過但有 verdict（needs-attention / fail）
      summary.failed.push(item.id);
    } else {
      // r 為 null：implement throw（失敗或 budget-cap）
      summary.failed.push(item.id);
    }
  }
}

// 先跑可平行批（每批 PARALLELISM 個併發）
for (const grp of chunk(parallelBatch, PARALLELISM)) {
  if (!budgetLeft()) { stopNewWork = true; break; }
  if (consumed >= taskCap) { stopNewWork = true; break; }
  await runBatch(grp);
}

// 再序列跑序列批（每批 1 個，避免共用檔案競態）
if (!stopNewWork) {
  for (const it of serialBatch) {
    if (!budgetLeft()) { stopNewWork = true; break; }
    if (consumed >= taskCap) { stopNewWork = true; break; }
    await runBatch([it]);
  }
}

// 標記未投入的項為 pending（budget / 軟上限耗盡）
const investedIds = new Set([...summary.completed, ...summary.failed]);
for (const it of items) {
  if (!investedIds.has(it.id)) summary.pending.push(it.id);
}
summary.stoppedBy = !budgetLeft() ? 'budget-cap'
  : (summary.pending.length > 0 ? 'task-cap' : 'queue-empty');
log(`執行完成：通過 ${summary.completed.length}、未過 ${summary.failed.length}、待隔天 ${summary.pending.length}（止於 ${summary.stoppedBy}）`);

// ===== Phase 4：Integrate ==================================================
// 序列收斂：只把「通過驗收」的 verdict 交給 INTEGRATOR 合回 feature branch。
phase('Integrate');
const passed = verdicts.filter((v) => v && v.passed === true);

let integ = null;
if (passed.length === 0) {
  log('無通過驗收的項目，略過收斂。');
} else {
  integ = await agent(integratorPrompt(passed, branchHint, night), {
    label: 'integrator',
    phase: 'Integrate',
    model: 'opus',
    schema: IntegrateSchema,
  });
  if (integ) {
    summary.branch = integ.branch || summary.branch;
    summary.pushed = !!integ.pushed;
    summary.conflicts = (integ.conflicts || []).slice();
    // 收斂衝突的項從 completed 移到 conflicts 統計
    summary.completed = summary.completed.filter((id) => !summary.conflicts.includes(id));
    log(`收斂：合併 ${(integ.merged || []).length} 項，衝突跳過 ${summary.conflicts.length} 項，pushed=${summary.pushed}`);
  } else {
    log('INTEGRATOR 無回應（被略過）。');
  }
}

// ===== Phase 5：Report =====================================================
phase('Report');

// 預組跨晚待續隊列（carryover）：pending（budget/07:00 硬停/軟上限）+ failed + conflict。
// 已完成項（completed，commit 帶 night(<id>) 標記）不在此列，隔晚 PLANNER 會自動跳過。
const carryover = [];
for (const id of summary.pending) {
  carryover.push({ id, status: 'pending', reason: '本晚未投入（' + summary.stoppedBy + '：budget 耗盡 / 07:00 硬停 / 軟上限），隔晚自動接續', nextStep: '隔晚 PLANNER 會重新排入隊列' });
}
for (const id of summary.failed) {
  const v = verdicts.find((x) => x && x.id === id);
  carryover.push({ id, status: 'failed', reason: (v && (v.notes || (v.failedChecks && v.failedChecks.join('; ')))) || '實作/測試未通過', nextStep: '隔晚重試；卡點見上方狀態表' });
}
for (const id of summary.conflicts) {
  carryover.push({ id, status: 'conflict', reason: '收斂時合併衝突，worktree branch 已保留', nextStep: '白天人工解衝突，或隔晚重做' });
}

const reportPayload = {
  status: 'done',
  branch: summary.branch,
  tonightTasks: summary.tonightTasks,
  skippedDone: summary.skippedDone,   // 跨晚 resume：先前已完成、本晚跳過的 task id
  completed: summary.completed,
  failed: summary.failed,
  conflicts: summary.conflicts,
  pending: summary.pending,
  carryover,                          // 跨晚待續隊列（未完成/失敗的 task + 原因 + 下一步）
  pushed: summary.pushed,
  stoppedBy: summary.stoppedBy,
  tokenSpent: budget.spent(),
  budgetCap: CAP,
  verdicts: verdicts.map((v) => ({ id: v.id, passed: v.passed, verdict: v.verdict, title: v.title, notes: v.notes, failedChecks: v.failedChecks })),
  integrate: integ,
};

const report = await agent(reporterPrompt(reportPayload, AUTO_DEPLOY), {
  label: 'reporter',
  phase: 'Report',
  model: 'haiku',
  schema: ReportSchema,
});

if (report) {
  summary.previewUrl = report.previewUrl || '';
  summary.pendingDecisions = (report.pendingDecisions || []).slice();
  if (report.summary) log(report.summary);
}

// 跨晚待續隊列回傳給頂層（與 REPORTER 寫進 PROGRESS 的 carryover 一致）
summary.carryover = (report && report.carryover && report.carryover.length) ? report.carryover.slice() : carryover;

summary.status = 'done';
summary.tokenSpent = budget.spent();
log(`夜跑結束：完成 ${summary.completed.length}、失敗 ${summary.failed.length}、衝突 ${summary.conflicts.length}、待隔天 ${summary.pending.length}（carryover ${summary.carryover.length} 項，隔晚自動接續、已完成不重做）；token ${summary.tokenSpent}/${CAP}；止於 ${summary.stoppedBy}`);

return summary;
