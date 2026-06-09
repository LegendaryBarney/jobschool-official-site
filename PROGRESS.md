# PROGRESS — 工作進度與斷點（接手 session 先讀這裡）

> 跨 session 的權威斷點檔。**任何新 session 啟動時，讀完 CLAUDE.md 後立刻讀本檔**，
> 即可知道：做到哪、有哪些設置、業主拍板了什麼、下一步、待決策。
> 記憶另存於 `~/.claude/projects/<本專案>/memory/`（索引 MEMORY.md，每 session 自動載入）。

最後更新：2026-06-07（內容更新批上線；業主新增更正處理中）

---

## ⭐ 完整交接（先讀這段，遷 session 不必重講）

### 這個專案是什麼
賈伯斯數理教室（嘉義精英小班補習班，創辦人黃韋誌 Barney）的新官網，取代舊 Weebly 站。Astro 5 + Tailwind 4 + React islands + Decap CMS，部署 Vercel。完整協定見 CLAUDE.md，品牌驗收見 BRAND_GUIDELINES.md，規格見 WEBSITE_RFP.md，內容地雷見 known_errors.md，業主最新更正見 `info_rement.md`。

### 我的角色（最重要）
**「代理業主 / orchestrator」**：規劃/切割/實作/測試都**派 subagent 做**，我只定義工作、發包、驗收、回報。**不過度發問**（瑣事自己決定）；只有真正商業/不可逆/需要業主資料才問（金鑰、品牌取捨、DNS、花錢）。驗證過的批次**直接 PR→main 部署**（業主已多次授權）。回報用繁中、直接、量化、白話（業主聽不懂 jargon）。

### 目前線上（production = main，Vercel 自動部署）
Live：**https://jobsofficialsite.vercel.app**（DNS 暫用 Vercel 網域，不切 jobsedu.com.tw）。已含：
- 首頁改版 **方向 D**（黑板手感×編輯誌字體×B 師資卡）、夜跑 N1–N12、上線前修正（pagefind 線上搜尋、breadcrumb 去重、安全修補）、UX（移除 LINE 彈窗、留白、CountUp、robots、404）、課程內頁 hero、OG 精簡。
- **全站無人物影像 25 張**：14 課程封面 + 6 教室/空間 + 4 部落格封面 + 1 LP hero（`src/assets/images/`，接 content cover/heroImage）。
- **內容更新批**：教師 8 位 profile 重寫（真名+正確科目，新增 Louis 侯恩平，6 張實照 webp，移除虛構引言）、FAQ 重寫 9 題、收費頁 `/fees`、課表頁 `/schedule`、社群連結（Footer + JSON-LD sameAs）、試聽 11→1。

### 兩大自建系統
1. **夜跑編排**：`.claude/workflows/night-orchestrate.mjs`（Workflow，PLANNER→SPLITTER→實作/測試 pipeline(worktree 隔離)→INTEGRATOR→REPORTER）。`.claude/scripts/night-run.ps1` 啟動器（排程 `JobschoolNightRun` **仍停用**，待驗 headless 觸發）。**呼叫用 scriptPath 不能用 name**。常駐分支 `feat/night`、07:00 停、跨晚 resume、budget 1.5M。日間我也用它跑批次（如內容更新批 C1–C6）。詳見 docs/NIGHT_RUN_DESIGN.md。
2. **圖片管線（免費）**：chrome-devtools MCP 連業主已登入的 Chrome → 驅動 Gemini 網頁(Nano Banana 2)生圖 → 點「下載原尺寸」(落 Downloads 為 `<uuid>.tmp`) → Bash 前後差集抓檔 → `sharp` 裁底 7% 去浮水印 → webp。prompt 在 `docs/image-prompts/`，末尾加「warm edge-to-edge, NO people, no text, 16:9」。dreamina(VIP)、Imagen API(免費額度0) 皆棄。**師資/家教實照**業主放 `src/assets/images/teachers/`。

### 安全/權限
`.claude/settings.json`（allow 白名單 + deny）+ `.claude/hooks/guard.mjs`（PreToolUse 守門：擋 push main / force push / reset --hard / vercel prod / 刪遠端）。**`git push` 與 `--base main` 別放同一條指令**（會誤觸 guard）；push 與 PR 要分開下。`.env` Write/Edit 被 deny（機密保護）。已登入 gh、vercel。

### 業主處理中/待辦（2026-06-07 更正，處理中見 §下一步）
- GA4 ID `G-6WM9G6HMGG`（業主授權寫入 Vercel env）、LINE URL（舊站 footer：`http://line.me/ti/p/@jfp3998u`）、4 個社群 URL（已在 seo.ts、要再進 env）、通知信箱 `hwjnctucsie92@gmail.com`。
- Python程式設計/高中社會＝**新開課程**(保留)；國小自然手作＝**停開**(下架)；Seba 補掛高中數學課 + 排程**新增週五在賈伯斯**；Chili(非 Chilli) 統一。
- 業主聽不懂也暫不做：Astro6 遷移（純技術維護、修小安全提醒、使用者無感）、Decap 後端（之後自編內容才需）。

### 重要檔案地圖
協定 CLAUDE.md｜品牌 BRAND_GUIDELINES.md｜規格 WEBSITE_RFP.md｜地雷 known_errors.md｜業主更正 info_rement.md｜退費表 refund.png｜權限 .claude/settings.json + hooks/guard.mjs｜夜跑 .claude/{scripts/night-run.ps1,workflows/night-orchestrate.mjs} + docs/NIGHT_RUN_DESIGN.md｜backlog docs/BACKLOG.md｜圖 prompt docs/image-prompts/｜記憶 ~/.claude/projects/<本專案>/memory/MEMORY.md。

---

## 夜跑 2026-06-05 — N6：全站 JSON-LD 逐頁稽核（用既有工廠，補缺漏）

工廠檔 `src/lib/jsonld.ts` 已具備完整工廠：localBusiness / educationalOrg / course / courseInstance / person / article / breadcrumb / faqPage / review / aggregateRating / itemList / blog / webPage。本晚只「逐頁稽核 + 用既有工廠補缺漏」，未新寫工廠。

逐頁稽核表：

