# 配图生成规范

所有 **gzcots-\* 生成类 sub-skill** 在 Research 之后、渲染之前必须执行本步骤。
目的：用 `scripts/gen-image.mjs` 自动产出 N 张 **inline 插图**（穿插在正文 ④/⑤ 块之间）的**中国语境**装饰图，
让推文除固定头尾图外还有内容侧装饰。

**重要**：**头图 ① 与尾图 ⑨ 永远使用 `brand.yaml.article_assets.{header_image_url, footer_image_url}`，不替换。**
配图生成只产 inline 图。脚本虽支持 `--role hero`（16:9 封面），但默认 pipeline 不接入文章，仅作脚本能力保留（如未来用于朋友圈封面 / 预览缩略）。

违反本文件硬约束 = 审核红线，阻塞发布。

---

## 1. 工具与基调

- **落地脚本**：`scripts/gen-image.mjs`
- **图床**：Cloudflare R2 bucket `test-china-video`（S3 兼容；credentials 在 `.env`：`ACCESS_KEY` / `ACCESS_SECRET` / `S3_ENDPOINT`）。公网根 `https://pub-e96b09db0cf94150b117f241f58a10f3.r2.dev/`
- **模型**：Vertex Gemini image preview（脚本内置三级回退：`gemini-3.1-flash-image-preview` → `gemini-3-pro-image-preview` → `gemini-2.5-flash-image-preview`）
- **注意 ≠ 同一通道**：配图走 R2（本文规范）；`output/{slug}/article.html`、`audit-report.md` 等**落盘产物**走另一通道——EC2 上的 `gz-static.service` 将 `/home/ubuntu/gz-skills/output/` 整体代理到 `http://ec2-54-196-199-146.compute-1.amazonaws.com/`（详见 `brand.yaml.editor.preview_base_url`），供小编打开 `article.html` 预览。两条通道彼此独立，不要混淆。
- **风格基调（脚本 BASE_STYLE 已锁，不要在 sub-skill 里覆盖）**：
  - 中国大陆语境，编辑插画风（editorial illustration，slightly flat）
  - 主色：工程蓝 `#1a4b8c` + 黄铜金 `#b89b5e` + 暖米白底 `#fafaf7`
  - 政府政策手册的视觉感（authoritative / professional / reassuring），不是广告
  - **中国本地人文特色 = 红线**（详见 §5）

---

## 2. 调用方式（必须在 sub-agent 内）

主上下文 **不直接** Bash 调用 `gen-image.mjs`。派一个 `Agent`（`subagent_type: general-purpose`）执行，原因：
- API 请求往返 10-60 秒，stdout JSON 体积大可控但主上下文不必感知。
- 多张图并发，子 agent 内并发 Bash 比主上下文串行更高效。
- 失败回退、模型重试都是噪声，不应进主上下文。

每张图的 CLI 形态：

```bash
node --env-file=.env scripts/gen-image.mjs \
  --slug {YYYY-MM-DD}-{slug} \
  --role hero|inline \
  --theme "本篇主题，1 句话" \
  --audience B|C|mix \
  --goal fan|conv|hybrid \
  --article-type policy|tips|guide|news|holiday \
  [--style-extra "可选，1 句话场景补充，例如：工地实景，工人挂安全带"]
```

- **R2 key**：`{slug}/images/{role}-{ts}.png`（bucket = `test-china-video`，不再落本地盘）
- **公网 URL**：`https://pub-e96b09db0cf94150b117f241f58a10f3.r2.dev/{slug}/images/{role}-{ts}.png`
- **stdout**：单行 JSON `{ok, url, key, model, elapsedMs, bytes}` 或失败时 `{ok:false, reason}`

主上下文从 sub-agent 只拿 **public URL**，**绝不接 base64**。

---

## 3. 每篇产出量（按 article-type · 仅 inline，hero/footer 不在此列）

| article-type | inline 张数 | inline 主题建议 |
|---|---:|---|
| **policy** | 1–2 | 看政策文件的场景 / 申报窗口期的克制紧迫感 / 持证人在岗场景 |
| **tips** | 1 | 看到期证书/学时台账的提醒场景；避免吓唬人，平静 |
| **guide** | 2–3 | 申报场景 / 在政务系统操作的电脑前 / 拿到证书 |
| **news** | 1 | 半正式合影感 / 活动现场感（不上街、不举手） |
| **holiday** | 0 | 节日通知克制，沿用固定头尾图，不加额外插图 |

> guide 类多一张是有意的：步骤越多，越需要"动作场景"图区隔阅读疲劳。
> 头图 ①、尾图 ⑨ **不**在配图生成范畴内 —— 永远使用 `brand.yaml.article_assets.{header_image_url, footer_image_url}` 固定图，**不调用** gen-image 替换。脚本的 `--role hero` 能力暂仅保留，不接入文章 pipeline。

