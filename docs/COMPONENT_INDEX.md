# 元件清單

> 對應 RFP §11.2 的「元件清單」交付物。本文件列出 `src/components/*` 下所有 reusable 元件。
> 新增 / 大改元件時請同步更新本文件（見 CONTRIBUTING §8）。

---

## 約定

- **Island**：是否為 React Island（client-side hydration）；Astro 元件預設為 server-rendered，不計為 Island
- **依賴 client JS**：Astro 元件中含 `<script>` 區塊但非 React Island 者標記為「Inline JS」
- **使用集合**：該元件 import / consume 哪個 Content Collection

---

## 1. 全站結構元件

| 路徑 | 用途 | 主要 props（TS） | Island | 備註 |
|---|---|---|---|---|
| `src/components/Nav.astro` | sticky 頂部導覽列；含品牌 wordmark、選單、LINE CTA | 無 | 否 | 含 Inline JS（scroll 加陰影） |
| `src/components/Footer.astro` | 底部 footer；含聯絡資訊、網站地圖、精選見證 | 無 | 否 | 自動讀取 `testimonials` collection 中 `featured: true` 的前 3 筆 |
| `src/components/Fonts.astro` | Google Fonts 預載入（preconnect + preload + media swap） | 無 | 否 | 載入 Noto Serif TC / Noto Sans TC / Fraunces / Inter / Caveat |
| `src/components/MobileStickyCTA.astro` | 手機底部 sticky 雙按鈕（加 LINE / 立即試聽） | 無 | 否 | Inline JS：捲到 footer 時自動隱藏 |
| `src/components/SmoothScroll.astro` | Lenis smooth scroll 全站掛載 | 無 | 否 | 尊重 `prefers-reduced-motion`；與 View Transitions 相容 |
| `src/components/SiteScripts.astro` | 全站動效初始化入口（magnetic CTA 等） | 無 | 否 | 在 `astro:page-load` 重新初始化 |

---

## 2. 內容卡片元件

| 路徑 | 用途 | 主要 props（TS） | Island |
|---|---|---|---|
| `src/components/TeacherCard.astro` | 師資卡片（照片 + 姓名 + 職稱 + 科目 tag） | `{ teacher: CollectionEntry<'teachers'>; href?: string; class?: string }` | 否 |
| `src/components/CourseCard.astro` | 課程卡片（封面 + 名稱 + 年級 / 科目 + 價格） | `{ course: CollectionEntry<'courses'>; class?: string }` | 否 |
| `src/components/PostCard.astro` | 部落格文章卡片（封面 + 標題 + 摘要 + 日期 + tags） | `{ post: CollectionEntry<'posts'>; class?: string }` | 否 |

---

## 3. 通用 UI 元件

| 路徑 | 用途 | 主要 props（TS） | Island |
|---|---|---|---|
| `src/components/Button.astro` | 主按鈕；3 變體 / 3 尺寸 / 可磁吸 | `{ href?: string; variant?: 'primary' \| 'secondary' \| 'ghost'; size?: 'sm' \| 'md' \| 'lg'; type?: 'button' \| 'submit' \| 'reset'; class?: string; external?: boolean; ariaLabel?: string; magnetic?: boolean; id?: string }` | 否 |
| `src/components/Tag.astro` | 圓角 chip / tag；可作為連結或純標籤 | `{ href?: string; size?: 'sm' \| 'md'; class?: string }`（內容用 `<slot />`） | 否 |
| `src/components/IconChalk.astro` | 線稿 SVG icon（粉筆手繪感） | `{ name: 'cup' \| 'book' \| 'chalk' \| 'sparkle' \| 'users' \| 'target' \| 'spark' \| 'pi' \| 'compass' \| 'pen' \| 'flag' \| 'note'; size?: number; class?: string; ariaLabel?: string }` | 否 |
| `src/components/Breadcrumbs.astro` | 麵包屑 + BreadcrumbList JSON-LD | `{ items: BreadcrumbItem[]; class?: string }`，`BreadcrumbItem = { label: string; href?: string }` | 否 |
| `src/components/SectionFadeUp.astro` | 進場淡入上移容器 | `{ as?: 'section' \| 'div' \| 'article' \| 'aside'; class?: string; delay?: number; threshold?: number }` | 否 |
| `src/components/Timeline.astro` | 大事紀垂直時間軸 | `{ items: { year: string; title: string; desc?: string }[]; class?: string }` | 否 |
| `src/components/Countdown.astro` | 結束日倒數計時 | `{ endDate: Date; class?: string; label?: string }` | 否 |