| 頁面 | 應有 Schema | 稽核前現況 | 本晚補了什麼 |
|---|---|---|---|
| 首頁 `index.astro` | Organization + LocalBusiness + EducationalOrganization | localBusinessJsonLd（型別含 LocalBusiness+EducationalOrganization，@id #organization）+ educationalOrgJsonLd | 已齊全，無需補 |
| 課程總覽 `courses/index.astro` | CollectionPage（清單） | breadcrumb + educationalOrg + itemList（課程列表） | 已齊全，無需補 |
| 課程內頁 `courses/[slug].astro` | Course/Thing + BreadcrumbList | course + courseInstance + breadcrumb | 已齊全，無需補 |
| 師資總覽 `teachers/index.astro` | CollectionPage（清單） | educationalOrg + breadcrumb（缺清單） | **補 itemListJsonLd（師資列表）** 與課程總覽對齊 |
| 師資內頁 `teachers/[slug].astro` | Person + BreadcrumbList | person + breadcrumb | 已齊全，無需補 |
| 家教總覽 `tutors/index.astro` | CollectionPage | webPage + educationalOrg + breadcrumb | 已齊全，無需補 |
| 家教內頁 `tutors/[slug].astro` | Course/Thing + BreadcrumbList | course + breadcrumb | 已齊全，無需補 |
| 文章總覽 `posts/index.astro` | Blog/CollectionPage | blog + breadcrumb | 已齊全，無需補 |
| 文章內頁 `posts/[slug].astro` | BlogPosting/Article + BreadcrumbList | article + breadcrumb | 已齊全，無需補 |
| 文章標籤 `posts/tag/[tag].astro` | Blog + BreadcrumbList | blog + breadcrumb | 已齊全，無需補 |
| 見證 `testimonials.astro` | Review collection（可選） | aggregateRating + review[] + breadcrumb | 已齊全，無需補 |
| FAQ `faq.astro` | FAQPage | faqPage + breadcrumb | 已齊全，無需補 |
| 聯絡 `contact.astro` | ContactPage（若工廠存在） | localBusiness + breadcrumb | 工廠無 contactPageJsonLd（spec 註明「若工廠存在」），不新寫工廠，維持現況 |
| 關於 `about.astro` | EducationalOrganization | educationalOrg（頁面層）+ BreadcrumbList（由 `Breadcrumbs.astro` 元件自動輸出） | 已齊全，無需補（breadcrumb 由元件涵蓋，避免重複） |
| LP `lp/[campaign].astro` | WebPage + BreadcrumbList | webPage + breadcrumb | 已齊全，無需補 |
| 搜尋 `search.astro` | WebPage + BreadcrumbList | webPage + breadcrumb | 已齊全，無需補 |

關鍵稽核發現：`src/components/Breadcrumbs.astro` 元件本身會輸出一份 `BreadcrumbList` JSON-LD（component-level）。因此所有使用 `<Breadcrumbs>` 的頁面已自動帶 breadcrumb；部分頁面（如 courses/index、teachers/index）在頁面層 jsonLd 又各放一份 breadcrumbJsonLd，會與元件重複（既有狀況，本晚未擴大處理，列入待決策）。本晚不再為 about 等頁加頁面層 breadcrumb，以免新增重複。

本晚實際改動：
1. `src/pages/teachers/index.astro` — 新增 `itemListJsonLd` 師資列表（與 courses/index 對齊，補上「師資總覽頁缺清單型 schema」唯一缺口）。

待決策（留白天）：
- breadcrumb 重複：courses/index、teachers/index 頁面層 breadcrumbJsonLd 與 Breadcrumbs 元件輸出重複。建議擇一（保留元件版、移除頁面層），但屬既有狀況且 Google 容忍重複 @type，本晚依「補缺漏不改既有」原則未動。
- 是否新增 `contactPageJsonLd` / `collectionPageJsonLd` 工廠，把 contact 頁升級為 ContactPage、把總覽頁的 ItemList 包進 CollectionPage。目前用既有 ItemList + LocalBusiness 已能被 Google 正確解析；新增工廠屬「錦上添花」，本晚依「只用既有工廠」指示未做。

驗證：`npm run check` 綠、`npm run build` 綠；`dist/` 內 `application/ld+json` 命中涵蓋全部主要頁面類型；抽驗頁面 JSON.parse 無語法錯誤（見 commit）。

---

## 夜跑紀錄 — 2026-06-05｜N12 部落格分類/年份篩選維度補齊（RFP §5.3）

- **新增路由**：`src/pages/posts/year/[year].astro`（動態年份頁，`getStaticPaths` 由 `published` 的 `getFullYear()` 推導年份，篩出該年文章；版型沿用 tag 頁）。
- **index 入口**：`src/pages/posts/index.astro` 篩選區新增「年份」一列（連至 `/posts/year/<year>`），未動既有分類/標籤/列表結構。
- **驗證**：
  - `npm run build` 綠；產出 `.vercel/output/static/posts/year/2026/index.html`（adapter 為 vercel，故輸出在 `.vercel/output/static`，非 `dist/`）。
  - 2026 頁顯示「共 4 篇文章」，與 `src/content/posts/` 4 個 .mdx（全為 2026 年）數量相符，4 篇 slug 連結皆正確。
  - `npm run check` 0 errors（僅既有無關檔的 deprecation 警告/hints）。
- 目前 posts 僅 2026 一個年份；多年份時頁面會自動分裂，邏輯已涵蓋。

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

## 3b. N7 — 全站搜尋 + build 健康檢查（純驗證，2026-06-05 夜跑）

`npm run build` 成功（Astro build + Pagefind v1.5.2）。Pagefind 索引結果：

- **索引頁數**：51 頁（掃描 52 個 .html）、2131 詞、語言 `zh-hant-tw`。
- **`dist/pagefind/` 內容**：14 個頂層項目（`ls dist/pagefind/ | wc -l` = 14）。必要檔齊全：`pagefind.js`、`pagefind-ui.js`/`.css`、`pagefind-entry.json`、`.pf_meta`、`wasm.unknown.pagefind`，外加 `fragment/`（多個 `.pf_fragment`）與 `index/`（多個 `.pf_index`）子目錄。
- **中文查詢驗證**：靜態伺服器（http-server 服 `dist/client` + 複製 pagefind 進去）→ Playwright 開 `/search/` → Pagefind UI 正常 render → 輸入「**數學**」→ **回 37 筆結果**（標題/內文中文 mark 高亮正常）。
- 一句話：**Pagefind 索引 51 頁、14 個輸出檔；搜尋「數學」回 37 筆結果。**

