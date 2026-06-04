# 賈伯斯數理教室 — 全站圖片生成提示詞清單

> **文件版本**：v1.0 / 2026-05-15
> **目的**：給 AI 圖片生成工具（即夢 Jimeng / nano banana / Midjourney / Stable Diffusion）使用，產生與品牌一致的全站視覺素材
> **基準**：[BRAND_GUIDELINES.md](../BRAND_GUIDELINES.md) §3 配色、§5 視覺風格、§5.3 攝影風格
> **互補文件**：[LAYOUT_CHANGE_REQUESTS.md](LAYOUT_CHANGE_REQUESTS.md)（圖片落地時建議的 layout 微調）

---

## 0. 重要前提與限制

### 0.1 為什麼提供「兩套提示詞」
每張圖會同時提供：
- **中文提示詞**：給「即夢 Jimeng / 豆包」用（中文模型對台灣場景與東亞臉孔還原較好）
- **英文提示詞**：給「nano banana (Gemini 2.5 Flash Image) / Midjourney / Stable Diffusion」用

工具不同對提示詞權重的解讀有差，**請先各跑一張比對再決定主力工具**。

### 0.2 真人實拍 vs AI 生成的判斷
| 場景 | 建議來源 | 原因 |
|---|---|---|
| **教室空間、店面、招牌、實體設備** | **必須實拍**（請業主補拍或從 Google 商家照片授權使用） | AI 生成的教室會出現「不存在的細節」，與品牌真實性衝突；且學生家長看得出來 |
| **老師肖像** | **強烈建議實拍**（老師本人棚拍或自然光環境照） | AI 換臉/合成有肖像權與真實性風險；現有老師已具備頭照素材的可先沿用 |
| **裝飾性配圖**（課程卡、文章卡、LP hero、抽象「學習氛圍」） | **AI 生成 OK** | 不涉及真實人員辨識、僅作風格襯托 |
| **學生見證的學生照** | **不要做**（一律用化名 + 文字 + icon） | 未成年學生肖像權；建議走純文字呈現 |

> ⚠️ **若業主決定 AI 生成「教室+人物」場景**：請使用「背影、剪影、模糊景深、只露手部/筆記」等手法迴避「可辨識的虛構臉孔」，避免家長誤認為是實際師生。本文件後續的「教室+人物」提示詞均已遵循此原則。

### 0.3 參考來源備註
- **舊官網** `jobschool.weebly.com` 幾乎無實拍照片（只有咖啡杯裝飾），無法作為實景參考
- **Google 商家** `https://maps.app.goo.gl/6mFvdkyKC1awrfwd9` 為 JS 動態渲染頁，無法經由本工具抓取內容
  - **建議**：請業主將 Google 商家現有的教室實景照（如店面、招牌、走道、教室一隅）另外提供，這些優先用於 about 頁與 contact 頁
- 本文件下方的 AI 提示詞，均以「假設沒有實拍可用、需要 AI 補位」為前提撰寫

---

## 1. 全站視覺一致性規範（每則提示詞都會引用這組基底）

### 1.1 通用風格基底 base style（每張圖都帶上）

**中文**：
```
咖啡館調性、暖色調、淺米色與奶油色為主、自然光、紙張紋理感、
極簡留白、編輯雜誌排版感、手感筆觸、安靜內斂、無浮誇感、
仿底片顆粒、色溫約 5000K、Lightroom 暖色預設、VSCO A6/KK1 風格
```

**英文**：
```
cafe-inspired aesthetic, warm beige and cream palette, natural soft daylight,
matte paper texture, editorial magazine layout, generous whitespace,
hand-drawn nuance, calm and understated, subtle film grain,
color temperature 5000K, Lightroom warm preset, VSCO A6/KK1 finish,
analog meets digital, cozy academic warmth
```

### 1.2 全站固定色票（請在提示詞中明確要求）

| 色票 | HEX | 提示詞用語（中 / 英） |
|---|---|---|
| Latte Foam 拿鐵奶泡 | `#F5EFE6` | 拿鐵奶泡米色 / latte foam beige |
| Cream Beige 奶油米 | `#EAE0D0` | 奶油米色 / cream beige |
| Espresso Tan 濃縮棕 | `#8B6F47` | 濃縮咖啡棕 / espresso tan brown |
| Charcoal Bean 炭咖啡 | `#1F1B16` | 炭黑咖啡色 / charcoal bean (deep neutral) |
| Chalk White 粉筆白 | `#FAFAF7` | 粉筆白 / soft chalk white |
| Caramel Gold 焦糖金 | `#C8A165` | 焦糖金 / caramel gold (accent) |
| Burnt Sienna 焦土赭 | `#A14A3A` | 焦土赭紅 / burnt sienna (use sparingly) |

### 1.3 全站通用負面提示詞 (Negative Prompt)
```
neon, saturated colors, pure red, pure blue, pure green, rainbow gradient,
purple tones, pink tones, HDR over-exposed, plastic skin retouching,
cold blue tones, fluorescent lighting harsh shadows, cartoon style,
3D render plastic, anime style, comic book style, low resolution,
text watermark, signature, logo overlay, deformed hands, distorted faces,
crowded composition, four corners filled, more than 5 colors,
標楷體、新細明體、Comic Sans、Papyrus、impact font,
glass reflection, metal sheen, leather texture, wood-grain heavy,
fisheye lens distortion, smartphone beauty filter, oversaturated
```

### 1.4 技術交付規格

| 用途 | 比例 | 最終尺寸（長邊 px） | 格式 | 目標檔案大小 |
|---|---|---|---|---|
| 教師肖像（TeacherCard + 詳頁） | 4:5 直式 | 1200 × 1500 | WebP / AVIF | ≤ 180 KB |
| 課程卡 cover | 16:10 橫式 | 1600 × 1000 | WebP / AVIF | ≤ 160 KB |
| 家教卡 cover | 16:10 橫式 | 1600 × 1000 | WebP / AVIF | ≤ 160 KB |
| 文章卡 cover | 16:9 橫式 | 1600 × 900 | WebP / AVIF | ≤ 150 KB |
| LP hero | 16:9 橫式 | 1920 × 1080 | WebP / AVIF | ≤ 240 KB |
| About 創辦故事 | 4:5 直式 | 1200 × 1500 | WebP / AVIF | ≤ 200 KB |
| 教室空間卡（6 張） | 4:3 橫式 | 1200 × 900 | WebP / AVIF | ≤ 140 KB |
| OG 預設圖（社群分享） | 1.91:1 | 1200 × 630 | PNG（無壓縮）/ WebP | ≤ 200 KB |

