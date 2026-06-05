// 將 pagefind 索引從 Vercel 部署根（.vercel/output/static/pagefind）
// 複製一份到 dist/client/pagefind，讓本地 `astro preview` 也能搜尋。
//
// 線上正確性優先：索引一律先產到 .vercel/output/static（Vercel adapter 實際部署的靜態根），
// 這裡只是順手把同一份索引鏡像到 dist/client 供本地預覽，缺檔/失敗都不影響 build。
import { cp, rm, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const src = path.join(root, '.vercel', 'output', 'static', 'pagefind');
const distClient = path.join(root, 'dist', 'client');
const dest = path.join(distClient, 'pagefind');

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(src))) {
    console.warn('[copy-pagefind] 找不到來源索引，略過：' + src);
    return;
  }
  if (!(await exists(distClient))) {
    console.warn('[copy-pagefind] 無 dist/client（純 Vercel build），略過本地鏡像。');
    return;
  }
  await rm(dest, { recursive: true, force: true });
  await cp(src, dest, { recursive: true });
  console.log('[copy-pagefind] 已鏡像 pagefind 索引到 dist/client/pagefind 供本地預覽。');
}

main().catch((err) => {
  // 鏡像失敗不應讓 build 失敗（線上索引已就位）
  console.warn('[copy-pagefind] 鏡像失敗（不影響線上）：', err?.message ?? err);
});
