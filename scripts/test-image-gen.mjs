// 一次性验证脚本：跑通 Vertex Gemini 图片生成 + 中国政府庄重风格。
// 运行：npm run test:image   （会自动 --env-file=.env 加载 VERTEX）
//
// 成功条件：拿到 ≥ 1 张 PNG，落盘到 /tmp/gen-test/，并报 ms 耗时。
// 失败时按候选模型清单回退。

import { GoogleGenAI } from "@google/genai";
import fs from "node:fs/promises";
import path from "node:path";

const apiKey = process.env.VERTEX;
if (!apiKey) {
  console.error("❌ 缺 VERTEX 环境变量（应在 .env 里）");
  process.exit(1);
}

// Vertex Express 模式：用 API key 走 Vertex AI，免去 GCP project + region 配置
const ai = new GoogleGenAI({
  vertexai: true,
  apiKey,
  apiVersion: "v1",
});

// 模型按优先级回退
const MODEL_CANDIDATES = [
  "gemini-3.1-flash-image-preview",   // 用户原文（Nano Banana 2 候选名）
  "gemini-3-pro-image-preview",        // Nano Banana 2 已知发布名
  "gemini-2.5-flash-image-preview",    // Nano Banana 1（一定能跑）
];

// 风格 prompt v1 —— 落地 "中国政府办事庄重气氛 + 中国人 + 中国城市风貌"
const PROMPT = `
A formal, dignified editorial illustration for a Chinese government-affiliated professional construction training school's official WeChat newsletter (广州市建设职业培训学校 / gzcots).

FOREGROUND:
A confident Chinese professional in their 30s, wearing a navy-blue construction safety helmet and a clean white-collared shirt with a subtle ID lanyard, holding a clipboard with official-looking documents. Posture upright. Expression composed, trustworthy, focused — not cartoonish, not overly bright, not stock-photo smiling. Clearly East Asian / Han Chinese facial features.

BACKGROUND:
Modern Chinese urban skyline at soft morning light. A subtle silhouette of government-style office buildings (clean modernist Chinese civic architecture, no Western columns, no European elements) and one or two construction cranes in the far distance, implying urban development and the construction industry. Avoid specific real landmarks. Avoid any non-Chinese signage.

STYLE:
Clean editorial illustration. Limited and harmonious color palette dominated by engineering blue (#1a4b8c), warm brass gold (#b89b5e), and warm off-white background (#fafaf7). Crisp lines. No neon, no cartoonish exaggeration, no over-decoration. The look should feel like the cover of a government policy explainer pamphlet — not a sales advertisement.

MOOD: Authoritative, professional, reassuring, slightly formal.

COMPOSITION: Subject positioned on the left third. Plenty of negative space on the right and top for Chinese-language headline overlay. 16:9 horizontal aspect ratio.

STRICT RULES:
- NO text, letters, words, characters, or numbers in the image (overlay will be added later).
- NO Western faces, NO European/American architecture.
- NO Chinese flags, party emblems, or specific government insignia (we are not a state media outlet).
- NO cartoon style. NO anime. NO 3D toy aesthetic.
`.trim();

async function tryGenerate(modelName) {
  console.log(`\n→ 模型: ${modelName}`);
  const start = Date.now();
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: PROMPT,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    let savedPath = null;
    let textOut = "";

    for (const part of parts) {
      if (part.text) textOut += part.text;
      if (part.inlineData) {
        const buf = Buffer.from(part.inlineData.data, "base64");
        const outDir = "/tmp/gen-test";
        await fs.mkdir(outDir, { recursive: true });
        const fname = `test-${modelName.replace(/[^a-z0-9]/gi, "_")}.png`;
        savedPath = path.join(outDir, fname);
        await fs.writeFile(savedPath, buf);
        console.log(`✅ 落盘: ${savedPath} (${(buf.length / 1024).toFixed(1)} KB)`);
      }
    }

    if (textOut.trim()) {
      console.log(`📝 文本伴随输出: ${textOut.slice(0, 200).replace(/\n/g, " ")}${textOut.length > 200 ? "…" : ""}`);
    }
    if (!savedPath) {
      console.log(`⚠️ 模型响应了但 parts 里没图`);
      return null;
    }

    return { modelName, savedPath, elapsedMs: Date.now() - start };
  } catch (err) {
    const msg = err?.message ?? String(err);
    console.log(`❌ ${msg.slice(0, 400)}`);
    return null;
  }
}

let success = null;
for (const m of MODEL_CANDIDATES) {
  success = await tryGenerate(m);
  if (success) break;
}

if (!success) {
  console.error("\n=== 所有候选模型都失败 ===");
  process.exit(2);
}

console.log("\n=== ✅ 验证成功 ===");
console.log(`模型: ${success.modelName}`);
console.log(`耗时: ${success.elapsedMs} ms`);
console.log(`图片: ${success.savedPath}`);
console.log(`\n下一步：在主对话里 Read 这张图，目测风格是否符合"庄重 + 中国"基调。`);
