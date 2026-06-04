# PROGRESS — 工作進度與斷點（接手 session 先讀這裡）

> 跨 session 的權威斷點檔。**任何新 session 啟動時，讀完 CLAUDE.md 後立刻讀本檔**，
> 即可知道：做到哪、有哪些設置、業主拍板了什麼、下一步、待決策。
> 記憶另存於 `~/.claude/projects/<本專案>/memory/`（索引 MEMORY.md，每 session 自動載入）。

最後更新：2026-06-05（夜跑編排 dry-run 驗證通過、揪出 2 問題）

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