---

## 4. 部落格輔助元件

| 路徑 | 用途 | 主要 props（TS） | Island |
|---|---|---|---|
| `src/components/Toc.astro` | 文章目錄；自動依 H2 / H3 渲染 + scroll spy | `{ headings: MarkdownHeading[]; class?: string; minDepth?: number; maxDepth?: number }` | 否 |
| `src/components/ReadingProgress.astro` | 頂部閱讀進度條（`fixed`） | `{ target?: string }`（預設 `'article'`） | 否 |
| `src/components/RelatedPosts.astro` | 相關文章；以 Jaccard 相似度排序 | `{ current: CollectionEntry<'posts'>; limit?: number; class?: string }` | 否 |
| `src/components/ShareButtons.astro` | 社群分享（FB / LINE / 複製連結） | `{ title: string; url?: string; class?: string }` | 否 |

---

## 5. 互動 React Islands

| 路徑 | 用途 | 主要 props（TS） | Island |
|---|---|---|---|
| `src/components/TrialForm.tsx` | 試聽預約表單；含 zod 驗證、Turnstile widget、送出至 `/api/trial-signup` | `{ endpoint?: string }`（預設 `'/api/trial-signup'`） | 是 |
| `src/components/SearchModal.tsx` | 站內搜尋彈窗；動態載入 Pagefind UI；`Cmd/Ctrl + K` 快捷鍵 | 無 | 是 |
| `src/components/ExitIntentLine.tsx` | exit-intent 彈窗 + LINE CTA；24h cooldown，最少停留 30s 才觸發 | 無 | 是 |
| `src/components/CountUp.tsx` | 數字滾動計數動畫；尊重 `prefers-reduced-motion` | `{ to: number; from?: number; duration?: number; prefix?: string; suffix?: string; decimals?: number; className?: string }` | 是 |

---

## 6. 元件依賴關係

```
Layouts
├── BaseLayout
│   ├── Fonts
│   ├── Nav
│   │   └── Button
│   ├── SmoothScroll
│   ├── SiteScripts
│   ├── Footer
│   ├── MobileStickyCTA
│   └── ExitIntentLine (Island)
└── PageLayout
    └── BaseLayout

Page (e.g. posts/[slug].astro)
├── Breadcrumbs
├── Toc
├── ReadingProgress
├── ShareButtons
├── RelatedPosts
│   └── PostCard × N
└── TrialForm (Island)
    └── @marsidev/react-turnstile

Search Page (search.astro)
└── SearchModal (Island)

Home (index.astro)
├── SectionFadeUp × N
├── CountUp (Island) × N
├── CourseCard × N
├── TeacherCard × N
├── PostCard × N
└── TrialForm (Island)
```

---

## 7. Island Hydration 策略建議

依 RFP §8.5「首頁 JS < 100KB」，使用 island 時請選用最低成本的指令：

| 指令 | 適用 |
|---|---|
| `client:idle` | TrialForm（首頁版）、ExitIntentLine — 不影響 LCP |
| `client:visible` | CountUp、SearchModal 觸發鈕 — 進入視窗才 hydrate |
| `client:load` | 僅在 above-the-fold 必須立即可互動時用 |
| `client:only="react"` | 純 client 渲染（無 SSR），用於依賴 `window` 的元件如 ExitIntent |

---

## 8. 新增元件 Checklist

新增元件 PR 前請確認：

- [ ] 元件檔放在 `src/components/`，命名 PascalCase
- [ ] Astro 元件用 `.astro`、React Island 用 `.tsx`
- [ ] 有 `interface Props` 並標註型別
- [ ] 不寫多餘註解（除非業務邏輯特別不直觀）
- [ ] 依品牌色 token（`bg-latte` / `text-charcoal` 等）配色，不寫死 hex
- [ ] 響應式 ≥ 3 斷點測試（手機 / 平板 / 桌機）
- [ ] 若是 Island，已選擇最輕的 `client:` 指令
- [ ] 同步更新本文件（COMPONENT_INDEX.md）