**重要**：
- 全部使用 Astro `<Image>` 元件，會自動產出 srcset；只需給原圖即可
- 不要交付 4K 以上原圖（無意義且影響 build 時間）
- 檔名規範：全小寫 + kebab-case，例如 `teacher-barney.webp`、`course-high-math-grade-10.webp`

---

## 2. About 頁面 — 創辦故事與教室空間（總計 7 張）

### 2.1 創辦故事主圖（1 張）
- **檔名建議**：`public/images/about/founder-story.webp`
- **對應位置**：[src/pages/about.astro:103-116](../src/pages/about.astro#L103-L116)（4:5 佔位 aside）
- **尺寸**：1200 × 1500（4:5）

**中文提示詞**：
```
一個嘉義在地補習班教室的內部斜俯角構圖，木質長桌、奶油米色牆面、
窗外自然光從左邊斜射進來、桌上有一本翻開的數學筆記、一支削好的木桿鉛筆、
一個白色 mug 裝著咖啡、旁邊一本闔上的厚教科書、背景隱約看到一張黑板的邊角，
無人物，暖色調，淺景深，VSCO A6 風格，色溫 5000K，紙張紋理，
拿鐵奶泡米色與濃縮咖啡棕為主，焦糖金作為局部光線點綴，
編輯雜誌排版的留白感，靜謐學習氛圍，4:5 直式構圖
```

**英文提示詞**：
```
Interior of a small Taiwanese tutoring classroom in Chiayi, slight overhead diagonal angle,
warm wooden long desk, cream beige walls, natural window light streaming from the left,
an open math notebook on the desk, a sharpened wooden pencil, a white ceramic mug with coffee,
a closed thick textbook beside it, edge of a chalkboard barely visible in soft-blurred background,
no people, warm color tone, shallow depth of field, VSCO A6 preset, 5000K color temperature,
subtle paper grain, dominant latte foam beige (#F5EFE6) and espresso tan (#8B6F47),
caramel gold (#C8A165) as accent light highlights, editorial magazine whitespace,
quiet study atmosphere, 4:5 portrait composition, photo-realistic
```

**負面提示詞**：套用 §1.3 通用 + 加上 `no people, no faces`

---

### 2.2 教室空間 6 張卡片（4:3）
- **對應位置**：[src/pages/about.astro:164-182](../src/pages/about.astro#L164-L182)
- **尺寸**：每張 1200 × 900（4:3）

> **建議**：這 6 張**強烈建議實拍**，因為都是業主自家空間。AI 生成的「主教室」很容易跟實際空間不符。但若業主決定全用 AI 生成，以下提示詞可用。

#### 2.2.1 主教室（8 人座配置）
- **檔名**：`public/images/about/space-main-classroom.webp`

**中文**：
```
一間嘉義小型補習班的主教室內部廣角照，8 個學生位置以 U 字型排列、
木質淺色長桌、黑色金屬支架椅、前方是一面整面的黑板與粉筆槽、
牆面是奶油米色、天花板有暖色調 LED 嵌燈、靠窗一側有大片自然光、
桌面整齊擺著講義與鉛筆但無人物、靜止狀態、空間留白多、
拿鐵奶泡米色背景、編輯感構圖、紙張紋理輕微疊加、4:3 橫式
```

**英文**：
```
Wide-angle interior of a small Taiwanese tutoring classroom in Chiayi,
8 student seats arranged in a U-shape, light wood long desks, black metal frame chairs,
a full chalkboard with chalk tray at the front, cream beige walls,
warm LED downlights on the ceiling, large natural window light from one side,
desks neatly arranged with handouts and pencils, no people present,
stillness, generous whitespace, latte foam beige (#F5EFE6) dominant,
editorial composition, subtle paper grain overlay, 4:3 horizontal
```

#### 2.2.2 小組討論區（錯題複習用）
- **檔名**：`public/images/about/space-discussion.webp`

**中文**：
```
補習班內的小型討論角落，一張圓形或方形小木桌、4 張椅子圍著、
桌上放著一本翻開的錯題筆記與一杯馬克杯咖啡、後方牆掛著一塊小黑板寫著淡淡的數學公式痕跡、
無人物，自然光從窗戶斜射、暖色調、奶油米色牆面、紙張紋理、
畫面留白佔 30%、4:3 橫式
```

**英文**：
```
Small discussion corner in a tutoring center, a round or square small wooden table,
4 chairs around it, an open notebook of math corrections on the table, a mug of coffee,
a small chalkboard on the wall behind with faint traces of math formulas,
no people, slanted natural window light, warm tones, cream beige walls,
paper grain, 30 percent whitespace, 4:3 horizontal
```

#### 2.2.3 老師辦公室（個別輔導）
- **檔名**：`public/images/about/space-office.webp`

**中文**：
```
一個簡潔的老師工作角落，一張深色木質書桌、桌上有筆記型電腦闔上、
一疊講義、一支高品質鋼筆、一杯紅茶、背景有一個木質書架擺著教科書與少量裝飾，
牆面是炭咖啡色與奶油米色交界、桌邊有一張學生用椅，
無人物，暖光、自然光混合，整體沈穩專業，4:3 橫式
```

**英文**：
```
Clean teacher workspace, a dark wooden desk, a closed laptop on it,
a stack of handouts, a quality fountain pen, a cup of black tea,
a wooden bookshelf in the background with textbooks and minimal decor,
walls in charcoal bean and cream beige, a single student chair beside the desk,
no people, mixed warm and natural light, calm professional atmosphere, 4:3 horizontal
```

#### 2.2.4 茶水區（休息與閒聊）
- **檔名**：`public/images/about/space-pantry.webp`

**中文**：
```
一個小型茶水區，一台手沖咖啡器具、一個保溫熱水瓶、一排乾淨白色馬克杯、
牆上掛著一張手寫的「請自取」紙條（不用真的字），木質檯面、
自然光從上方窗戶灑下、奶油米色牆、整潔但有生活感，
無人物，4:3 橫式
```

**英文**：
```
A small pantry corner in a tutoring center, a pour-over coffee setup,
a thermos, a row of clean white mugs, a handwritten paper note pinned on the wall (illegible text),
wooden countertop, natural overhead window light, cream beige wall,
tidy but with lived-in warmth, no people, 4:3 horizontal
```

#### 2.2.5 自習區（免費開放）
- **檔名**：`public/images/about/space-self-study.webp`

**中文**：
```
補習班的自習角落，3-4 個獨立座位、每個座位有獨立的木質書桌與書桌燈、
桌面整潔放著一本翻開的物理課本與計算紙、一個學生背包靠在椅腳（無人物），
牆面為奶油米色、地板淺木紋、暖色檯燈與自然光混合、
安靜、適合長時間閱讀的氛圍，4:3 橫式
```

**英文**：
```
Self-study area in a tutoring center, 3-4 individual seats, each with a wooden desk and desk lamp,
clean desktop with an open physics textbook and scratch paper,
a student backpack leaning against a chair leg (no people present),
cream beige walls, light wood flooring, mix of warm desk lamps and natural daylight,
quiet, conducive-to-long-reading atmosphere, 4:3 horizontal
```

#### 2.2.6 入口走道（溫暖採光）
- **檔名**：`public/images/about/space-entrance.webp`

**中文**：
```
補習班的入口走道，從外側往內看的構圖，木質地板、米色牆面、
左邊掛著一塊小型木質招牌（無清晰文字）、走道盡頭有一張小桌擺著鮮花、
天花板有暖色嵌燈、左側窗戶有大量自然光灑入、
畫面前景留白多、整體有「咖啡館入口」感而非「補習班標準入口」，4:3 橫式
```

**英文**：
```
Entrance corridor of a tutoring center seen from outside looking in,
wooden floor, beige walls, a small wooden signboard on the left wall (illegible text),
a small table with fresh flowers at the end of the corridor,
warm recessed ceiling lights, abundant natural light from a window on the left,
generous foreground whitespace, gives a "cafe entrance" feel rather than standard tutoring center, 4:3 horizontal
```

---

## 3. 教師肖像（7 張，4:5 直式）

> **核心建議**：所有 7 位老師都**強烈建議實拍**（單人棚拍或自然光環境照）。AI 換臉合成有肖像權與真實性風險。
>
> 以下提示詞為「萬一暫無實拍、需要 AI 生成示意圖佔位」的版本，請務必標註為「示意圖」並後續以實拍替換。

### 3.1 共用約束（每張肖像都要套）
- 拍攝風格：**自然光環境人像**（不是棚拍背景白底）
- 構圖：**胸上至腰上**（不要大頭照，留教室或牆面的背景敘事）
- 背景：**淺景深教室一角**、黑板邊緣、書架、奶油米色牆
- 衣著：**乾淨整潔、襯衫或針織衫、不要西裝、不要 T-shirt 大 logo**
- 表情：**溫和、自信、不誇張、嘴角微揚**
- 視線：**對鏡頭微側 15-30 度**（避免證件照感）
- 色調：**暖色、5000K、輕微底片顆粒**
- 種族特徵：**東亞臉孔（台灣本地）**
- **不要戴口罩**

### 3.2 barney（黃韋誌）— 創辦人、台大資工碩士、15 年資歷

**中文**：
```
一位約 38-42 歲的台灣男老師肖像，東亞臉孔、短俐落黑髮微帶些許白髮、
細框眼鏡、米色針織開襟外套搭配白襯衫、知性沈穩的微笑、視線略偏鏡頭右側、
胸上至腰上構圖、淺景深背景是教室角落的黑板與書架、自然光從左前方打來、
4:5 直式構圖、編輯人像風格、VSCO A6、東亞 documentary 攝影感
```

**英文**：
```
Portrait of a Taiwanese male teacher around 38-42 years old, East Asian features,
short neat black hair with a few subtle grey strands, thin-rimmed glasses,
beige knitted cardigan over a white shirt, calm intellectual smile,
gaze slightly off to the right of camera, chest-up to waist composition,
shallow depth of field background showing a corner of a classroom with chalkboard and bookshelf,
natural light from front-left, 4:5 portrait, editorial portrait style, VSCO A6, East Asian documentary feel
```

### 3.3 seba（Seba 老師）— 交大應數、7 年資歷、高中數學

**中文**：
```
一位約 30-33 歲的台灣男老師肖像，東亞臉孔、整齊短髮、清爽無眼鏡、
深藍色 V 領針織衫搭配淺色襯衫、安靜內斂的微笑、手裡輕握一支白色粉筆、
胸上構圖、背景是一面寫著淡淡微積分符號的黑板、自然光從右側、
4:5 直式、編輯人像風格、暖色調
```

**英文**：
```
Portrait of a Taiwanese male teacher around 30-33 years old, East Asian features,
neat short hair, no glasses, navy V-neck knit sweater over a light shirt,
quiet introspective smile, holding a piece of white chalk gently,
chest-up composition, background is a chalkboard with faint calculus notations,
natural light from the right, 4:5 portrait, editorial style, warm tones
```

### 3.4 hao-li（豪理老師）— 清大物理碩士、15 年資歷、物理化學

**中文**：
```
一位約 38-42 歲的台灣男老師肖像，東亞臉孔、黑髮中分微長、戴黑色細框眼鏡、
深灰色羊毛衫搭配格紋襯衫、若有所思的溫和表情、視線略向上方思考、
胸上至腰上構圖、背景隱約有一張波動方程式的板書、自然光從窗戶斜射、
4:5 直式、人文紀實人像風格、暖色調、底片顆粒感
```

**英文**：
```
Portrait of a Taiwanese male teacher around 38-42 years old, East Asian features,
medium-length center-parted black hair, thin black-rimmed glasses,
dark grey wool sweater over a checkered shirt, contemplative warm expression,
gaze slightly upward as if thinking, chest-up to waist composition,
faint wave equation chalkboard notes blurred in background, slanted natural window light,
4:5 portrait, humanistic documentary portrait style, warm tones, film grain
```

### 3.5 jason（Jason 老師）— 嘉義大學應數、5 年資歷、強調陪伴

**中文**：
```
一位約 27-30 歲的台灣男老師肖像，東亞臉孔、短直黑髮、無眼鏡、
卡其色細條紋襯衫袖子捲起、親切開朗但不浮誇的微笑、半側身對著鏡頭、
背景是一張被陽光斜照的木質書桌、有一本翻開的數學練習本，自然光、
4:5 直式、紀實人像、暖色調、有「在地年輕老師」的親近感
```

**英文**：
```
Portrait of a Taiwanese male teacher around 27-30 years old, East Asian features,
short straight black hair, no glasses, khaki fine-striped shirt with sleeves rolled up,
warm friendly but understated smile, three-quarter turn toward camera,
background is a wooden desk in slanted sunlight with an open math practice book,
natural light, 4:5 portrait, documentary style, warm tones,
gives the feel of a young local Taiwanese teacher, approachable
```

### 3.6 sandra（Sandra 老師）— 師大英語、8 年資歷、英文作文

**中文**：
```
一位約 30-34 歲的台灣女老師肖像，東亞臉孔、深棕色長髮自然垂下、
無眼鏡、米白色針織衫搭配絲質圍巾、知性溫柔的微笑、手中拿著一支黑色鋼筆、
胸上構圖、背景是一個堆疊整齊的英文書本書架、有一張寫滿藍色批改痕跡的紙在桌上，
自然光從正前方柔和照射、4:5 直式、編輯人像、暖色調
```

**英文**：
```
Portrait of a Taiwanese female teacher around 30-34 years old, East Asian features,
dark brown long hair flowing naturally, no glasses, off-white knit sweater with silk scarf,
intellectual gentle smile, holding a black fountain pen,
chest-up composition, background is a neatly stacked bookshelf of English books,
a paper with blue editing marks on the desk, soft natural light from the front,
4:5 portrait, editorial style, warm tones
```

### 3.7 chili（陳淑儀）— 義守職能治療、7 年資歷、國高中英文

**中文**：
```
一位約 30-33 歲的台灣女老師肖像，東亞臉孔、黑色及肩中長髮自然微捲、
細框圓眼鏡、駝色高領毛衣、自信且具親和力的微笑、視線正對鏡頭、
胸上構圖、背景是一個小型教學角落、有彩色便利貼貼在牆上（不要太花），
自然光、4:5 直式、編輯人像、暖色調
```

**英文**：
```
Portrait of a Taiwanese female teacher around 30-33 years old, East Asian features,
shoulder-length naturally wavy black hair, thin-rimmed round glasses,
camel turtleneck sweater, confident and approachable smile, gaze directly at camera,
chest-up composition, background is a small teaching corner with a few colorful sticky notes
on the wall (not too busy), natural light, 4:5 portrait, editorial style, warm tones
```

### 3.8 joker（葉謹寬）— 高師大英語在學、嘉中 2025 畢業、6 年資歷

**中文**：
```
一位約 19-21 歲的年輕台灣男老師肖像，東亞臉孔、短俐落黑髮、
細框眼鏡或無眼鏡（兩個版本都試）、白色襯衫袖子捲起搭配深灰色背心、
朝氣但沈穩的微笑、像剛從嘉中畢業不久的學長感、視線略偏鏡頭左側、
胸上構圖、背景是一個教室入口、有一張木質書桌上放著英文文法書，
自然光從窗戶斜射、4:5 直式、暖色調、年輕教師的紀實感
```

**英文**：
```
Portrait of a young Taiwanese male teacher around 19-21 years old, East Asian features,
short neat black hair, optional thin-rimmed glasses (try both variants),
white shirt sleeves rolled up under a dark grey vest, energetic but composed smile,
gives the feel of a senior who just graduated from Chiayi Senior High,
gaze slightly off to the left, chest-up composition,
background is a classroom entrance with a wooden desk and an English grammar book,
slanted natural window light, 4:5 portrait, warm tones, young teacher documentary feel
```

---

## 4. 課程封面（14 張，16:10 橫式）

### 4.1 課程封面共用約束
- **不要出現可辨識的人臉**（用手部、剪影、背影、教材特寫）
- 主視覺以「該科目的核心象徵」為構圖中心
- 構圖採「左 1/3 主體 + 右 2/3 留白」或「中央偏下主體 + 上方留白」便於疊文字
- 色調統一在 latte/cream/espresso/charcoal/caramel 範圍內

### 4.2 高中數學系列（3 張）

#### 4.2.1 高一數學奠基班 `high-math-grade-10`
- **檔名**：`public/images/courses/course-high-math-grade-10.webp`

**中文**：
```
一張木質書桌的俯拍特寫，桌上有一本翻開的高中數學筆記本、
紙上手寫有清晰整齊的三角函數單位圓圖、一支削好的鉛筆斜放、
旁邊一把透明三角板與量角器、左下角有一個白色咖啡馬克杯（只露半邊），
自然光從左上斜射、暖色調、奶油米色背景占畫面 40%、
16:10 橫式、編輯雜誌風、安靜學習氛圍
```

**英文**：
```
Overhead close-up of a wooden desk, an open high school math notebook on it,
neatly handwritten trigonometry unit circle diagram on the page,
a sharpened pencil laid diagonally, a transparent triangle ruler and protractor next to it,
a white coffee mug at the lower-left edge (only half visible),
slanted natural light from upper-left, warm tones, cream beige background occupying 40 percent,
16:10 horizontal, editorial magazine style, quiet study atmosphere
```

#### 4.2.2 高二數學進階班 `high-math-grade-11`
- **檔名**：`public/images/courses/course-high-math-grade-11.webp`

**中文**：
```
一張黑板局部特寫構圖，黑板上有清晰的粉筆字寫著向量與空間幾何示意圖
（不要寫具體文字、避免錯字），有幾何箭頭與座標軸，
畫面右側留白較多、左側為黑板主體、底部隱約看到一張木桌的邊緣與一支粉筆，
無人物、暖色照明從右上、16:10 橫式、編輯感、紀實風
```

**英文**：
```
Close-up of a chalkboard section, clear chalk drawings of vector and 3D geometry diagrams
(no specific text to avoid misspelling), geometric arrows and coordinate axes,
ample whitespace on the right, chalkboard as main subject on the left,
edge of a wooden desk and a piece of chalk at the bottom,
no people, warm lighting from upper-right, 16:10 horizontal, editorial documentary style
```

#### 4.2.3 高三數學總複習班 `high-math-grade-12`
- **檔名**：`public/images/courses/course-high-math-grade-12.webp`

**中文**：
```
一張俯拍的桌面構圖，正中是一本翻開的「錯題本」筆記（手寫感、橫線格紙）、
旁邊散落幾張黑色便利貼寫著淺淺的「再做一次」字樣（中文或英文皆可）、
一支紅筆與一支黑筆交錯放著、左上角隱約有一杯黑咖啡的杯緣、
自然光從正上方、奶油米色桌面背景、暖色調，16:10 橫式、安靜緊湊感
```

**英文**：
```
Overhead shot of a desk, center is an open notebook labeled as a mistake correction journal
(handwritten feel, ruled paper), a few black sticky notes scattered with faint handwriting,
a red pen and a black pen laid crossing each other, edge of a black coffee cup at upper-left,
overhead natural light, cream beige desk background, warm tones,
16:10 horizontal, quiet focused atmosphere
```

### 4.3 高中理化（2 張）

#### 4.3.1 高中物理小班 `high-physics`
- **檔名**：`public/images/courses/course-high-physics.webp`

**中文**：
```
一張木質桌面的俯拍，桌上有一個小型物理示範用的金屬擺鐘或彈簧、
旁邊一本攤開的物理筆記、手寫著力與加速度的向量示意圖（不寫文字）、
一支削好的鉛筆與一把直尺，自然光從左斜射、暖色調、
畫面右半邊留白多、16:10 橫式、編輯紀實感
```

**英文**：
```
Overhead shot of a wooden desk, a small physics demo metal pendulum or spring on it,
an open physics notebook next to it with handwritten force and acceleration vector diagrams (no text),
a sharpened pencil and a ruler, slanted natural light from the left,
warm tones, right half of the frame is whitespace,
16:10 horizontal, editorial documentary style
```

#### 4.3.2 高中化學小班 `high-chemistry`
- **檔名**：`public/images/courses/course-high-chemistry.webp`

**中文**：
```
一張俯拍構圖，桌上整齊擺著一個透明小燒杯（內裝淡焦糖色液體）、
一支玻璃攪拌棒、旁邊一本翻開的化學筆記、手寫有機分子結構（六角環示意，不寫文字）、
左下角隱約有一個白色實驗筆記本的邊角，自然光柔和、暖色調、
拿鐵奶泡米色背景，16:10 橫式
```

**英文**：
```
Overhead composition, a small transparent beaker with faint caramel-colored liquid on the desk,
a glass stir rod, an open chemistry notebook with handwritten hexagonal organic molecule sketches (no text),
edge of a white lab notebook at lower-left, soft natural light, warm tones,
latte foam beige background, 16:10 horizontal
```

### 4.4 國中課程系列（3 張）

#### 4.4.1 國中生物小班 `junior-biology`
- **檔名**：`public/images/courses/course-junior-biology.webp`

**中文**：
```
俯拍桌面，桌上有一個小型放大鏡、一片乾燥葉子標本、一本翻開的生物筆記
（手繪有細胞示意圖，不寫文字）、一支綠色與一支棕色色鉛筆，
自然光從窗外灑入、暖色調、奶油米色背景占畫面 50%、16:10 橫式、生活感
```

**英文**：
```
Overhead desk shot, a small magnifying glass, a pressed dry leaf specimen,
an open biology notebook with handwritten cell sketches (no text),
a green and a brown colored pencil, natural light from a window,
warm tones, cream beige background occupying 50 percent, 16:10 horizontal, lived-in feel
```

#### 4.4.2 國中自然小班 `junior-science`
- **檔名**：`public/images/courses/course-junior-science.webp`

**中文**：
```
俯拍構圖，桌上有一個小型電路示範組件（電池、燈泡、銅線形成簡單迴路）、
旁邊一本翻開的理化筆記（手寫有歐姆定律式示意圖，不寫具體文字）、
一支削好的鉛筆，自然光、暖色調、拿鐵奶泡米色背景，16:10 橫式
```

**英文**：
```
Overhead shot, a small circuit demo (battery, light bulb, copper wire forming a simple loop) on the desk,
an open science notebook with handwritten Ohm's law diagram sketches (no specific text),
a sharpened pencil, natural light, warm tones, latte foam beige background, 16:10 horizontal
```

#### 4.4.3 升高中數學基礎搶救班 `pre-high-math-rescue`
- **檔名**：`public/images/courses/course-pre-high-math-rescue.webp`

**中文**：
```
俯拍構圖，桌上有一個夏日清新感的場景：一本翻開的數學基礎練習簿、
一支鉛筆與一塊新橡皮擦、一個透明玻璃杯裝著淺琥珀色的麥茶、一片乾燥薄荷葉，
自然光明亮、暖色但不過暖、有「重新開始」的清爽感、奶油米色背景，16:10 橫式
```

**英文**：
```
Overhead shot, a summer-fresh scene on the desk: an open basic math practice book,
a pencil and a new eraser, a transparent glass cup with light amber barley tea, a dried mint leaf,
bright natural light, warm but not too warm tones, a "fresh start" feeling,
cream beige background, 16:10 horizontal
```

### 4.5 衝刺班（1 張）

#### 4.5.1 學測數學衝刺班 `gsat-math-sprint`
- **檔名**：`public/images/courses/course-gsat-math-sprint.webp`

**中文**：
```
俯拍構圖，桌上是一張正在被計時的桌面：一個機械計時器（指針式）、
一張模擬考考卷正面朝下放著（不寫文字）、一支黑色筆與一支紅色筆、
旁邊一杯黑咖啡（俯視只看到杯口圓形）、自然光略偏冷但仍在暖色範圍、
有「最後三個月衝刺」的緊湊感但不焦慮，16:10 橫式
```

**英文**：
```
Overhead composition, a desk being timed: a mechanical analog timer,
a mock exam paper face-down (no text visible), a black pen and a red pen,
a cup of black coffee viewed from above (only the rim circle), natural light slightly cooler
but still in warm range, gives a "final three-month sprint" feel without being anxious,
16:10 horizontal
```

### 4.6 社會科系列（2 張）

#### 4.6.1 國中社會小班 `junior-social-studies`
- **檔名**：`public/images/courses/course-junior-social-studies.webp`

**中文**：
```
俯拍構圖，桌上攤開一張舊風格的台灣地圖（米色紙感、無清晰文字），
旁邊一本翻開的社會筆記、手繪有簡單的時間軸（不寫文字）、
一支削好的鉛筆與一個小型木質指南針，自然光從左斜射、暖色調，
拿鐵奶泡米色背景，16:10 橫式
```

**英文**：
```
Overhead shot, an old-style Taiwan map spread on the desk (beige paper feel, no clear text),
an open social studies notebook with a hand-drawn simple timeline (no text),
a sharpened pencil and a small wooden compass, slanted natural light from the left,
warm tones, latte foam beige background, 16:10 horizontal
```

#### 4.6.2 高中社會小班 `senior-social-studies`
- **檔名**：`public/images/courses/course-senior-social-studies.webp`

**中文**：
```
俯拍構圖，桌上有一本厚重的舊書翻開（看似歷史或哲學書，無清晰文字）、
旁邊一本筆記寫著手繪的「跨科整合」示意圖（三個圓重疊，不寫文字）、
一支黑色鋼筆與一杯熱茶（白色瓷杯，俯視看見茶湯琥珀色），
自然光從窗戶柔和散射、暖色調、奶油米色背景，16:10 橫式、編輯雜誌感
```

**英文**：
```
Overhead composition, a thick old book opened on the desk (looks like history or philosophy, no clear text),
a notebook with hand-drawn cross-discipline diagram (three overlapping circles, no text),
a black fountain pen and a cup of hot tea (white porcelain cup with amber-colored tea visible from above),
soft diffused natural light, warm tones, cream beige background,
16:10 horizontal, editorial magazine feel
```

### 4.7 其他課程（3 張）

#### 4.7.1 高中英文小班 `high-english`
- **檔名**：`public/images/courses/course-high-english.webp`

**中文**：
```
俯拍構圖，桌上有一本翻開的英文文法書（看見頁緣但不寫具體文字）、
旁邊一本筆記寫滿手寫筆記（不寫具體字、看起來像英文）、
一支黑色鋼筆與一張螢光黃便利貼（淺色不要太鮮豔）、
一杯英式紅茶（白色瓷杯），自然光、暖色調、奶油米色背景，16:10 橫式
```

**英文**：
```
Overhead shot, an open English grammar book on the desk (page edges visible but no specific text),
a notebook full of handwritten notes (illegible English-looking writing),
a black fountain pen and a soft yellow sticky note (muted not vivid),
a cup of English black tea (white porcelain), natural light, warm tones,
cream beige background, 16:10 horizontal
```

#### 4.7.2 Python 程式設計小班 `python-programming`
- **檔名**：`public/images/courses/course-python-programming.webp`

**中文**：
```
俯拍構圖，桌上有一台木質框架感的筆記型電腦（螢幕關閉或顯示淺色背景）、
旁邊一本筆記寫著手繪流程圖（不寫文字）、一個小型木質齒輪裝飾、
一杯黑咖啡，自然光從左斜射、暖色調、奶油米色背景，
16:10 橫式、編輯雜誌感、有「人文與科技交會」的感覺
```

**英文**：
```
Overhead composition, a laptop with a wooden-feel frame on the desk (screen off or showing soft neutral),
a notebook with hand-drawn flowchart (no text), a small wooden gear ornament,
a cup of black coffee, slanted natural light from the left, warm tones,
cream beige background, 16:10 horizontal, editorial feel,
gives the impression of where humanism meets technology
```

#### 4.7.3 國小自然手作班 `elementary-science-craft`
- **檔名**：`public/images/courses/course-elementary-science-craft.webp`

**中文**：
```
俯拍構圖，桌上有一個小型 DIY 手作素材：一段彩色塑膠管、一個小磁鐵、
一張白色厚紙板上有手繪示意圖、幾顆小石頭與一片乾燥葉子、
一把兒童安全剪刀（圓頭、淺色），自然光明亮、暖色調、奶油米色背景，
有「童趣但不幼稚」的感覺，16:10 橫式
```

**英文**：
```
Overhead composition, small DIY craft materials on the desk: a piece of colored plastic tube,
a small magnet, a white thick paper with hand-drawn sketches, a few small stones and a dried leaf,
a pair of child-safe scissors (round-tipped, light-colored), bright natural light, warm tones,
cream beige background, "playful but not childish" feel, 16:10 horizontal
```

---

## 5. 家教課程封面（3 張，16:10 橫式）

### 5.1 Sandra 英文作文 1 對 1 遠端家教 `sandra-english-composition`
- **檔名**：`public/images/tutoring/tutor-sandra-english-composition.webp`

**中文**：
```
俯拍構圖，桌上有一台筆記型電腦（螢幕上模糊顯示一個 Google Docs 風格的白色文件介面、
不寫具體文字）、旁邊一支黑色鋼筆與一杯黑咖啡，
左下角有一張用紅筆批改痕跡的紙（不寫文字），自然光從右斜射、暖色調，
有「遠端但專注」的感覺，16:10 橫式、編輯雜誌感
```

**英文**：
```
Overhead shot, a laptop on the desk (screen vaguely showing a Google Docs-style white document interface, no specific text),
a black fountain pen and a cup of black coffee beside it,
a paper with red editing marks at the lower-left (no text), slanted natural light from the right,
warm tones, "remote but focused" feel, 16:10 horizontal, editorial style
```

### 5.2 Joker 英文 1 對 1 實體家教 `joker-english`
- **檔名**：`public/images/tutoring/tutor-joker-english.webp`

**中文**：
```
俯拍構圖，桌上有兩本英文書（一本翻開、一本闔上）、
旁邊一個木質書架的邊角（裝飾性），一支削好的鉛筆與一塊新橡皮擦、
一杯白色瓷杯紅茶，畫面有「年輕學長帶學弟妹」的親近感、
自然光、暖色調、奶油米色背景，16:10 橫式
```

**英文**：
```
Overhead shot, two English books on the desk (one open, one closed),
edge of a wooden bookshelf visible (decorative), a sharpened pencil and a new eraser,
a white porcelain cup with black tea, gives the feel of a young senior tutoring juniors,
natural light, warm tones, cream beige background, 16:10 horizontal
```

### 5.3 Chili 國高中英文 1 對 1 實體家教 `chili-english`
- **檔名**：`public/images/tutoring/tutor-chili-english.webp`

**中文**：
```
俯拍構圖，桌上有一本英文教科書翻開、一張寫有正向回饋小貼紙的便條
（不寫具體文字、用淡色貼紙、淺粉或淺米色，避開鮮豔色）、
一支黑色筆、一個沙漏計時器（淺色木質支架），
自然光柔和、暖色調、奶油米色背景，
有「注意力訓練、節奏掌握」的感覺，16:10 橫式
```

**英文**：
```
Overhead shot, an open English textbook on the desk, a note with a small encouragement sticker
(no specific text, soft pastel sticker in light pink or beige, no vivid colors),
a black pen, an hourglass timer with light wooden frame,
soft natural light, warm tones, cream beige background,
gives the feel of focus training and pacing, 16:10 horizontal
```

---

## 6. 文章封面（4 張，16:9 橫式）

> **建議**：文章封面是「進場視覺」、PostCard 縮圖會吃這張。請保持構圖簡潔、上方有留白以便疊標題。

### 6.1 `physics-misconceptions` — 高中物理 5 個迷思
- **檔名**：`public/images/posts/post-physics-misconceptions.webp`

**中文**：
```
黑板局部特寫，黑板上以白色粉筆繪有 5 個「打叉」的迷思示意圖
（用簡單的物理示意圖如箭頭、向量、不寫具體文字），右側留白多供疊文字，
畫面底部隱約看到木質桌邊與一支粉筆，暖色照明從右上方，
16:9 橫式、編輯雜誌感、靜止研究氛圍
```

**英文**：
```
Close-up of a chalkboard section with 5 misconception sketches marked with X
(simple physics diagrams like arrows, vectors; no text), ample whitespace on the right for title overlay,
edge of a wooden desk and a piece of chalk at the bottom,
warm lighting from upper-right, 16:9 horizontal, editorial style, still study atmosphere
```

### 6.2 `chiayi-high-math-prep-2026` — 嘉義家長選課指南
- **檔名**：`public/images/posts/post-chiayi-high-math-prep-2026.webp`

**中文**：
```
俯拍構圖，桌上有一張紙質的「選課比較表」（手繪格子但不寫具體文字、
有些格子有勾選痕跡），旁邊一支鉛筆與一杯熱茶（白瓷杯），
左下角有一張紙片寫著淡淡的「2026」（手寫感、不誇張），
自然光從窗戶斜射、暖色調、奶油米色背景，16:9 橫式，
有「家長安心做決定」的氛圍
```

**英文**：
```
Overhead shot, a paper-based "course comparison table" on the desk (hand-drawn grid, no specific text,
some cells with checkmarks), a pencil and a cup of hot tea (white porcelain) beside it,
a small paper at the lower-left with faint handwritten "2026" (subtle, not bold),
slanted natural window light, warm tones, cream beige background, 16:9 horizontal,
gives the feel of "parents making a calm decision"
```

### 6.3 `why-small-class` — 為什麼堅持小班制
- **檔名**：`public/images/posts/post-why-small-class.webp`

**中文**：
```
側拍構圖，畫面前景是一張木質課桌的局部（看得到一本翻開的筆記與一隻手在寫字、
只露手腕與筆的部分、不見人臉），後景有一個模糊的人影站在桌邊（剪影、不見臉），
有「老師走到學生桌邊」的氛圍，自然光、暖色調、淺景深、奶油米色背景，
16:9 橫式、紀實感、溫暖
```

**英文**：
```
Side-angle composition, foreground is part of a wooden classroom desk (an open notebook and a hand writing,
only wrist and pen visible, no face), background has a blurred standing figure beside the desk
(silhouette, no face visible), gives the "teacher walking to student's side" atmosphere,
natural light, warm tones, shallow depth of field, cream beige background,
16:9 horizontal, documentary feel, warm
```

### 6.4 `english-composition-fundamentals` — 學測英文作文評分
- **檔名**：`public/images/posts/post-english-composition-fundamentals.webp`

**中文**：
```
俯拍構圖，桌上有一張英文作文紙（手寫感、不寫具體文字、有藍色與紅色批改痕跡），
旁邊一支紅色鋼筆與一支藍色鋼筆，一個白色瓷杯黑咖啡，
自然光從正上方、暖色調、奶油米色背景，16:9 橫式，
有「評分老師仔細閱讀」的感覺
```

**英文**：
```
Overhead shot, an English composition paper on the desk (handwritten feel, no specific text,
with blue and red editing marks), a red fountain pen and a blue fountain pen beside it,
a white porcelain cup of black coffee, overhead natural light, warm tones,
cream beige background, 16:9 horizontal,
gives the feel of "an examiner reading attentively"
```

---

## 7. Landing Page Hero（1 張，16:9 寬幅）

### 7.1 2026 暑期班 LP `summer-2026`
- **檔名**：`public/images/landing/landing-summer-2026.webp`
- **尺寸**：1920 × 1080

**中文提示詞**：
```
一個寬幅夏日教室晨光場景，斜俯角構圖，
畫面右側 1/3 是一張木質長桌一角、桌上整齊擺著一本翻開的數學筆記、
一杯透明玻璃杯裝著淺琥珀色的茶、一支削好的鉛筆、一片乾燥薄荷葉、
畫面左側 2/3 是窗戶射入的柔和晨光與奶油米色牆面（充足留白供疊文字），
窗外隱約有綠色植物的剪影，光線是清晨 7-9 點的暖黃光（5000K），
無人物，紙張紋理輕微疊加，VSCO A6 風格，
拿鐵奶泡米色與焦糖金為主、濃縮咖啡棕作為文字落點區域，
有「夏天、重新開始、把卡住的觀念補回來」的氛圍，
16:9 寬幅、編輯雜誌感、靜謐有希望
```

**英文提示詞**：
```
Wide summer morning classroom scene, slight overhead diagonal angle,
right 1/3 of frame is a corner of a wooden long desk with an open math notebook,
a transparent glass cup of light amber tea, a sharpened pencil, a dried mint leaf,
left 2/3 is soft morning light streaming through a window and cream beige walls (ample whitespace for title overlay),
silhouettes of green plants barely visible outside the window,
light is the warm yellow of 7-9am morning (5000K), no people,
subtle paper grain overlay, VSCO A6 style,
dominant latte foam beige and caramel gold, espresso tan as the text-landing zone,
gives the feel of "summer, fresh start, catching up on what got stuck",
16:9 wide, editorial magazine style, quiet hopeful atmosphere
```

---

## 8. OG 預設社群分享圖（1 張，1.91:1）

### 8.1 全站 OG 預設圖 `og-default`
- **檔名**：`public/og-default.png`（覆蓋現有檔）
- **尺寸**：1200 × 630

**中文提示詞**：
```
一個橫式構圖，左側 60% 是品牌名「賈伯斯數理教室」文字落點區域（請留白、文字會後製疊上去），
右側 40% 是一個小型場景：一個白色咖啡杯、一支白色粉筆、一本翻開的筆記，
桌面為木質、自然光從右斜射、暖色調、奶油米色背景，
左下角隱約有「嘉義 · 東區 · 康樂街」的文字落點（也請留白），
1.91:1 寬幅，極簡編輯感
```

**英文提示詞**：
```
Horizontal composition, left 60% is the brand title text-landing zone (keep blank, text will be overlaid),
right 40% is a small scene: a white coffee cup, a piece of white chalk, an open notebook,
wooden desktop, slanted natural light from the right, warm tones, cream beige background,
lower-left has a faint location text-landing zone (also blank),
1.91:1 wide, minimalist editorial feel
```

> ⚠️ **建議**：OG 圖最終會疊上文字，**請在 AI 生成後另用 Figma / Photoshop 加上「賈伯斯數理教室」與標語**，不要直接讓 AI 生成中文字（AI 模型對繁體中文字錯誤率高）。

---

## 9. 不建議生成的圖片（避免不必要的視覺負擔）

以下位置目前是「純文字 + 紋理 + 圖示」設計，**建議維持現狀**，不要為了塞圖而塞圖：

| 位置 | 為何不建議加圖 |
|---|---|
| 首頁 Hero | 已有 SVG 圖（π·∫·∑ 圓圈）+ 紙張紋理，視覺已飽滿 |
| 404 / 搜尋頁 / FAQ Hero | 純文字搭配 icon 已清晰，加圖反而干擾 |
| Nav / Footer / Timeline / Toc 等元件 | 功能性元件，加圖會破壞清爽感 |
| 學生見證 testimonials | 學生未成年 + 化名，**禁止**生成虛構學生臉孔 |
| 部落格內文中間段 | 內文已有 Markdown 排版，圖片應出現在文章開頭 cover，內文圖片只在「業主主動提供實物照」時才加 |
| 課程詳頁 hero | 課程資訊密度高，加大圖反而推遠 CTA。維持純文字 hero |

---

## 10. 圖片優化與部署 checklist（給工程師 / 業主）

- [ ] 全部圖片以 **WebP 為主格式**、**AVIF 為次要 srcset 來源**
- [ ] 用 Astro 內建 `<Image>` 元件、不要手寫 `<img>`
- [ ] 每張圖必填 `alt` 屬性（具描述性，不要寫「圖片 1」）
- [ ] 上方折疊區內的圖（hero、index 課程卡前 3 張）使用 `loading="eager"`；其餘全部 `loading="lazy"`
- [ ] 教師肖像、課程封面在 Astro 編譯時會自動產生 240w / 480w / 960w / 1600w 的 srcset
- [ ] 全站圖片總量目標：**首頁總 image payload < 600KB（gzipped/transferred）**
- [ ] 文章內頁 cover 圖之外不要塞額外裝飾圖（保持 INP < 200ms）
- [ ] 為每張教師照、每張課程封面填入該檔的 frontmatter `photo` / `cover` 欄位
- [ ] LP `summer-2026.md` 填入 `heroImage`
- [ ] OG 預設圖以新版覆蓋 `public/og-default.png`

---

## 11. 提示詞使用 SOP（給業主操作 AI 工具用）

### 11.1 即夢 Jimeng 使用步驟
1. 將「§1.1 中文 base style」+「§1.2 色票文字」+ 該圖的「中文提示詞」串成一段（用句號分隔）
2. 在「負面提示詞」欄位貼上 §1.3 的中文版（自行翻譯或保留英文）
3. 比例選「對應的 4:5 / 16:10 / 16:9」
4. 一次跑 4 張、挑選最接近的、再用「以圖生圖」微調
5. 解析度選最大（即夢免費版 1024px、付費版 2048px）

### 11.2 nano banana (Gemini 2.5 Flash Image) 使用步驟
1. 將「§1.1 英文 base style」+「§1.2 色票文字 + HEX」+ 該圖的「英文提示詞」串成一段
2. 在 prompt 末尾加上 `Negative prompt: [貼 §1.3 英文版]`
3. 由於 nano banana 不支援 aspect ratio 參數，**請在 prompt 中明確寫**「composition is X by Y horizontal」並後製裁切
4. 一次跑 2-4 張、用「edit」功能微調局部

### 11.3 跨工具一致性建議
- **同一批圖片用同一工具跑完**（教師肖像 7 張全用即夢、或全用 nano banana），避免風格漂移
- 若已產出第一張喜歡的圖，**保留 seed / reference image**，後續的圖用「以圖生圖」延續風格
- 完成後請集中放在 `public/images/<分類>/` 目錄、不要散落

---

## 12. 變更紀錄

| 版本 | 日期 | 變更 |
|---|---|---|
| v1.0 | 2026-05-15 | 初版建立，覆蓋全站 7 老師 + 14 課程 + 3 家教 + 4 文章 + 1 LP + 7 教室空間 + 1 OG 預設 = 約 33 張提示詞 |
