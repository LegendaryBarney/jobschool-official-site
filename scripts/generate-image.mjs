// scripts/generate-image.mjs
// 用 Google AI Studio 的 Imagen 3 生成品牌圖片（可重用：單張驗證 + 夜跑量產）。
//
// 用法（金鑰放專案 .env 的 GEMINI_API_KEY，用 Node 22 內建 --env-file 讀）：
//   node --env-file=.env scripts/generate-image.mjs --prompt-file docs/image-prompts/courses/course-python-programming.md --out src/assets/images/courses/python.jpg --aspect 16:9
//   node --env-file=.env scripts/generate-image.mjs --prompt "..." --out tmp/test.jpg
//
// 參數：
//   --prompt-file <路徑>  讀檔當 prompt（docs/image-prompts/*.md，整檔內容即 prompt）
//   --prompt "<文字>"     直接給 prompt（與 --prompt-file 擇一）
//   --out <路徑>          輸出檔（預設 image.jpg；目錄會自動建立）
//   --aspect <比例>       1:1 / 3:4 / 4:3 / 9:16 / 16:9（Imagen 3 支援；預設 16:9）
//   --n <數量>            生成張數（預設 1；>1 時檔名加 -1/-2…）
//   --model <名稱>        預設 imagen-3.0-generate-002

import { GoogleGenAI } from '@google/genai';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const promptFile = getArg('--prompt-file');
const promptText = getArg('--prompt');
const out = getArg('--out') || 'image.jpg';
const aspect = getArg('--aspect') || '16:9';
const n = parseInt(getArg('--n') || '1', 10);
const model = getArg('--model') || 'imagen-3.0-generate-002';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('ERROR: 找不到 GEMINI_API_KEY。請用：node --env-file=.env scripts/generate-image.mjs ...');
  process.exit(1);
}

let prompt = promptText;
if (promptFile) prompt = readFileSync(promptFile, 'utf8').trim();
if (!prompt) {
  console.error('ERROR: 需要 --prompt 或 --prompt-file');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

console.log(`[imagen] model=${model} aspect=${aspect} n=${n} out=${out}`);
console.log(`[imagen] prompt(${prompt.length} chars): ${prompt.slice(0, 90).replace(/\n/g, ' ')}…`);

try {
  // 兩種生圖路徑：Imagen 系列走 generateImages(predict，需付費方案)；
  // Gemini image 系列（gemini-*-image，免費）走 generateContent，圖在回應 parts 的 inlineData。
  let imagesB64 = [];
  if (model.startsWith('imagen')) {
    const response = await ai.models.generateImages({
      model,
      prompt,
      config: { numberOfImages: n, aspectRatio: aspect, outputMimeType: 'image/jpeg' },
    });
    imagesB64 = (response?.generatedImages || [])
      .map((g) => g?.image?.imageBytes)
      .filter(Boolean);
    if (!imagesB64.length) {
      console.error('ERROR: Imagen 無生成圖片。response 摘要:', JSON.stringify(response)?.slice(0, 800));
      process.exit(2);
    }
  } else {
    // Gemini image：用 prompt 內帶比例提示；config 嘗試帶 imageConfig（新 SDK 支援）
    const response = await ai.models.generateContent({
      model,
      contents: `${prompt}\n\n(Output a single image. Target aspect ratio ${aspect}.)`,
      config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: aspect } },
    });
    const parts = response?.candidates?.[0]?.content?.parts || [];
    imagesB64 = parts.filter((p) => p?.inlineData?.data).map((p) => p.inlineData.data);
    if (!imagesB64.length) {
      const texts = parts.filter((p) => p?.text).map((p) => p.text).join(' ');
      console.error('ERROR: Gemini 回應無圖片。', texts ? `模型文字回應: ${texts.slice(0, 300)}` : JSON.stringify(response)?.slice(0, 600));
      process.exit(2);
    }
  }

  mkdirSync(dirname(out), { recursive: true });
  imagesB64.forEach((b64, i) => {
    const buf = Buffer.from(b64, 'base64');
    const path = n > 1 ? out.replace(/(\.[^.]+)?$/, `-${i + 1}$1`) : out;
    writeFileSync(path, buf);
    console.log(`[imagen] ✓ saved ${path} (${buf.length.toLocaleString()} bytes)`);
  });
  console.log('[imagen] done.');
} catch (e) {
  console.error('ERROR 生圖失敗:', e?.message || e);
  if (e?.status) console.error('  status:', e.status);
  process.exit(3);
}
