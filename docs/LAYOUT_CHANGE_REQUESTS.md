# 賈伯斯數理教室 — 圖片素材落地的 Layout 修改需求

> **文件版本**：v1.0 / 2026-05-15
> **發案方**：負責人（業主）
> **承接方**：本網站 PM / 前端工程師
> **目的**：在替全站補上圖片素材的過程中，發現幾處現有 layout 為「純文字 + 佔位」設計，補圖後若不微調 layout，視覺會顯得突兀或失衡。本文件彙整建議修改項，**不直接動手改 code**，由 PM 評估是否採納。
> **配套文件**：[IMAGE_GENERATION_PROMPTS.md](IMAGE_GENERATION_PROMPTS.md)

---

## 0. 全文摘要

| # | 修改項 | 優先級 | 影響面 | 預估工時 |
|---|---|---|---|---|
| 1 | About 頁「創辦故事」aside 佔位導圖 | **高** | 1 個 `<aside>` 區塊 | 30 分鐘 |
| 2 | About 頁「教室空間」6 張佔位卡片導圖 | **高** | 1 個 grid 區塊 | 45 分鐘 |
| 3 | TeacherCard 補圖後的 fallback 處理與 hover 微互動 | **中** | 1 個元件 | 30 分鐘 |
| 4 | CourseCard / PostCard / TutorCard 補 cover 後的 hover 動效 | **中** | 3 個元件 | 30 分鐘 |
| 5 | LP `summer-2026` heroImage 啟用後的對位與覆蓋層 | **中** | 1 個頁面 | 45 分鐘 |
| 6 | 教師詳頁 4:5 photo 區塊的浮起陰影與 caption 微調 | **低** | 1 個頁面 | 20 分鐘 |
| 7 | 動態 OG image 生成（取代靜態 `og-default.png`） | **中** | SEO 系統 | 2-3 小時 |
| 8 | 文章內頁是否新增 cover hero 區塊 | **建議討論** | 1 個頁面 | 1 小時 |
| 9 | 課程詳頁是否新增 cover hero | **建議討論** | 1 個頁面 | 1 小時 |
| 10 | 圖片載入策略（lazy / eager / decoding）統一規範 | **必做** | 全站 | 1 小時 |
| 11 | 教師肖像「示意圖」標籤系統（在實拍未到位前） | **可選** | TeacherCard + 詳頁 | 30 分鐘 |

**總計**：核心改動 4-6 小時、含選配 7-9 小時

---

## 1. About 頁 — 創辦故事 aside

