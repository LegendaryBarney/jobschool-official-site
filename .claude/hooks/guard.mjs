#!/usr/bin/env node
// PreToolUse 守門員：攔截 CLAUDE.md 紅線（production / 破壞性操作）。
// 退出碼 2 = 阻擋該工具呼叫，stderr 內容回傳給模型。退出碼 0 = 放行。
// 此為「雙保險」：settings.json 的靜態 deny 樣式抓不到的變體（站在 main 上直接 push、
// 旗標順序不同等），由本 hook 以實際邏輯攔下。
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

function block(reason) {
  process.stderr.write(`[guard] 已阻擋：${reason}\n`);
  process.exit(2);
}

let data = {};
try {
  data = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0); // 解析失敗不阻擋一般流程
}

const tool = data.tool_name || '';
const raw = (data.tool_input && data.tool_input.command) || '';
if ((tool !== 'Bash' && tool !== 'PowerShell') || !raw.trim()) process.exit(0);

const c = raw.replace(/\s+/g, ' ').trim();

// 1) force push
if (/\bgit\b[^\n]*\bpush\b[^\n]*(--force\b|--force-with-lease\b|(?:^|\s)-f(?:\s|$))/.test(c))
  block('force push（CLAUDE.md 紅線）。');

// 2) reset --hard / clean -f
if (/\bgit\s+reset\s+--hard\b/.test(c)) block('git reset --hard（會丟棄變更）。');
if (/\bgit\s+clean\s+-[a-wyz]*f/.test(c)) block('git clean -f（會刪未追蹤檔）。');

// 3) 刪除遠端分支
if (/\bgit\s+push\b[^\n]*--delete\b/.test(c) || /\bgit\s+push\b[^\n]*\s:[^\s]+/.test(c))
  block('刪除遠端分支。');

// 4) Vercel：全放行（業主決策 2026-06-21）。所有 vercel 操作（含 --prod / promote / dns /
//    domains / alias / rollback / rm / env rm）皆由 Claude 自動執行，本 hook 不再攔截。
//    註：settings.json 的靜態 deny 仍保留部分 vercel 規則，需業主自行移除才完全放行。

// 5) push 到 main：明確指定 main，或目前正站在 main 分支上
if (/\bgit\s+push\b/.test(c)) {
  if (/\bpush\b[^\n]*\bmain\b/.test(c) || /:main\b/.test(c))
    block('push 到 main（正式上線級）。請推 feature branch，main 由業主白天確認。');
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (branch === 'main' || branch === 'master')
      block(`目前在 ${branch} 分支，禁止從此分支 push。請先 git switch -c feat/<name> 切到 feature branch。`);
  } catch {
    // 取不到分支名時不阻擋（可能不在 git 倉庫內）
  }
}

process.exit(0);
