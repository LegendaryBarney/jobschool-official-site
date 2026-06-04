# Content Schema Notes（給文案 subagent）

> 文件版本：2026-05-12（schema 擴充階段）
> 用途：說明 `src/content/*` markdown 各 collection 的 frontmatter 規範。
> 工程端剛擴充了 courses / teachers schema 並新增了 `tutoring` collection，
> 請務必依照本文件填欄位，否則 `astro check` 與 `astro build` 會失敗。

---

## 0. 全域注意事項

- 所有檔案 frontmatter 使用 YAML，並以 `---` 包裹。
- 日期一律 ISO 8601：`2026-05-12`。
- 中文標點正常使用，但 `:` 或 `>` 等 YAML 保留字元若出現在值裡，請整段用單引號或雙引號包起來：
  - 例：`title: "9,300 元 / 12 節"`
- 圖片放 `public/uploads/...`，frontmatter 寫 `cover: ../../../public/uploads/your-image.jpg` 之類；或先省略 `cover`，schema 是 optional。
- 任何 enum 欄位（如 `grade`、`classType`、`format`、`roles`）值必須完全比對中文（含全形空白），不要自行翻譯。

---

## 1. `teachers/` collection

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `name` | string | ✅ | 中文姓名 |
| `englishName` | string |  | 英文／品牌名（Barney / Seba / Joker / Sandra / Chili / 豪理 等） |
| `title` | string | ✅ | 職稱（如：數學科主任、英文家教老師） |
| `photo` | image |  | 照片路徑，可省略 |
| `education` | string[] |  | 學歷陣列 |
| `yearsOfExperience` | int |  | 教學年資，預設 0 |
| `subjects` | string[] |  | 教學科目陣列 |
| `roles` | enum[] |  | `['小班']` / `['1v1家教']` / `['小班', '1v1家教']`，預設 `['小班']` |
| `localTie` | string |  | 在地連結（如：嘉義高中畢業） |
| `philosophy` | string |  | 教學理念短句（建議 60-120 字） |
| `featured` | bool |  | 是否在首頁／師資頁精選，預設 false |
| `order` | number |  | 排序（越小越前），預設 0 |
| `seoDescription` | string |  | SEO 描述 |

### 1.1 Joker 的特殊處理

Joker（葉謹寬）同時是小班英文老師、也接 1v1 家教，因此：

```yaml
roles: ['小班', '1v1家教']
```

他會出現在 `/teachers`（因為 roles 包含「小班」）。
另外 `/tutors` 列表是讀 `tutoring` collection（與 teachers 分開），所以
請務必額外在 `src/content/tutoring/` 建一支 `joker-english-1on1.md`，
把 frontmatter 的 `teacher:` 指回 `joker`。

### 1.2 範例：`src/content/teachers/barney.md`

```yaml
---
name: 黃韋誌
englishName: Barney
title: 創辦人 / 數學科主任
education:
  - 國立臺灣大學數學系
  - 國立臺灣大學資工碩士
yearsOfExperience: 15
subjects:
  - 國中數學
  - 高中數學
  - 國中自然
  - 國中生物
  - 國中社會
  - 高中社會
  - Python 程式設計
roles: ['小班']
localTie: 嘉義在地深耕
philosophy: 觀念要慢慢講清楚，不能跳步。
featured: true
order: 1
seoDescription: 認識賈伯斯數理教室創辦人 Barney（黃韋誌）— 台大資工碩士、嘉義在地 15 年教學資歷。
---

（內文 markdown）
```

### 1.3 範例：`src/content/teachers/joker.md`

```yaml
---
name: 葉謹寬
englishName: Joker
title: 英文小班 / 1v1 家教
education:
  - 國立嘉義高中
  - 國立高雄師範大學英語系
yearsOfExperience: 4
subjects:
  - 國小英文
  - 國中英文
  - 高中英文
  - 英文作文
roles: ['小班', '1v1家教']
localTie: 2025 年畢業於嘉義高中、高師大英語系
philosophy: 從文法骨架到應考策略，逐步建立讀寫信心。
featured: true
order: 4
---

（內文：個人介紹、教學理念、在地連結）
```

---