**揪出 1 個正式部署待修問題（不在本 item 改檔範圍 src/pages/search.astro，列為待決策）：**

- `package.json` 的 `build` 用 `pagefind --site dist`，但 **@astrojs/vercel adapter 的靜態頁實際輸出在 `dist/client/`**（HTML 與 `_astro` 都在那），Pagefind 卻把索引寫到 `dist/pagefind/`（而非 `dist/client/pagefind/`）。production 部署的靜態根是 `dist/client`，會導致 `/pagefind/*` 與頁面路徑對不上、線上搜尋抓不到索引。
  - 另：`@astrojs/vercel` **不支援 `astro preview`**（`npm run preview` 直接報錯），本次改用 http-server 服 `dist/client` 驗證。
  - 建議修法（需業主/白天拍板，且會動到 `package.json`，超出本 item 範圍）：把 build 改為 `astro build && pagefind --site dist/client`（或對 Vercel 輸出結構確認正確的 site 路徑）。本 item 僅驗證搜尋引擎與中文 tokenization 可運作，未動 build 設定。

---

## 3.5 夜跑紀錄 — 2026-06-05

- **N11 — LP 快速複製機制文件化（RFP §1.2.4）**：完成。
  - 處置：`docs/CONTENT_EDITING.md` 已存在，依任務指示**併入既有檔**而非新建 `docs/LP_PLAYBOOK.md`。在目錄新增第 10 項，並於檔末（版本footer之前）新增 **§10「著陸頁（LP）快速複製 Playbook」**章節。
  - 章節內容：目的（LP 定位）、第 1 步複製檔案（`cp src/content/landing/summer-2026.md → <campaign>.md`）、第 2 步編輯 frontmatter（逐欄表：`campaign`/`title`/`headline`/`subheadline`/`heroImage`/`ctaLabel`/`ctaHref`/`startDate`/`endDate`/`published`）、第 3 步本地預覽（`npm run dev` → `localhost:4321/lp/<campaign>`）、第 4 步上線注意（getStaticPaths 自動發現 ✅；sitemap **刻意排除 `/lp/`**，不索引 ⚠️）。
  - 事實核對：文件欄位以 `src/content/config.ts` 的 `landing` collection 為準（**無** `id`/`slug`/`hero.title`，`campaign` 兼任識別碼與 URL slug）；範本檔實際為 `summer-2026.md`（非任務描述舉例的 `summer-camp.md`）；路由檔為 `src/pages/lp/[campaign].astro`；sitemap 排除規則來自 `astro.config.mjs` 的 `filter`。
  - 自測：`npm run check` 綠（純文件改動，未動程式 / 設定）。
  - commit：`night(N11): LP 快速複製機制文件化（RFP §1.2.4）`（feature branch，未 push、未合回）。

---

## 3b. 夜跑工作項紀錄

### 2026-06-05 夜 — N3 課程內頁排版複查（brand-prose 驗證、補殘留）

- **驗收結論：排版已滿足，未改動 .brand-prose 規則。**
- 方法：`npm run dev`（4321）→ Playwright 開 `/courses/elementary-science-craft`，截 1440px 與 390px 兩 viewport 全頁圖肉眼複查。
- 肉眼檢查結果：
  - 標題層級明顯：h2 為 serif 粗體、字級 28–32px、上留白 2.5rem，與內文對比清楚。
  - 清單有 bullet：ul 顯示 disc、ol 顯示數字，`li::marker` 為 caramel 焦糖金，markers 正常渲染。
  - 行距寬鬆：內文 line-height 1.85、li 1.8，閱讀舒適。
- 檢視 `src/styles/global.css` 既有 `.brand-prose`（L111–283）：已完整覆蓋 h2/h3/h4、ul/ol/li(::marker)、p、strong、blockquote、code/pre、img、hr、table。盤點 14 個課程 md 實際只用到 h2/ul/ol/blockquote/strong/p，全數已被規則覆蓋。
- 兩 viewport 皆無破版；故本次為純驗證，未對 CSS 做微調。

---

## 4. 下一步（依序）

1. **派 fix subagent** 修 §3 的 2 問題（scriptPath + feat/night 滾動分支 + REPORTER commit PROGRESS）。
2. 修好後**再跑一次 dry-run** 驗證 feat/night 滾動分支 + 跨晚 resume（連續兩任務或兩次跑驗證去重）。
3. 通過後：清理 dry-run 殘留、push `feat/home-d-redesign`、（業主白天）決定是否 PR 首頁改版進 main。
4. 啟用排程 `JobschoolNightRun`（業主說 go 才啟用）。
5. 低優先：數據區 CountUp 啟動延遲微調（`src/components/CountUp.tsx` threshold）。
6. 後續內容工：known_errors.md 一票事實/排版錯誤（價格 9300/12 節、科目對師、開業最多 12 年、班級人數、課程頁排版、導覽列底線跟頁籤）——可寫進 KICKOFF 交夜跑。

---

## 4.5 夜跑 N8 — npm audit 安全稽核（2026-06-05，純記錄，未升級）

> 本晚僅執行 `npm audit` 記錄現況，**未動任何套件**（修復多為 breaking change，留白天決策）。

### npm audit 結果
- 總計：11 vulnerabilities（low 1 / moderate 6 / high 4 / critical 0）
- high：4
- critical：0

逐筆 high（4 項，均為間接/直接相依，修復皆需 major 升級或 audit fix）：

1. **@astrojs/vercel**（direct，severity high）
   - 風險：依賴有漏洞的 `@vercel/routing-utils` 與 `astro`；含 Astro Unauthenticated Path Override via `x-astro-path` / `x_astro_path`（GHSA-mr6q-rp88-fx84）。
   - 修復建議：`@astrojs/vercel@10.0.8`（**breaking change，major**）。

2. **devalue**（transitive，severity high，CVSS 7.5）
   - 風險：Svelte devalue DoS via sparse array deserialization（GHSA-77vg-94rm-hx3p），現裝 5.6.3–5.8.0。
   - 修復建議：`npm audit fix`（**非 breaking**，可安全升級）。

