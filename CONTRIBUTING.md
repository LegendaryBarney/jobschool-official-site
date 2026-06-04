# 貢獻指南

> 本指南給協作工程師看。業主向的內容編輯流程請見 [docs/CONTENT_EDITING.md](./docs/CONTENT_EDITING.md)。

---

## 1. 開發流程總覽

```
feature/* → dev → main → Vercel 正式環境
              └→ Vercel preview deploy
```

| 分支 | 用途 | 誰能 push |
|---|---|---|
| `main` | 部署主幹，每次 push 觸發正式環境部署 | 僅維護者透過 PR merge |
| `dev` | 整合分支，集中所有 feature/fix 後再合 main | PR merge |
| `feature/*` | 新功能開發（如 `feature/teacher-detail-page`） | 開發者本人 |
| `fix/*` | bug 修復（如 `fix/form-phone-validation`） | 開發者本人 |
| `chore/*` | 設定、依賴、CI 等雜項（如 `chore/upgrade-astro-5-19`） | 開發者本人 |
| `docs/*` | 純文件變更 | 開發者本人 |

> **絕對不要直接 push 到 `main`。** 任何變更走 PR。

---

## 2. Conventional Commits 規範

Commit 訊息**統一使用英文**，採 [Conventional Commits 1.0](https://www.conventionalcommits.org/)。

格式：

```
<type>(<scope>): <subject>

[optional body]
[optional footer]
```

- `<type>`：見下表
- `<scope>`：選填，描述影響範圍（如 `home`、`form`、`cms`、`seo`）
- `<subject>`：祈使語氣動詞開頭、英文小寫、不加句點，建議 ≤ 72 字元

### 常用 type 與範例

| type | 用途 | 範例 |
|---|---|---|
| `feat` | 新增功能 | `feat(home): add hero section with brand tokens` |
| `fix` | 修 bug | `fix(form): correct phone number regex for 09xx-xxxxxx` |
| `docs` | 文件 | `docs: update README with env variables` |
| `refactor` | 重構（不影響行為） | `refactor(seo): extract jsonld helpers into lib` |
| `chore` | 雜項（依賴、設定） | `chore: upgrade astro to 5.18.1` |
| `style` | 格式（純空白、括號等，不影響邏輯） | `style: prettier apply on src/components` |
| `perf` | 效能優化 | `perf(home): defer GSAP load until after first paint` |
| `test` | 測試 | `test(form): add zod schema unit tests` |
| `ci` | CI/CD 設定 | `ci: add lighthouse-ci on preview deploys` |

### 多行 commit body 建議

當改動需要解釋「為什麼」時，加 body：

```
fix(form): debounce turnstile retry on network failure

Turnstile widget was retrying immediately on transient network
errors, causing rate-limit hits on Cloudflare's side. Now waits
500ms before each retry, max 3 retries.

Refs: #142
```

---

## 3. PR 流程

1. 從最新的 `dev` 開出 `feature/<short-name>`
   ```bash
   git checkout dev && git pull
   git checkout -b feature/teacher-card-hover
   ```
2. 開發 + commit（**一個 commit 一件邏輯事情**，避免「全部寫完一個大 commit」）
3. push 到遠端
   ```bash
   git push -u origin feature/teacher-card-hover
   ```
4. 在 GitHub 開 PR：**base 為 `dev`**，描述可中文，含：
   - 改了什麼、為什麼
   - 螢幕截圖（若有 UI 變動，附桌機 + 手機兩張）
   - 對應的 RFP 段落或 issue 編號
5. 自動觸發 Vercel preview deploy；自我先檢查 preview URL 無破版
6. 通過 review 後 **squash merge** 到 `dev`，並刪除 feature 分支
7. 維護者整批從 `dev` PR 到 `main`，merge 後 Vercel 自動部署正式環境
8. 上線後手動 smoke test：首頁 / 課程頁 / 部落格 / 試聽表單

> **不要在 PR 之間 force-push 到自己的 feature 分支**，會打亂 reviewer 的 diff context。如要整理 history，留到 squash merge 時系統會自動處理。

---

## 4. 程式碼風格

### TypeScript

- 全站 `tsconfig.json` 已啟用 `strict: true`
- 不允許 `any`（除非標註 `// @ts-expect-error <reason>`）
- 公開元件 props 必須標註 `interface Props { ... }`
- 工具函式必須有 return type

### 格式化

- **Prettier** 已配置（`.prettierrc` + `prettier-plugin-astro`）
- 提交前執行 `npx prettier --write .` 或開啟 IDE auto-format
- **ESLint 尚未配置**，預計 v1.1 加入；目前依靠 `astro check` 與 Prettier

### 命名慣例

| 種類 | 規範 | 範例 |
|---|---|---|
| Astro 元件 | PascalCase + `.astro` | `TeacherCard.astro` |
| React Island | PascalCase + `.tsx` | `TrialForm.tsx` |
| 工具函式檔 | camelCase + `.ts` | `seo.ts`、`jsonld.ts` |
| Content collection 目錄 | 全小寫複數 | `teachers/`、`posts/` |
| Markdown 檔名 | kebab-case | `high-school-math.md` |
| CSS class（自訂，非 Tailwind） | kebab-case | `teacher-card`、`course-grid` |
| TS interface / type | PascalCase | `TeacherCardProps` |
| 變數 / 函式 | camelCase | `getFeaturedTeachers()` |
| 常數 | SCREAMING_SNAKE | `MAX_POSTS_PER_PAGE` |

### 註解原則

- **不寫註解，除非業務邏輯特別不直觀**（如 RFP §3.3）
- 寧可拆函式 + 取好名字，也不要寫一段「這段在做什麼」的註解
- 例外：演算法選擇理由、瀏覽器相容 hack、TODO 留待未來重構的標記

---

## 5. 測試

> 目前**沒有測試框架**，預計 Phase v1.1 加入：
> - **Vitest**：unit tests（zod schema、SEO 工具、jsonld 生成）
> - **Playwright**：e2e（試聽表單填寫流程、CMS 編輯後重新 build）

在測試框架就位前，請：
- 改完 push 前**手動瀏覽自己改動的頁面**（桌機 + 手機 viewport）
- 跑 `npm run check`（TypeScript + Astro check 必須無錯）
- 跑 `npm run build`（必須 build 過；warning 也要看一下）
- 試聽表單變動：手動填一次假資料看 console 與 network
- SEO 改動：用 [Rich Results Test](https://search.google.com/test/rich-results) 驗證 JSON-LD

---

## 6. 不要做的事

| 行為 | 為什麼不要 |
|---|---|
| 直接 push 到 `main` | 會跳過 preview 與 review，部署失敗會直接掛掉正式站 |
| `git commit --no-verify` | 跳過 hook 檢查；hook 失敗請修問題，不要繞過 |
| `git push --force` 到 `dev` 或 `main` | 會洗掉別人 commit；若 force 自己的 feature 分支，等 squash merge 自動處理 |
| 修 `src/content/*.md` 內容檔 | 內容請走 Decap CMS（`/admin`），由業主編輯；工程師動內容會踩到業主版本 |
| 直接改 `dist/` | 是 build 產物，每次 build 會被覆蓋 |
| 把 secret 寫死在程式碼 | 全部走 `.env`；`PUBLIC_` 前綴才會被打包到前端 |
| 引入新的 runtime 依賴卻沒在 PR 描述說明 | review 看不到差異；任何 new dep 請在 PR 描述列出用途 + bundle size 影響 |
| 提交大型二進制檔（> 500KB）到 git | 圖片走 `public/uploads/`（由 Decap 管理）或考慮 Cloudinary |
| 改 BRAND_GUIDELINES.md 的設計規範 | 那是品牌規範，需業主同意；工程實作請對齊它，不是反過來 |

---

## 7. 環境設定 / IDE 建議

- VS Code：安裝 Astro、Tailwind CSS IntelliSense、Prettier 三個 extension
- 開啟 format on save
- `tsconfig.json` 已啟 path alias `~/*` → `src/*`，import 請優先用 alias

---

## 8. 文件責任

任何改動若影響：
- 新增 / 移除環境變數 → 同步更新 `README.md` 環境變數表 + `.env.example`
- 新增 / 大改元件 → 同步更新 `docs/COMPONENT_INDEX.md`
- 新增頁面或路由 → 同步更新 `docs/SITE_ARCHITECTURE.md`
- 新增 / 升級重要 dependency → 同步更新 `docs/THIRD_PARTY_LICENSES.md`

文件未同步是常見的 PR review reject 原因。