## 2. `courses/` collection（小班制課程）

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `name` | string | ✅ | 課程名稱 |
| `grade` | `'國中'` \| `'高中'` | ✅ | enum |
| `gradeLevel` | string[] |  | 適用年級（國一 / 國二 / 高一 …） |
| `subject` | string | ✅ | 科目 |
| `teacher` | string |  | 講師 slug（檔名去掉副檔名） |
| `summary` | string | ✅ | 課程簡介（會用於卡片、SEO） |
| `schedule` | string[] |  | 上課時段陣列 |
| **`classType`** | `'極小班'` \| `'精緻班'` \| `'小班'` |  | 班級規模 |
| **`trialLessons`** | int |  | 試聽節數；預設 **2**，特殊課（升高搶救／Python／國中社會／高中社會／國小自然手作）= **11** |
| **`lessonHours`** | number |  | 每堂時數；預設 **3**，國中生物 = **1.5** |
| **`pricePerPack`** | string |  | 完整描述，如 `'9,300 元 / 12 節'`，比 priceRange 優先顯示 |
| `priceRange` | string |  | 舊欄位，向下相容用 |
| `cover` | image |  | 封面 |
| `featured` | bool |  | 首頁精選 |
| `order` | number |  | 排序 |
| `seoDescription` | string |  | SEO |

### 2.1 班級規模對照（業主指定）

| classType | 人數 |
|---|---|
| `極小班` | 2–5 人 |
| `精緻班` | 6–10 人 |
| `小班` | 10–14 人 |

### 2.2 試聽節數對照

| 課程類型 | trialLessons |
|---|---|
| 升高中數學基礎搶救班 | 11 |
| Python 程式設計 | 11 |
| 國中社會 | 11 |
| 高中社會 | 11 |
| 國小自然手作班 | 11 |
| 其餘所有課程 | 2 |

### 2.3 範例：`src/content/courses/high-math-grade-10.md`

```yaml
---
name: 高一數學
grade: 高中
gradeLevel: ['高一']
subject: 數學
teacher: barney
summary: 把國中觀念順利接軌到高中。著重函數與三角推導，建立可重複使用的解題框架。
schedule:
  - 週一 19:00–22:00
  - 週四 19:00–22:00
classType: 精緻班
trialLessons: 2
lessonHours: 3
pricePerPack: '9,300 元 / 12 節'
featured: true
order: 1
seoDescription: 嘉義東區高一數學精緻小班 — Barney 親自帶班，函數與三角的踏實累積。
---
```

---

## 3. `tutoring/` collection（**新**，1v1 家教獨立課程）

放在 `src/content/tutoring/<slug>.md`。

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `name` | string | ✅ | 課程名稱 |
| `subject` | string | ✅ | 科目 |
| `teacher` | string |  | slug 指向 teachers |
| `summary` | string | ✅ | 課程簡介 |
| `format` | `'遠端'` \| `'實體'` \| `'皆可'` |  | 預設 `實體` |
| `trialDuration` | string |  | 預設 `1 小時試聽` |
| `pricing` | string |  | 預設 `依個案需求單獨報價` |
| `cover` | image |  | 封面 |
| `featured` | bool |  | 首頁精選 |
| `order` | number |  | 排序 |
| `seoDescription` | string |  | SEO |

### 3.1 範例：`src/content/tutoring/sandra-english-composition-1on1.md`

```yaml
---
name: Sandra 老師 1 對 1 英文作文
subject: 英文作文
teacher: sandra
summary: 遠端英文作文家教，依學生程度量身設計題型與訓練步調。
format: 遠端
trialDuration: 1 小時試聽
pricing: 依個案需求單獨報價
featured: true
order: 1
seoDescription: 賈伯斯數理教室 1 對 1 遠端英文作文家教 — Sandra 老師。
---

## 課程目標

- ...
- ...
```

### 3.2 既有 `english-composition-1on1.md` 的處理

如果這份檔目前在 `src/content/courses/` 底下，請：

1. 整檔搬到 `src/content/tutoring/`（schema 改用 tutoring）
2. 把欄位調整成上面 3 章的 schema（移除 `grade` / `gradeLevel`，加入 `format` / `trialDuration` / `pricing`）

---

## 4. 其他 collection（沒改）

- `posts/`、`testimonials/`、`faq/`、`landing/`：schema 完全沒動，照原本格式即可。
- `testimonials` 與 `posts` 的撰寫邏輯規則（如 Barney 不教高中化學）請參考 `known_errors.md`。

---

## 5. 檔名 → slug 規則

- 檔名小寫、用連字號分隔，例如：`barney.md` → slug = `barney`。
- 課程建議格式：`<grade>-<subject>[-<level>].md`：
  - `high-math-grade-10.md`
  - `junior-biology.md`
  - `gsat-math-sprint.md`（升高中搶救）
- 家教檔名建議帶老師：`sandra-english-composition-1on1.md`、`joker-english-1on1.md`、`chili-english-1on1.md`。

---

## 6. 驗證

寫完後請執行：

```bash
npm run check
```

若 zod 報錯，會明確指出哪個欄位 / 哪份檔案違反 schema。