3. **path-to-regexp**（transitive，severity high，CVSS 7.5）
   - 風險：path-to-regexp outputs backtracking regular expressions / ReDoS（GHSA-9wv6-86v2-598j），現裝 4.0.0–6.2.2，經由 `@vercel/routing-utils` 引入。
   - 修復建議：隨 `@astrojs/vercel@10.0.8`（**breaking change，major**）一併修復。

（第 4 筆 high 計數來自 `@astrojs/vercel` 相依鏈中 `@vercel/routing-utils`→`path-to-regexp` 的 high 影響傳遞，與第 1、3 點同源。）

### 待決策（留白天）
- 是否執行 `npm audit fix`（只升 `devalue`，非 breaking，風險低）。
- 是否吞 major 升級 `@astrojs/vercel@10.0.8`（修掉 path-to-regexp + path override，但 breaking，需回歸測試）。
- moderate 的 `astro`/`@astrojs/mdx`/`@astrojs/check`/`yaml` 升級皆為 major，暫不動。

---

## 夜跑 N2（2026-06-05）— known_errors 內容稽核與修正

對 known_errors.md 列出的 8 個內容準確性檢查點，逐項掃描 `src/content/`（teachers/courses/tutoring/testimonials/posts/faq/landing）。結論：先前 session 已套用絕大多數更正，本晚僅補 4 處殘留不符項。

| # | 檢查點 | 結果 |
|---|---|---|
| 1 | 價格（9,300/12 節·3hr；國中生物 4,650/12 節·1.5hr；1v1 個案報價） | 已符合（14 個課程 frontmatter 與 landing 學費表全部正確） |
| 2 | 師資資歷（Barney 15／Seba 7／豪理 15／Jason 5；新進 Joker、家教 Sandra/Chili） | 已符合（含 Joker 葉謹寬在地連結、Chili 職能治療背景） |
| 3 | 非「全台清交」用詞 | 已符合（一律用「臺、清、交、嘉義大學、高師大資歷的師資」，無「全台清交／師資皆具台清交」） |
| 4 | 班級規模（不寫死「6-10 人班」） | 已符合（一律極小班 2-5／精緻班 6-10／小班 10-14，皆強調小班/精緻） |
| 5 | 試聽政策（搶救/Python/國中社會/高中社會/手作=11 節；其餘=2 節；1v1=1 小時） | **已修正**：`faq/trial.md`、`faq/trial-fee.md` 原寫「1 堂免費試聽」低估政策，改為依課程 2 節／11 節／1 小時 |
| 6 | 不外包措詞（避免「不外包、不流動」廣告不實） | 已符合（全站無此類絕對化措詞） |
| 7 | 師生科目對應（避免邏輯矛盾，如 Barney 教高中化學、Jason 教高中物理） | 已符合（高中物理/化學→豪理；國中自然→Barney；見證/課程配對皆一致） |
| 8 | 考試用詞（會考／學測／分科測驗；指考為 2021 前舊稱） | **已修正**：`courses/pre-high-math-rescue.md` 移除「基測」（2014 起已由會考取代，對現役國三生為時代錯置）；其餘指考/分科測驗歷史框架皆正確 |

附帶修正（內容缺陷）：`faq/fees-invoice.md` 將外洩的 schema 欄位名「priceRange 資訊」改為「各課程的收費資訊」。

驗證：`npm run check`、`npm run build` 全綠。commit：`night(N2): known_errors 事實/邏輯/排版收尾稽核（剩餘未套用項逐一修）`。

---

## 4.6 夜跑 N9 — 字體載入優化驗收（2026-06-05）

對 `src/components/Fonts.astro` 做驗收，現況已滿足要求，**未改動程式碼**（冪等）：

- **font-display: swap**：有。所有 Google Fonts CSS URL 皆帶 `&display=swap`（preload、stylesheet、noscript 三處一致）。
- **preload**：有。對首屏字體 stylesheet 用 `<link rel="preload" as="style">`，搭配 `media="print" onload="this.media='all'"` 的非阻塞載入法，並有 `<noscript>` fallback。
- **subset 策略**：有。URL 帶 `&subset=chinese-traditional`，由 Google Fonts 端回傳 zh-TW subset CSS（內含對應 `unicode-range`），中文字不全量下載。
- **preconnect**：有。`fonts.googleapis.com` 與 `fonts.gstatic.com`（後者帶 crossorigin）皆已 preconnect，縮短首字節握手。

驗證：`npm run check` 0 errors、`npm run build` 通過；build 後 `dist/client/index.html` 的 `<head>` 仍含 preload/swap/subset/preconnect 全部標記。

結論：**排版已滿足 font-display & preload 要求**，本晚不改動。

建議（記錄不執行，屬大改）：
- 若要進一步壓 LCP，可改用 self-host woff2 + 手寫 `@font-face` 並自行切 unicode-range subset（去除 Google Fonts 第三方往返），但需引入字體授權與打包流程，屬換來源的大改，留待白天決策。
- `Fonts.astro:18` 的 `onload="this.media='all'"` 觸發 astro check 的 ts(6133) hint（非 error），屬標準 async-CSS pattern 的已知誤報，無需處理。

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

---

## 8. 夜跑執行記錄（2026-06-05 — 生產編排批次，常駐滾動分支 feat/night）

### 任務消化狀態

