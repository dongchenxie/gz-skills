// 生产用：为公众号推文生成配图，并直接上传 Cloudflare R2（S3 兼容）。
//
// 调用方式（在 sub-agent 内执行，结果以 stdout JSON 回主上下文，不要 base64 灌回）：
//   node --env-file=.env scripts/gen-image.mjs \
//     --slug 2026-05-11-policy-anquanyuan \
//     --role hero|inline \
//     --theme "安全员证书新规" \
//     --audience B|C|mix \
//     --goal fan|conv|hybrid \
//     --article-type policy|tips|guide|news|holiday \
//     [--style-extra "工地实景，工人挂安全带"]
//
// R2 key：{slug}/images/{role}-{ts}.png
// 公网 URL：https://pub-e96b09db0cf94150b117f241f58a10f3.r2.dev/{slug}/images/{role}-{ts}.png
//
// stdout 仅一行 JSON：{ok, url, key, model, elapsedMs, bytes}（错误时 ok=false + reason）

import { GoogleGenAI } from "@google/genai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_BUCKET = "test-china-video";
const R2_PUBLIC_BASE = "https://pub-e96b09db0cf94150b117f241f58a10f3.r2.dev";

const MODEL_CANDIDATES = [
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview",
  "gemini-2.5-flash-image-preview",
];

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      out[k] = v;
    }
  }
  return out;
}

function die(reason) {
  console.log(JSON.stringify({ ok: false, reason }));
  process.exit(1);
}

// 通用基调（所有图必带）
const BASE_STYLE = `
A formal, dignified editorial illustration for a Chinese government-affiliated professional construction training school's WeChat newsletter (广州市建设职业培训学校 / gzcots).

STYLE BASELINE:
- Clean editorial illustration, slightly flat, dignified.
- Limited palette dominated by engineering blue (#1a4b8c), warm brass gold (#b89b5e), warm off-white background (#fafaf7), with subtle dark navy accents.
- The mood is the visual tone of a Chinese government policy explainer pamphlet — authoritative, professional, reassuring. Not an advertisement.

HARD RULES:
- NO text, letters, words, characters, or numbers in the image.
- All human figures MUST be East Asian / Han Chinese in appearance.
- Architecture MUST be modern Chinese civic/urban style — no Western columns, no European cathedrals, no American-style brownstones.
- NO Chinese national flags, no party emblems, no specific government insignia (we are a school, not a state outlet).
- NO cartoon, anime, 3D toy, or chibi aesthetics. NO neon or oversaturated colors.
- NO foreign signage or Latin lettering anywhere in the frame.
`.trim();

// 按 role × article-type × audience × goal 组合主体
function buildSubjectClause({ role, articleType, audience, goal, theme, styleExtra }) {
  const isB = audience === "B";
  const isFan = goal === "fan";
  const isConv = goal === "conv";

  // 主体场景候选
  const subjectByType = {
    policy: isB
      ? "A confident Chinese site manager in his/her 30s-40s, hard hat off held under arm, examining policy documents on a clipboard. Behind: a Chinese government office building exterior with subtle stone facade and clean modernist lines."
      : "A confident Chinese professional in his/her 30s, wearing a navy construction safety helmet and a white-collared shirt with an ID lanyard, holding a clipboard. Behind: a modern Chinese cityscape with one or two construction cranes in the distance.",
    tips: isB
      ? "A Chinese safety supervisor pointing at a wall-mounted compliance notice board on a clean office wall. Background: orderly office interior in muted tones, with construction-industry visual cues."
      : "A Chinese craftsman/worker in a clean uniform looking thoughtfully at an expiring certificate or training card on a desk. Background: an orderly office or training room interior.",
    guide: "A Chinese professional seated at a clean desk, working on a laptop displaying an official-looking form (no text, just generic form layout). Background: an orderly government-style office interior with soft natural light.",
    news: "Two or three Chinese professionals in formal-casual attire, standing in a posed half-front group composition in front of a Chinese government-style building entrance or training school facade. Composed expressions, posture upright.",
    holiday: "A composed wide silhouette of Chinese construction workers and engineers at dawn or dusk in front of a modern Chinese cityscape, conveying the dignity of builders. No celebratory pyrotechnics, no red lanterns clichés — restrained, ceremonial.",
  };

  let subject = subjectByType[articleType] ?? subjectByType.policy;

  // goal 调整氛围
  if (isFan) {
    subject += " The composition should feel emotionally engaging and human, with a touch of warmth — suitable for a sharable, scroll-stopping cover image.";
  } else if (isConv) {
    subject += " The composition should feel reassuring and trustworthy — suitable for a trust-building cover image that motivates inquiry.";
  } else {
    subject += " The composition should feel balanced — neither overly emotional nor overly transactional.";
  }

  // 主题钩子
  if (theme) {
    subject += ` Visual context hint (do not render as text): the article topic is "${theme}". Let this hint subtly inform props and setting choices.`;
  }

  if (styleExtra) {
    subject += ` Additional staging request: ${styleExtra}.`;
  }

  return subject;
}