---

## 4. Sub-agent I/O 契约

**主上下文派 sub-agent 时给的输入**（YAML 思想，最终是自然语言 prompt）：

```yaml
slug: "{YYYY-MM-DD}-{slug}"
article_type: policy|tips|guide|news|holiday
audience: B|C|mix
goal: fan|conv|hybrid
theme: "本篇主题，1 句话"
inline_images:
  - style_extra: "（可选，1 句话场景补充）"
  - style_extra: "（可选）"
```

**sub-agent 必须并发跑这些 gen-image 命令**（不要串行；每张图 10-60s），全部以 `--role inline` 调用，收集每张图的 JSON 结果。

**sub-agent 返回主上下文的 JSON**：

```json
{
  "inline_urls": [
    "https://pub-e96b09db0cf94150b117f241f58a10f3.r2.dev/{slug}/images/inline-1714200000111.png",
    "https://pub-e96b09db0cf94150b117f241f58a10f3.r2.dev/{slug}/images/inline-1714200000222.png"
  ],
  "failures": [
    { "index": 1, "reason": "all models failed; last error: ..." }
  ],
  "elapsed_ms_total": 32145,
  "models_used": { "inline_0": "gemini-3.1-flash-image-preview", "inline_1": "gemini-3-pro-image-preview" }
}
```

主上下文拿到 URL 后**在渲染 article.html 时**：

- ① 头图位 → **永远** 用 `brand.yaml.article_assets.header_image_url`（**不替换**）
- ⑨ 尾图位 → **永远** 用 `brand.yaml.article_assets.footer_image_url`（**不替换**）
- inline 图按推荐张数穿插在 ④/⑤ 块之间，统一样式：
  ```html
  <section style="margin:14px 16px;padding:0;text-align:center;">
    <img src="{INLINE_URL}" style="width:100%;height:auto;display:block;border:0;border-radius:4px;" />
  </section>
  ```

---

## 5. 红线：中国本地人文特色

`gen-image.mjs` 的 `BASE_STYLE` 已锁住以下硬约束。任何修改脚本都**必须**保留这些；任何 `--style-extra` 都**不允许**绕过：

| 必须 | 禁止 |
|---|---|
| 所有人物为**东亚 / 汉族**外貌 | 西方人脸 / 黑人 / 其他种族在画面前景 |
| 现代中国 / 中式建筑（modernist Chinese civic / urban） | 西方柱式 / 欧洲大教堂 / 美式连排 / 罗马拱顶 |
| 政府政策手册视觉感（克制、专业、令人信任） | 卡通 / 动漫 / 3D 玩偶 / chibi / 霓虹 / 过饱和 |
| 编辑插画（editorial illustration） | 任何**文字 / 字母 / 数字** 出现在图内（标题由 135 编辑器叠加） |
| 工程蓝 + 黄铜金 + 暖米白底为主色 | 鲜艳红 / 紫 / 萤光色 / 渐变彩虹 |
| 无招牌的中性建筑背景 | **中国国旗、党徽、特定政府徽标**（学校不是国家媒体） |

> 一旦审核发现图内出现以上"禁止"项 → audit ❌ 红线，重新生成。

---

## 6. 失败处理

| 情况 | 处理 |
|---|---|
| 单张 inline 失败 | fallback：跳过该位，正文之间空隙保持原样。audit-report 标 ⚠️ 但**不阻塞**发布 |
| 全部 inline 失败 | audit-report 标 ⚠️（不算红线，因为有固定头尾图保底），让小编决定是否重跑 |
| `.env` VERTEX / R2 凭证（`ACCESS_KEY` / `ACCESS_SECRET` / `S3_ENDPOINT`）缺失 | sub-agent 立即 abort 并报错；主上下文跳过所有 inline 图，audit 标 ⚠️ |
| R2 上传失败 | stdout 返回 `{ok:false, reason:"r2 upload failed: ..."}`，本张图片无 URL → audit ❌，必须核查 R2 凭证 / bucket `test-china-video` 权限后重跑 |

---

## 7. 审核钩子（供 audit-checklist 引用）

每篇推文输出时，审核报告必须额外检查（详见 `_shared/audit-checklist.md` 第 6 维）：

- 本篇 `article_type` 推荐的 **inline 张数**是否达成（hero/footer 不在配图生成范围内，沿用 brand.yaml 固定图）
- 生成的图 URL 是否全部以 `https://pub-e96b09db0cf94150b117f241f58a10f3.r2.dev/{slug}/images/` 开头
- ① 头图、⑨ 尾图是否仍为 brand.yaml 固定图（若被替换为 gen-image 产物 → 红线）
- 图片是否存在文字/字母/数字（人工目视）
- 图片是否符合中国语境基调（人物、建筑、配色、克制感）
- 是否有失败项需要小编重跑或确认