| ID | 標題 | 結果 | 說明 |
|---|---|---|---|
| N1 | 修正 SITE.founded 創立年份（2013 → 2014）並貫穿 JSON-LD | ✅ done | 全部 4 條驗收項目通過。(1) src/lib/seo.ts 第 101 行確認 founded: 2014。(2) src/ 目錄下 grep "2013" 無任何命中。(3) npm run check 0 errors 0 warnings（4 hints 為既有）；build 成功。(4) dist/client/about/index.html JSON-LD 確認 "foundingDate":"2014"。 |
| N2 | known_errors 事實/邏輯/排版收尾稽核 | ✅ done | 全部 3 項驗收通過。8 項稽核結果表完整（項目、結果、修正檔名）。grep 掃描 src/content/ 無發現「需更正」命中。npm run check 0 errors；npm run build 51 頁成功。 |
| N3 | 課程內頁排版複查（brand-prose 驗證、補殘留） | ✅ done | 全部 4 條驗收標準通過。PROGRESS 含截圖記錄（1440px 與 390px）；驗收結論明確；CSS 未改動；npm run check 0 errors / 0 warnings；npm run build 51 pages 全綠。 |
| N4 | 分析與像素基礎建設（env 驅動，缺值不渲染） | ✅ done | 全部 5 項驗收標準通過。dist HTML 無 fbq / google-site-verification；.env.example 含空值行；docs/ANALYTICS_SETUP.md 存在；npm run check/build 成功產出 52 HTML。 |
| N5 | 社群連結地基（env 驅動）+ JSON-LD sameAs 串接 | ✅ done | 全部 5 項驗收條件均通過。SITE.socials 結構正確；全空情境下 dist/client/index.html 不含 sameAs / aria-label；LocalBusiness JSON-LD 正常；npm run check 0 errors；npm run build 成功。 |
| N6 | 全站 JSON-LD 逐頁稽核（用既有工廠，補缺漏） | ✅ done | 全部 4 項驗收均通過。PROGRESS 逐頁稽核表涵蓋 16 種頁面類型；npm run build 後 dist/client 內 50 個 HTML；6 頁抽驗 21 個 JSON-LD blocks 0 語法錯誤；npm run check 0 errors；npm run build 51 頁全綠。 |
| N7 | 全站搜尋 + build 健康檢查（純驗證） | ✅ done | 所有 4 條驗收全綠。dist/pagefind/ 存在含 pagefind.js + 14 個頂層項目。索引 51 頁、14 個輸出檔、查詢「數學」回 37 筆結果。npm run check 0 errors；npm run build 成功。 |
| N8 | npm audit 安全稽核（純驗證 + 記錄） | ✅ done | 三項驗收標準全部通過。PROGRESS §4.5 完整記錄 11 vulnerabilities（low 1 / moderate 6 / high 4 / critical 0）摘要及逐筆 3 個 high 套件明細。無 critical；未升級任何套件；待決策清單留白天。 |
| N9 | 字體載入優化驗收（swap / preload / 中文 subset） | ✅ done | 三條驗收標準全部通過。PROGRESS §4.6 完整記錄現況；無程式碼變動；重新 npm run build 後全部 5 個字體 link 標籤依然正確；npm run check 0 errors / 0 warnings；npm run build 成功。 |
| N10 | RWD / 無障礙三斷點巡檢（1440 / 768 / 390） | ❌ failed | AC2 通過：390px 無水平捲軸驗證全 8 頁通過。AC3 通過：已修缺陷 2 處（/teachers 與 /posts 各加 sr-only h2）；未修項目說明完整。AC4 通過：npm run check = 0 errors；npm run build 乾淨完成。唯一失敗點為 AC1 格式問題：PROGRESS.md 的三斷點巡檢結果仍以散文段落記錄，缺少驗收要求的 pipe-delimited 表格（欄位：頁面 | 1440 | 768 | 390 | 破版清單 | 本晚改動）。 |
| N11 | LP 快速複製機制文件化（RFP §1.2.4） | ✅ done | 全部三條驗收通過。docs/CONTENT_EDITING.md §10「著陸頁快速複製 Playbook」存在；文件引用路徑與現況相符；§10.4(b) 明確說明 sitemap 排除 LP 路由；frontmatter 欄位表格與 src/content/config.ts 一致。 |
| N12 | 部落格年份篩選維度補齊 | ✅ done | 全部 5 條驗收通過。[year].astro 含完整 getStaticPaths；dist/client/posts/year/2026/index.html 產出；頁面顯示「共 4 篇文章」與 src/content/posts/ 吻合；posts/index.astro 篩選區新增「年份」一列；npm run check 0 errors；npm run build 成功。 |

### 卡在哪 / 下一步 / 預算

- **卡點**：N10（RWD 巡檢）因 AC1 格式缺陷失敗。PROGRESS 的三斷點巡檢結果形式為散文段落（§3b，第 76–93 行），缺乏驗收要求的結構化表格（欄位：頁面 | 1440 | 768 | 390 | 破版清單 | 本晚改動）。功能驗收（無水平捲軸、新增 sr-only h2、build 全綠）均已通過，僅格式不符。
- **下一步**：隔晚自動重試 N10（生成正確的表格格式 PROGRESS 記錄，重新 AC1 驗收）。
- **待決策**（留白天）：
  1. §3b N7 記錄的 `pagefind --site dist` 應改 `dist/client`（正式部署路徑問題，需業主/白天確認）。
  2. §4.5 N8 的安全升級決策：是否執行 `npm audit fix`（devalue）或吞 major 升級 `@astrojs/vercel@10.0.8`。
  3. §3 N6 的既有重複：courses/index、teachers/index 頁面層 breadcrumbJsonLd 與 Breadcrumbs 元件輸出重複，建議擇一移除（已記錄，屬後續優化）。
- **預算**：Token 消耗 736,683 / 1,500,000 cap（49.1%）；終止條件 queue-empty（所有排定任務已完成或失敗）。

### 跨晚待續隊列（carryover）

| ID | 狀態 | 原因 | 下一步 |
|---|---|---|---|
| N10 | failed | AC1 格式問題：PROGRESS.md 的三斷點巡檢結果缺乏 pipe-delimited 表格記錄。8 頁 × 3 斷點的檢查點數量（24）已超過最低要求（12），但缺乏逐頁逐斷點的結構化表格記錄。功能驗收（AC2/AC3/AC4）均已通過，僅格式不符。 | 隔晚重試：重新生成 pipe-delimited 表格（欄位：頁面 \| 1440 \| 768 \| 390 \| 破版清單 \| 本晚改動），補入 PROGRESS；重新驗收 AC1。 |

### 整合與推送

**分支合併**：feat/night 為常駐滾動分支，採 cherry-pick 序列收斂（N7,N8,N11,N1,N2,N3,N4,N5,N6,N9,N12），每項保留 night(Nn): commit 標記。最終 tip 已成功 push 到 origin/feat/night。

**程式碼品質**：每次合併後跑 npm run check 全綠（0 errors/0 warnings/4 既有 hints）；最終 npm run build 綠（52 頁、Pagefind 重新索引成功）。

**衝突處理**：5 處 PROGRESS.md 純追加型 log 段落衝突（cherry-pick 時自動合併；N9 段落改編號為 §4.6 避免與 N8 §4.5 重號）；無程式碼衝突。

**清理狀態**：10/11 worktree 目錄已移除；N7 worktree 已 git worktree prune（磁碟目錄被鎖定無法刪，留白天）；11 個 worktree-* 本地分支 ref 未刪除（commit 均安全在 feat/night，無害留白天清）。3 個 dry-run 殘留未追蹤檔已移除。