function buildCompositionClause(role) {
  if (role === "hero") {
    return `
COMPOSITION (HERO / 头图):
- 16:9 horizontal aspect ratio.
- Subject occupies the left or center third; substantial negative space on right and top for Chinese-language title overlay.
- Slightly cinematic framing, depth-of-field hint in background.
`.trim();
  }
  // inline
  return `
COMPOSITION (INLINE / 正文中重点插图):
- 4:3 horizontal aspect ratio.
- Subject centered. Less negative space than hero — denser, more contextually descriptive.
- Should read as a "supporting illustration" inside an article, not a cover image.
`.trim();
}

function buildPrompt(args) {
  return [BASE_STYLE, buildSubjectClause(args), buildCompositionClause(args.role)].join("\n\n");
}

async function tryGenerate(ai, modelName, prompt) {
  const start = Date.now();
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData) {
      return {
        buf: Buffer.from(part.inlineData.data, "base64"),
        modelName,
        elapsedMs: Date.now() - start,
      };
    }
  }
  return null;
}

function buildR2Client() {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.ACCESS_KEY;
  const secretAccessKey = process.env.ACCESS_SECRET;
  if (!endpoint) die("S3_ENDPOINT env var missing (load with --env-file=.env)");
  if (!accessKeyId) die("ACCESS_KEY env var missing (load with --env-file=.env)");
  if (!secretAccessKey) die("ACCESS_SECRET env var missing (load with --env-file=.env)");

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function uploadToR2(client, key, buf) {
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buf,
      ContentType: "image/png",
    })
  );
}

async function main() {
  const args = parseArgs(process.argv);
  const apiKey = process.env.VERTEX;
  if (!apiKey) die("VERTEX env var missing (load with --env-file=.env)");

  for (const required of ["slug", "role", "article-type"]) {
    if (!args[required]) die(`missing --${required}`);
  }
  if (!["hero", "inline"].includes(args.role)) die("--role must be hero|inline");
  if (!["policy", "tips", "guide", "news", "holiday"].includes(args["article-type"])) {
    die("--article-type must be one of policy|tips|guide|news|holiday");
  }

  const r2 = buildR2Client();

  const composeArgs = {
    role: args.role,
    articleType: args["article-type"],
    audience: args.audience ?? "mix",
    goal: args.goal ?? "hybrid",
    theme: args.theme ?? null,
    styleExtra: args["style-extra"] ?? null,
  };
  const prompt = buildPrompt(composeArgs);

  const ai = new GoogleGenAI({ vertexai: true, apiKey, apiVersion: "v1" });

  let result = null;
  let lastErr = null;
  for (const m of MODEL_CANDIDATES) {
    try {
      result = await tryGenerate(ai, m, prompt);
      if (result) break;
    } catch (err) {
      lastErr = err?.message?.slice(0, 300) ?? String(err);
    }
  }
  if (!result) die(`all models failed; last error: ${lastErr ?? "no inlineData in response"}`);

  const ts = Date.now();
  const filename = `${args.role}-${ts}.png`;
  const key = `${args.slug}/images/${filename}`;

  try {
    await uploadToR2(r2, key, result.buf);
  } catch (err) {
    die(`r2 upload failed: ${err?.message?.slice(0, 300) ?? String(err)}`);
  }

  const url = `${R2_PUBLIC_BASE}/${key}`;

  console.log(
    JSON.stringify({
      ok: true,
      url,
      key,
      model: result.modelName,
      elapsedMs: result.elapsedMs,
      bytes: result.buf.length,
    })
  );
}

main().catch((e) => die(e?.message ?? String(e)));