### 1.1 現況
[src/pages/about.astro:103-116](../src/pages/about.astro#L103-L116)

```astro
<aside class="lg:col-span-2">
  <div
    class="aspect-[4/5] rounded-xl border border-cream bg-cream/60 paper-grain flex items-center justify-center"
    aria-label="教室空間照片佔位"
  >
    <div class="text-center px-6">
      <IconChalk name="cup" size={56} class="mx-auto opacity-60" />
      <p class="mt-3 font-handwriting text-2xl text-espresso/70">
        嘉義 · 東區 · 康樂街
      </p>
      <p class="mt-1 text-xs text-charcoal/50">教室空間照片</p>
    </div>
  </div>
</aside>
```

### 1.2 修改需求
1. 將「圖示 + 文字」佔位**直接替換**為 `<Image>` 元件
2. 圖片來源：`public/images/about/founder-story.webp`（見 IMAGE_GENERATION_PROMPTS.md §2.1）
3. **保留** `aspect-[4/5] rounded-xl border border-cream` 外框（提供品牌視覺一致性）
4. 在圖片上方疊一個輕量的 `bg-gradient-to-t from-charcoal/30 to-transparent` 漸層，左下角放上手寫體 caption「嘉義 · 東區 · 康樂街」，營造編輯雜誌感
5. 行動裝置 (sm 以下) 改為 16:9 或 3:4，避免過長

### 1.3 對 PM 的提問
- 是否要加 hover 微動效（如 1.02 倍放大）？**建議：要**，與下方教室空間區塊一致
- caption 文字位置是「左下角」還是「下方獨立一行」？**建議：左下角疊圖**，較具雜誌感

---

## 2. About 頁 — 教室空間 6 張卡片

### 2.1 現況
[src/pages/about.astro:164-182](../src/pages/about.astro#L164-L182)

```astro
<div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {[
    { label: '主教室', sub: '8 人座配置' },
    ...
  ].map((item) => (
    <div
      class="aspect-[4/3] rounded-xl border border-cream bg-cream/60 paper-grain flex flex-col items-center justify-center text-center px-4"
    >
      <IconChalk name="cup" size={32} class="opacity-50" />
      <p class="mt-2 font-serif text-lg text-charcoal/80">{item.label}</p>
      <p class="text-xs text-charcoal/50">{item.sub}</p>
    </div>
  ))}
</div>
```

### 2.2 修改需求
1. 為陣列每筆加上 `image` 欄位，指向 `public/images/about/space-*.webp`（檔名見 §2.2 of prompts 文件）
2. 卡片改為「滿版背景圖 + 文字疊在底部」結構：

```astro
<div class="relative aspect-[4/3] rounded-xl overflow-hidden border border-cream group">
  <Image src={item.image} alt={`${item.label} - ${item.sub}`} class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
  <div class="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent"></div>
  <div class="absolute bottom-4 left-4 text-chalk">
    <p class="font-serif text-lg">{item.label}</p>
    <p class="text-xs opacity-80">{item.sub}</p>
  </div>
</div>
```

3. hover 動效：圖片 scale(1.04) + 300ms ease-out（符合 BRAND_GUIDELINES §6.1）
4. 若圖片未填，**fallback 回現有佔位呈現**（保持向下相容）

### 2.3 對 PM 的提問
- 是否考慮將「主教室」一張改為較大尺寸（佔 2 欄）做為視覺主角？**建議：v1 先 6 張等大**、上線後依實際視覺再調

---

## 3. TeacherCard 元件

### 3.1 現況
[src/components/TeacherCard.astro:22-35](../src/components/TeacherCard.astro#L22-L35)（依 Explore agent 報告）
- `photo` 欄位 optional；若未填，顯示首字 fallback
- 卡片頂部 4:5 區塊

### 3.2 修改需求
1. 補齊 7 位老師的 `photo` 欄位後，**保留 fallback 邏輯**（萬一某張 AI 生成不過關時還能 graceful degrade）
2. 加入「圖片載入時的微淡入」效果：
   - 使用 `decoding="async"` + CSS opacity transition
   - 載入完成才 opacity: 1，避免閃爍
3. hover 動效：卡片整體浮起 4px + 陰影加深、圖片不縮放（避免太多動效）

### 3.3 對 PM 的提問
- 是否在 photo 區塊加「示意圖」浮水印（標示 AI 生成）？**詳見本文 §11**

---

## 4. CourseCard / PostCard / TutorCard 共用調整

### 4.1 現況
- 三個卡片元件都有 16:10 或 16:9 的 cover 區、目前無圖
- 卡片本體有 hover 浮起效果

### 4.2 修改需求
1. 三個元件統一使用相同的 hover pattern：
   - 整張卡片浮起 2-4px + shadow
   - cover 圖 scale(1.03) 300ms
   - 圖上不加額外 overlay（保留圖片原色）
2. cover 區補上 `placeholder="blur"` 或顏色佔位（用 `bg-cream/40`），避免 LCP 時的閃爍
3. 卡片上 cover 圖的 `alt` 文字格式統一為 `${標題} - ${副標 or 一句話摘要}`，給 SEO 與無障礙

### 4.3 對 PM 的提問
- 課程卡與文章卡若沒填 cover，要顯示「純文字卡」還是「漸層色塊」？**建議：漸層色塊**（用 espresso → caramel 的 45° 漸層 + 浮水印標題首字），保持視覺節奏

---

## 5. Landing Page `summer-2026` 的 heroImage

### 5.1 現況
[src/pages/lp/[campaign].astro:82-92](../src/pages/lp/%5Bcampaign%5D.astro#L82-L92)
- 已有 `heroImage` 條件渲染
- 但 LP 內容區是「文字疊圖」還是「文字 + 圖並排」未明

### 5.2 修改需求
1. 確認 LP hero 採「右側圖 / 左側文字」並排 (lg 以上) 或「圖在上、文字在下」(行動裝置)
2. 圖片區加 `rounded-2xl` 與輕微陰影
3. 圖片左側可疊一個 `bg-gradient-to-r from-latte to-transparent` 漸層，文字能延伸到圖上
4. 行動裝置上 heroImage 改成 4:3 或 3:2，避免太瘦長
5. 若 `heroImage` 未填，**不要顯示空白區**，改為純文字 hero（現有行為應已支援，請工程師確認）

### 5.3 對 PM 的提問
- 「文字 + 圖並排」還是「文字疊圖」？**建議：並排** — 暑期班的 LP 文字資訊量大（時間、地點、班別、價格、CTA），疊圖會壓縮文字可讀性

---

## 6. 教師詳頁 4:5 photo 區塊

### 6.1 現況
[src/pages/teachers/[slug].astro:67-82](../src/pages/teachers/%5Bslug%5D.astro#L67-L82)
- 4:5 photo 區塊，目前顯示老師首字 fallback

### 6.2 修改需求
1. 補上 photo 後，加上：
   - `shadow-[0_8px_24px_-12px_rgba(31,27,22,0.25)]` 柔和陰影
   - `border border-cream` 維持品牌邊框
2. 圖下方加一行小字 caption（例：「Barney 老師，2024 攝於主教室」），給家長更具體的視覺脈絡
3. 行動裝置上，photo 區塊高度限制 max-height: 70vh，避免過度推遠下方內容

### 6.3 對 PM 的提問
- caption 內容由業主提供還是工程師預設？**建議：在 `teachers/*.md` 新增 frontmatter `photoCaption` 欄位**（optional），未填就不顯示

---

## 7. 動態 OG image 生成

### 7.1 現況
[src/lib/seo.ts:58-80](../src/lib/seo.ts#L58-L80) 已有 `buildOgImageUrl()` 函式，但實際路由尚未實作。
全站目前 fallback 到靜態 `public/og-default.png`。

### 7.2 修改需求

**建議實作**：用 `@vercel/og` 或 Astro 5 的 SSR 路由 + `satori` 為每篇文章 / 課程 / 老師頁產生動態 OG 圖。

1. 新增 `src/pages/og/[...slug].png.ts`（或 `.tsx`）路由
2. 模板：左側品牌色塊 (espresso → caramel 漸層) + 右側 1200×630 區域放標題 + 副標
3. 字體：Fraunces (英文) + Noto Serif TC (中文) 內嵌到 OG 生成器中
4. 每頁的 frontmatter 已有 title / description，直接拿來生成
5. 在 [BaseLayout.astro](../src/layouts/BaseLayout.astro) 把 `<meta property="og:image">` 改為動態路由

### 7.3 對 PM 的提問
- 是否在 v1 必做？**建議：v1 可先用 IMAGE_GENERATION_PROMPTS.md §8 的靜態 og-default.png**，動態 OG 圖作為 v1.1 上線後 1-2 個月內補強
- 此項涉及 Vercel runtime 與字體封包，需確認 Hobby 方案不會超出 Edge Function 配額

---

## 8. 文章內頁是否新增 cover hero（待討論）

### 8.1 現況
[src/pages/posts/[slug].astro:62-98](../src/pages/posts/%5Bslug%5D.astro#L62-L98) hero 為純文字。文章 frontmatter 已支援 `cover` 但目前未被頁面使用。

### 8.2 兩個選項

**選項 A：不加 cover hero（維持現狀）**
- 優點：閱讀體驗純粹、不會干擾文字密度
- 缺點：PostCard 與文章內頁視覺斷裂（卡片有圖、進入後沒圖）

**選項 B：新增 cover hero**
- 在標題下方加 16:9 的 cover 圖、最大寬度 max-w-4xl
- 圖下方放閱讀資訊（作者、日期、預估閱讀時間）

### 8.3 建議
**選項 B**：與 PostCard 視覺一致，且 cover 圖可疊上手寫體標籤（如「教學心得」），維持品牌調性。
若選 B，需確認 4 篇文章都已產出 cover。

---

## 9. 課程詳頁是否新增 cover hero（待討論）

### 9.1 現況
[src/pages/courses/[slug].astro:80-93](../src/pages/courses/%5Bslug%5D.astro#L80-L93) hero 為純文字 + tag、無圖。

### 9.2 兩個選項

**選項 A：不加（建議）**
- 課程資訊密度高（時段、價格、班別、適合對象），加圖會推遠 CTA
- CourseCard 在課程列表頁已有 cover 圖、進入詳頁專注於資訊即可

**選項 B：加小尺寸 cover 在 hero 右側**
- lg 以上採「左文 / 右圖」雙欄、行動裝置不顯示
- 圖尺寸壓縮到 16:10 / max-width 480px

### 9.3 建議
**選項 A**：保持資訊優先。CourseCard 的 cover 已足夠視覺引導。

---

## 10. 圖片載入策略統一規範（必做）

### 10.1 規範
| 位置 | loading | decoding | priority |
|---|---|---|---|
| 首頁 hero 區（若加圖） | `eager` | `sync` | `high` |
| 首頁 fold 內第一屏（前 2-3 個 CourseCard） | `eager` | `async` | 預設 |
| 折疊區以下所有圖 | `lazy` | `async` | 預設 |
| OG image | 不適用 | 不適用 | 不適用 |

### 10.2 Astro Image 用法統一
```astro
---
import { Image } from 'astro:assets';
---
<Image
  src={cover}
  alt={`${title} - ${summary}`}
  width={1600}
  height={1000}
  loading={isAboveFold ? 'eager' : 'lazy'}
  decoding="async"
  format="webp"
/>
```

### 10.3 全站圖片總量目標
- 首頁總 transferred image payload：**< 600KB** (gzipped)
- 其他內容頁：**< 400KB** (gzipped)
- 若超過，請工程師檢查是否所有圖片都已 webp 化 + 適當尺寸

---

## 11. 教師肖像「示意圖」標籤系統（可選）

### 11.1 場景
若業主決定**先用 AI 生成肖像佔位、待後續實拍補充**，建議在介面上明確標示，避免家長誤認。

### 11.2 修改需求
1. `teachers/*.md` 新增 frontmatter `photoStatus: 'illustrative' | 'real'`（預設 `real`）
2. TeacherCard 與教師詳頁在 photo 右上角加一個小標籤：「✦ 示意圖」（淺色、不搶眼）
3. 業主將老師實拍照逐步換上後，把 `photoStatus` 改回 `real`，標籤自動隱藏

### 11.3 對 PM 的提問
- 是否採用？**建議：採用** — 對家長透明、也降低後續被質疑的風險

---

## 12. 不修改的項目（已確認維持現狀）

| 區塊 | 理由 |
|---|---|
| 首頁 Hero | 現有 SVG (π·∫·∑ 圓圈) + 紙張紋理已具備視覺層次，加圖反顯擁擠 |
| Nav / Footer | 純文字 + LINE QR 已足夠 |
| 404 / Search / FAQ Hero | 純文字 + icon 設計清爽，加圖會干擾 |
| Testimonials 學生見證 | 學生未成年 + 化名，**禁用** AI 生成虛構臉孔；維持文字 + 引號 icon 設計 |
| Timeline / Toc / Countdown / Breadcrumbs | 功能性元件，無圖需求 |

---

## 13. 交付順序建議（給 PM 排 sprint）

### Phase 1（圖片到位即可上 — 1-2 天）
- [ ] §3 TeacherCard 補 7 位老師 photo
- [ ] §4 CourseCard / PostCard / TutorCard hover 統一
- [ ] §10 圖片載入策略

### Phase 2（補 About 頁素材後 — 2-3 天）
- [ ] §1 About 創辦故事 aside 導圖
- [ ] §2 About 教室空間 6 張卡片導圖
- [ ] §6 教師詳頁 photo caption

### Phase 3（LP 上線前 — 1 天）
- [ ] §5 LP heroImage 對位
- [ ] §11 示意圖標籤（若採用）

### Phase 4（上線後 1 個月內）
- [ ] §7 動態 OG image
- [ ] §8 文章 cover hero（若決定採用）

---

## 14. 業主回饋確認欄

請業主在每項旁打勾 / 註記，工程師再進場：

| 項目 | 採用？ | 業主註記 |
|---|---|---|
| §1 About 創辦故事導圖 | ☐ 是 / ☐ 否 / ☐ 改 | |
| §2 About 教室空間 6 卡導圖 | ☐ 是 / ☐ 否 / ☐ 改 | |
| §3-§4 卡片元件補圖 | ☐ 是 / ☐ 否 / ☐ 改 | |
| §5 LP heroImage 對位 | ☐ 是 / ☐ 否 / ☐ 改 | |
| §6 教師詳頁 caption | ☐ 是 / ☐ 否 / ☐ 改 | |
| §7 動態 OG image | ☐ v1 必做 / ☐ v1.1 補做 / ☐ 不做 | |
| §8 文章 cover hero | ☐ 加 / ☐ 不加 | |
| §9 課程 cover hero | ☐ 加 / ☐ 不加 | |
| §10 圖片載入策略 | ☐ 採用（必做） | |
| §11 示意圖標籤 | ☐ 採用 / ☐ 不採用 | |

---

## 15. 變更紀錄

| 版本 | 日期 | 變更 |
|---|---|---|
| v1.0 | 2026-05-15 | 初版建立，盤點圖片落地時所需的 layout 微調 11 項 |