**禁止操作**：未碰 main、未做任何 production 或破壞性操作。

---

## 夜跑 2026-06-05 — N10（carryover 重做）：RWD 三斷點巡檢表格（AC1 補正）

> 前次 N10 因 AC1 缺 pipe-delimited 表格而 failed。本次以 chrome-devtools MCP（Playwright MCP 在本環境未提供）重跑巡檢並補上結構化表格。
> 量測法：每頁每斷點注入 script 比對 `documentElement.scrollWidth` vs `clientWidth`（差 >1px 即判定水平溢出），並列出 `getBoundingClientRect().right > viewport` 的破版元素（排除 `position:fixed` 與 marquee 跑馬燈這類刻意 overflow:hidden 容器內的子元素）。斷點：1440（桌機）、768（平板）、390（手機，用 device emulation 確保真實 390px 寬）。

| 頁面 | 1440 | 768 | 390 | 破版清單 | 本晚改動 |
|---|---|---|---|---|---|
| 首頁 `/` | ✅ 無溢出 | ✅ 無溢出 | ✅ 無溢出 | 無（hero 科目跑馬燈 marquee-track 寬度超出屬刻意設計，父層 overflow:hidden，不計） | 無需修 |
| 課程總覽 `/courses` | ✅ 無溢出 | ✅ 無溢出 | ✅ 無溢出 | 無 | 無需修 |
| 課程內頁 `/courses/high-math-grade-10` | ✅ 無溢出 | ✅ 無溢出 | ✅ 無溢出 | 無 | 無需修 |
| 師資總覽 `/teachers` | ✅ 無溢出 | ✅ 無溢出 | ✅ 無溢出 | 無 | 無需修 |

量測數值（scrollWidth = clientWidth 即無溢出；1440/768 的 15px 差為捲軸寬，非破版）：

- 首頁：1440→1440=1440、768→768=768、390→390=390。
- 課程總覽：1440→1425=1425、768→753=753、390→390=390。
- 課程內頁：1440→1425=1425、768→753=753、390→390=390。
- 師資總覽：1440→1425=1425、768→753=753、390→390=390。

結論：**4 頁 × 3 斷點全數無水平溢出、無破版**，本晚無 CSS/layout 改動（純驗證）。截圖留存於 `.rwd-shots/`（gitignored）。前次 N10 已補的 `/teachers`、`/posts` sr-only h2 仍在位，未回退。

備註：環境 MCP — **Playwright MCP 未提供**（ToolSearch 查無 `mcp__playwright__*`），改用 **chrome-devtools MCP**（`mcp__chrome-devtools__*`）完成導覽 + emulation + 截圖，截圖能力正常可用。dev 路由為 `trailingSlash` 嚴格：`/courses`（無尾斜線）正確，`/courses/` 在 dev 回 404（巡檢時已修正 URL）。

---

## 2026-06-07 — 夜跑批次（branch: feat/night）

### 任務消化狀態

| ID | 標題 | 結果 | 說明 |
|---|---|---|---|
| C1 | night(C1): 修正試聽節數 11 → 1 | ✅ done | 全部 4 項驗收通過。(1) grep -rn "11 節\|11節" src/ 0 命中，無試聽節數殘留。(2) 5 門課（pre-high-math-rescue、python-programming、junior-social-studies、senior-social-studies、elementary-science-craft）trialLessons 均為 1。(3) npm run check: 0 errors, 0 warnings（4 hints 為既有與此 item 無關）。(4) npm run build: 成功，prebuild 重新產生 llms.txt/llms-full.txt，pagefind 索引 52 頁，無任何錯誤。 |
| C2 | night(C2): 教師 Profile 重寫 + 新增 Louis + 接上實照 | ✅ done | 所有主要驗收項目通過：8 位老師 profile（barney/hao-li/seba/jason/joker/chili/sandra/louis）name、englishName、title、subjects、roles 均與 info_rement.md 一致。barney subjects 收斂至 5 科；jason 收斂為國中數學 + 升高中銜接基礎班；joker 移除國小英文；chili title 改為「專職一對一國中和高中英文家教」；sandra subjects 對齊高中英文作文/高中英文/國中英文。Louis（侯恩平）新增完整，photo/subjects/roles/title 正確，yearsOfExperience 留空。6 張 webp 均存在；haoli 與 seba 各超出 1px（1201 vs ≤1200），屬 sharp resize 進位捨入，非阻塞問題。Joker、Sandra 均無 photo 欄位，text fallback 正常。無 Xenia 文字。npm run check：0 errors、0 warnings、4 hints（皆為既有）。npm run build：綠燈，165 張圖片處理完成，54 頁建置。待白天確認：(1) Chili vs Chilli 拼法；(2) haoli/seba webp 寬度修正（可選）；(3) barney/jason courses 掛名老師與 subjects 一致性。 |
| C3 | night(C3): FAQ 下架重寫為業主的 9 題 | ✅ done | 全部 9 項驗收均通過。src/content/faq/ 恰好 9 個 .md。各題 frontmatter 正確（question/category/order）。禁用詞（親愛的、秒懂、開掛、無敵、保證、絕對、最強、Xenia）grep 零命中。Q6 pricing.md 含「多數課程一季 12 節、共 9,300 元」及「撥打諮詢專線 05-2230303」。Q7 refund-policy.md 含嘉義市政府規定（90%/80%/50%/0% 四級）+ 季繳舊生本班優規。npm run check：0 errors，0 warnings。npm run build：成功完成，52 頁靜態產出。FAQPage JSON-LD：dist/client/faq/index.html 含 FAQPage schema，mainEntity 共 9 個 @type=Question，與 9 題內容完全對應。 |
| C4 | night(C4): 社群連結接線（真實 URL） | ✅ done | 全部 5 項驗收通過。SITE.socials 的 4 個 URL（instagram/facebook/youtube/googleBusiness）與 info_rement.md 逐字吻合。dist/client/index.html 中每個 URL 出現 2 次（Footer 連結 + JSON-LD sameAs）。youtube percent-encoded URL 亦正確渲染。JSON-LD LocalBusiness sameAs 陣列確認含全部 4 個 URL。npm run check 0 errors，4 hints 為既有無關項目。npm run build 綠燈完成（52 頁索引）。 |
| C5 | night(C5): 收費・退費政策頁（/fees）驗收 | ✅ done | 全部 11 條驗收通過。fees.astro 存在並成功 build 至 dist/client/fees/index.html。policy.json 完整儲存七大區塊資料；季繳三檔價格（9300/4650/10800）、半年繳 18600/24 節、家教 12 節計費公式、新生計費最低五節、繳費方式現金＋ATM 轉帳說明均與 info_rement.md 一致。退費含市府四階段規定與季繳舊生本班優規 13 列 HTML 表格、4 堂 highlight 列正確標示。Nav.astro 與 Footer.astro 均加入 /fees 連結。無禁用詞彙，書面繁中語氣。npm run check 0 errors；npm run build 綠。 |
| C6 | night(C6): 請假補課政策 + 兩教室課表（新頁/區） | ✅ done | 全部 11 項驗收通過。schedule.astro 存在，build 產出 /schedule/index.html（53 頁全綠）。請假補課規則 5 層次全部到位。補課券發放規則：套裝/客製化 每滿4節1張；半年繳不發；季繳 3/2/1 張；家教每期1次額度＋超額加50/全勤降50。5 位老師課表（Barney/Seba/Jason/Joker/豪理）JSON 檔齊全，教室與週次分配正確。Sandra/Louis/Chili 0 次出現於 schedule。HTML table 套用品牌 token，語意正確。390px 無水平溢出：外層 overflow-x-auto，table min-w-[640px] 內捲。Nav 新增「課表」→ /schedule；Footer 新增「課務說明與課表」。書面語氣正常，無禁用詞。npm run check：0 errors、0 warnings、4 hints（均為既有）。npm run build：53 頁，0 errors。唯一留白：各教室逐節時段與實際開班科目對應未在來源中提供，頁面加注「以現場公告為準」。 |

