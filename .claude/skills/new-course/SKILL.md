---
name: new-course
description: 新開一門課程的完整 SOP（課程頁＋價格＋資料庫＋封面圖＋驗證＋上線）。當業主說「新開課」「加一門課」「多一個課程頁」「課程獨立出來」時使用。
---

# 新開課程 SOP

> 本專案資料與呈現已解耦（2026-07）。新開課是**唯一**需要「一件事動多處」的操作，
> 因此固化成本 skill。權威對照表見 `docs/CONTENT_EDITING.md` §0 路由表與 §5 checklist。

## 第 0 步：先向業主收齊事實（缺一項就問，不可自創）

| 必問 | 範例 |
|---|---|
| 課程名稱與 slug | 國中生物小班 / `junior-biology` |
| 學制與年級 | 國中 / 國一 |
| 科目（課表/試聽表用的純科目名） | 生物 |
| 授課老師（teachers slug） | barney |
| 每節時數、一季節數、價格 | 1.5hr / 12 節 / 4,650 元 |
| 試聽節數 | 2（特殊課 1） |
| 開課時段（星期×時間×教室） | 週二 18:00–19:30 @ 賈伯斯 |
| 班級規模 classType | 極小班 2-5／精緻班 6-10／小班 10-14 |

事實核對紅線：師資學經歷相關文案動筆前查舊 Weebly／姊妹校官網（記憶 `feedback_verify_teacher_facts`）。

## 第 1 步：課程頁 `src/content/courses/<slug>.md`

- 比照現有課程檔結構（frontmatter：name/grade/gradeLevel/subject/teacher/summary/classType/trialLessons/lessonHours/cover/featured/order/seoDescription）。
- **沒有價格欄、沒有時段欄**（已廢除，別加回去——schema 會擋）。
- `order` 先盤點現有值再插入；summary/seoDescription 帶嘉義在地脈絡；語氣遵 BRAND_GUIDELINES.md。
- 內文結構慣例：教學節奏／教學重點／教材特色／學期安排／試聽說明。

## 第 2 步：價格（僅非標準價需要）

- 標準價（9,300 元 / 12 節）什麼都不用做，自動吃 `coursePricing.default`。
- 非標準價 → `src/content/fees/policy.json` 的 `coursePricing.overrides["<slug>"]`。
- 若業主要「DB 即時改價」→ Supabase `course_prices` 加一列，並在 `src/lib/pricing.ts` 的 slug↔key 對照表登記（目前僅 python 用此模式）。
- 若價格模式是新的（如不同節數），確認 `/fees` 頁 `quarterly.prices` 表有對應列。

## 第 3 步：Supabase（業主 dashboard 或 SQL）

DB 專案 `cciflmurpbnbjvbeunty`（記憶 `project_supabase`）。兩張表：

1. `courses` 加一列：slug（**必須與 md 檔名一致**）、name、grade、subject、teacher_slug、trial_lessons、display_order。→ 課表班名標籤、試聽表單選項用。
2. `teacher_availability` 排課：teacher×location×weekday×subject×grade×start/end_time，`published=true` 才對外。→ 課表頁、試聽表單、課程頁「上課時段」、CourseInstance JSON-LD 四處自動同步。

注意：**改完 DB 要 Vercel Redeploy 才會反映**（static build）。DB 沒排課前，課程頁時段區顯示「請見課表頁」降級文案（合理過渡，非 bug）。SQL 範本見 `docs/db/`（每次照抄改值）。本機常連不上 supabase.co（DNS），SQL 多半要交業主在 dashboard 執行。

## 第 4 步：封面圖

1. **先查現貨**：`src/assets/images/courses/` 可能已有可用圖（歷史批次生圖有孤兒資產，例：junior-biology.webp）。
2. 沒有才生圖：業主開 Chrome 登入 Gemini → chrome-devtools MCP 驅動網頁生圖（Nano Banana 2）→ prompt 慣例照 `docs/image-prompts/`（品牌溫潤 flatlay、**NO people, no text**、16:9、warm edge-to-edge）→ 點「下載原尺寸」→ Bash 前後差集從 Downloads 抓 `<uuid>.tmp` → `sharp` 裁底 7% 去浮水印 → 轉 webp 放 `src/assets/images/courses/<slug>.webp`。
3. frontmatter `cover` 引用相對路徑 `../../assets/images/courses/<slug>.webp`。

## 第 5 步：驗證

- `npm run check` 0 errors、`npm run build` 全綠（本機 DB fallback 屬預期）。
- dist 抽驗：新課頁存在、價格正確、封面出圖、JSON-LD 可 parse；/courses 列表有新卡；llms-full.txt 含新課無 undefined。
- 若拆分自既有課程：舊頁文案同步改（移走的內容不殘留、加互連）。

## 第 6 步：上線

feature branch commit → push（自動 preview）→ 業主看 preview 拍板 merge main → 若 DB 排課在 merge 之後才加，記得再 Redeploy 一次。

## 完成後回報業主格式

一段話講清楚：新頁網址、價格來源、DB 還缺什麼（排課時段？）、要他做的事（dashboard 操作／Redeploy／Google 商家類站外同步若適用）。