### 卡在哪 / 下一步 / 預算

- **無卡點**：全部 6 項任務成功驗收並整合回 feat/night。
- **下一步**（業主決策）：預留「待決策」項列於下方；業主白天決定是否 cherry-pick 各項內容進 main 或累積至下次大推進。
- **待決策**（留白天，勿自行拍板）：
  1. Chili vs Chilli 拼法（C2）。
  2. haoli.webp / seba.webp 寬度各 1px 超規修正（C2，可選）。
  3. barney/jason courses 掛名老師與 subjects 一致性（C2，屬 courses item 範疇）。
  4. 各教室逐節時段與實際開班科目對應來源（C6，現已加註「以現場公告為準」）。
- **預算**：Token 消耗 513,824 / 1,500,000 cap（34.3%）；終止條件 queue-empty（所有排定任務已完成）。

### 跨晚待續隊列（carryover）

無。所有 6 項排定任務於本晚全數完成，0 失敗、0 衝突，已序列收斂回 feat/night 並 push 到 origin/feat/night。

### 整合與推送

**分支合併策略**：feat/night 為常駐滾動分支，採 cherry-pick 序列收斂（C1→C6），每項保留 night(Cn): commit 標記。合併過程中遇到衝突（C3 與 C1 的 trial.md/trial-fee.md 刪除衝突，C6 與 C5 的 Nav/Footer/config.ts 加性衝突）均已解決，最終整合無殘留衝突標記。

**驗收流程**：每併一項跑 npm run check（均 0 errors / 0 warnings，4 hints 為既有無關）；C6 合併後另跑完整 npm run build 綠燈（fees/schedule/faq 頁面皆產出，pagefind 索引完成）；併入後重新產生 public/llms.txt / llms-full.txt 同步內容，獨立 commit。

**推送狀態**：已 push origin/feat/night（2cb0b9e..c2f2f49），共 6 個 night(Cn): commit 加 1 個 llms 同步 commit。

**清理狀態**：6 個已成功併入的 worktree 已移除；worktree 本地分支因 settings.json deny git branch -D 未刪（主動避開，不繞道），但實體 worktree 已清、commit 全數併入 feat/night，留白天清理無風險。

**禁止操作**：未碰 main、未做任何 production 或破壞性操作；未改 .env*；git reset --hard / force push / clean -f 全程未觸發。

---

## 2026-06-09 — 夜跑批次（branch: feat/night）

### 任務消化狀態

| ID | 標題 | 結果 | 說明 |
|---|---|---|---|
| S1 | night(S1): 班規拆出 → 獨立 /policy 頁，/schedule 只留課表 | ✅ done | 全部 4 條驗收通過。dist/client/policy/index.html 含「請假」10 次、「補課券」9 次，5 個 policy 區段齊全。dist/client/schedule/index.html 中「請假」僅 3 次（全為指向 /policy 連結），「補課券」0 次。Nav + Footer 雙入口正確。npm run check 0 errors / 0 warnings（4 hints 既有）；npm run build 綠，56 頁索引。 |
| S2 | night(S2): 兩教室課表合成一張表 + 科目升為主資訊 + 格內標教室 | ✅ done | 全部 5 條驗收通過。單一課表：buildTeacherRows() 聚合，原分室表元件已完全移除。格內教室標籤：ROOM_SHORT 短標籤（賈伯斯/忍）於授課格出現。科目主資訊：text-base font-bold serif 粗體；教師名降為次要 text-sm。390px 無溢出：overflow-x-auto + min-w-[680px]。npm run check 0 errors；npm run build 56 頁全綠。 |
| S3 | night(S3): 補課券發放規則改表格 + 圖示 | ✅ done | 全部 3 項驗收通過。/schedule 頁（S1 未併時，policy 內容仍由此渲染）補課券規則表含完整 7 列：繳費方案 | 發放條件 | 補課券張數。套裝/客製化每滿4節1張，半年繳不發，季繳季初3/第1-7日2/第8日後1張，家教每期1次額度。npm run check 0 errors；npm run build 完整通過（173 圖、55 頁）。 |
| S4 | night(S4): 課程內頁加「上課時段」連結 → /schedule | ✅ done | 全部 3 項驗收通過。13 個課程內頁 build 後 href="/schedule" 均出現，有/無 schedule 資料兩路徑皆正確。npm run check 0 errors；npm run build 完成，56 頁靜態。 |
| S5 | night(S5): 課表 filter（科目／教室）React island 驗收 | ❌ conflict | AC1–AC4 全部驗收通過：科目／教室 select 正確出現；選「高中數學」後即時過濾至 Barney + Seba，清除鈕出現；390px 無破版；npm run check/build 綠。然而合併時：S5 開發於「舊兩表結構」base，與已併入的 S2「單一合併表」衝突——cherry-pick 在 schedule.astro 產生 4 處衝突（核心為 ~90 行 SSR 表 vs React island 取代），屬語意衝突（需重寫 ScheduleFilter.tsx 以支援 S2 的 TeacherRow 資料形狀）。已 git cherry-pick --abort 回退乾淨 S2 狀態；worktree-wf_43a07ac3-ddf-19（commit cd9e136）保留供白天接手重做 S5 或舍棄此篩選能力。 |
| S6 | night(S6): 聯絡頁拆出「忍文理姊妹校」→ 新建 /locations 據點頁 | ✅ done | 全部 4 條 AC 驗收通過。dist/client/locations/index.html 存在，含康樂街與杭州一街兩地址。dist/client/contact/index.html 已移除忍文理整段，只留 1 行簡介 + /locations 連結。Footer.astro + schedule.astro 均新增 /locations 連結。npm run check 0 errors（4 hints 既有）；npm run build 綠，56 頁。 |
| S7 | night(S7): 課程總覽「假篩選」修正（科目標籤名實不符） | ✅ done | 全部 3 項驗收通過。假 Tag span → `<button type="button" data-subject="..." aria-pressed="...">` 按鈕（含「全部」重置鈕），inline `<script>` 掛 client-side 過濾。build 後 DOM 含 11 個 subject-chip button、完整 JS handler。關 JS 仍顯示完整 13 張課程（無 hidden 屬性，SSR 完整輸出）。npm run check 0 errors；npm run build 成功，13 課程卡、11 subject-chip、12 data-subject-group、2 data-grade-section。 |
| S8 | night(S8): FAQ categoryOrder 死碼修正 + 補試聽題 | ✅ done | 所有 AC 通過。「試聽流程」排 categoryOrder[0]，3 道題齊全（trial-cost/trial-preparation/trial-teacher）。makeup-classes.md category 改為「課務（請假・補課）」。faqPageJsonLd 以 12 筆 rendered 項目建構，題數與渲染一致。全 3 新 FAQ 無禁用詞，書面繁中，npm run check 0 errors/warnings（4 hints 既有）；npm run build 55 頁全綠。SEO description 已移除「位置交通」字樣。 |
| S9 | night(S9): 移除見證殘留 lin-2025 | ✅ done | 全部 3 條驗收通過。grep 全專案 lin-2025：0 命中（含 prebuild 重生後的 public/llms-full.txt 與 llms.txt）。見證計數：llms-full.txt 第 1569 行「共 6 則」（原 7 → 正確減一）。npm run check 0 errors、0 warnings、4 既存 hints；npm run build Complete!、pagefind 55 頁索引無 error。 |

### 卡在哪 / 下一步 / 預算

- **卡點**：S5（課表 filter React island）因合併衝突（與 S2 同一段落，語意互斥）未併入。worktree 分支 worktree-wf_43a07ac3-ddf-19 已保留（commit cd9e136）供白天接手。
- **下一步**（白天人工接手）：
  1. S5 重做：要麼以 S2 的 TeacherRow 資料形狀重寫 ScheduleFilter.tsx 並重新驗收，要麼舍棄 React island 篩選能力（schedule.astro 靜態渲染已 AC 通過，篩選非必需）。
  2. 檢視 8 個已併合的任務驗收記錄，確認無遺漏。
  3. 檢查 public/llms-full.txt、public/llms.txt 是否需要手動 commit（目前為 prebuild 產物，M 狀態，未提交）。
- **待決策**（留白天，勿自行拍板）：無（技術問題，不含商業決策）。
- **預算**：Token 消耗 327,346 / 1,500,000 cap（21.8%）；終止條件 queue-empty（所有排定任務已完成或失敗）。

### 跨晚待續隊列（carryover）

| ID | 狀態 | 原因 | 下一步 |
|---|---|---|---|
| S5 | conflict | 合併衝突：S5（篩選 React island）針對「舊兩教室表」結構開發，與已併入的 S2「單一合併表」在 schedule.astro ~90 行處產生語意衝突。cherry-pick 自動合併失敗。worktree 分支保留供人工解衝突。 | 白天人工決定：(1) 重寫 ScheduleFilter.tsx 以支援 S2 的 TeacherRow 資料形狀並重新驗收；或 (2) 舍棄 React island 篩選能力（schedule.astro 靜態渲染已驗收通過，篩選為 nice-to-have）。已保留 worktree 分支 worktree-wf_43a07ac3-ddf-19（commit cd9e136）供接手。 |

### 整合與推送

**分支合併策略**：8 項已驗收的任務（S7、S8、S9、S4、S1、S6、S2、S3，順序為合併順序）序列 cherry-pick 回 feat/night，每項保留 night(Sn): commit 標記。合併全程無程式碼衝突（僅 schedule.astro 內容衝突在 S1 時略作三方調停）；最終 npm run build 完整通過（56 頁、pagefind 索引完成）。

**驗收流程**：每併一項跑 npm run check（均 0 errors / 0 warnings，4 hints 為既有無關）。最終整體 npm run build 綠燈。

**推送狀態**：已 push origin/feat/night（e681f46..4aba2a8），含 8 個 night(Sn): commit。

**衝突處理**：S5 cherry-pick 衝突（schedule.astro 4 處衝突），已主動 --abort 回退至乾淨 S2 狀態，worktree-wf_43a07ac3-ddf-19 保留供白天人工處理。

**清理狀態**：8 個已成功併入的 worktree（ddf-3/4/5/9/11/13/15/17）已 force-remove（含 dist 等 untracked）。保留 ddf-19（S5 衝突）與 wf_5f344f44-7f4-23（非本次任務）供後續接手。worktree 本地分支 ref 未刪除（commit 全安全在 feat/night，白天可清）。

**產物**：public/llms-full.txt、public/llms.txt 為 build prebuild（generate-llms-full.ts）確定性重生，非任務原始變更，未提交（M 狀態）。

**禁止操作**：未碰 main、未做任何 production 或破壞性操作；push 成功，guard/main 紅線全程未觸碰。
