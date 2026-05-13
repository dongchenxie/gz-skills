# 135 编辑器 / 微信公众号 HTML 输出规范

最终 HTML 会先粘到 135 编辑器（https://www.135editor.com/），再由 135 同步到微信公众号原生编辑器。
**所有 sub-skill 输出 HTML 必须遵守以下硬约束**，否则粘进去样式会丢。

## 硬约束

1. **全部内联样式**。`<style>`、`<link>`、外部 CSS 一律禁止。
2. **结构以 `<section>` 嵌套为主**。每个"内容块"是一个 `<section>`，不要用 `<div>`（微信会过滤一些 `<div>` 样式）。
3. **禁止 `<script>` / `<iframe>` / `<form>` / `<input>`**。微信和 135 都会过滤掉。
4. **不要用 `class`、`id`**。粘到 135 后会被剥掉，规则不生效。
5. **图片只用 `<img src="...">`，src 必须是公网可访问的 URL**。
   - **头图 ①**：**永远**使用 `_shared/brand.yaml` 里 `article_assets.header_image_url`，**不替换**。
   - **尾图 ⑨**：**永远**使用 `brand.yaml` 里 `article_assets.footer_image_url`，**不替换**。
   - **inline 插图 ⑩**：由 `scripts/gen-image.mjs`（`--role inline`）按 article-type 推荐张数产出（policy 1–2 张 / tips 1 张 / guide 2–3 张 / news 1 张 / holiday 0 张），穿插在 ④/⑤ 块之间。详见 `_shared/image-generation.md`。
   - 所有图均无需手工上传 —— 微信公众号渲染时会自动代理外链图片。
6. **字号最小 14px，正文 16px**。手机端可读。
7. **不写 emoji**（除非用户在该篇推文明确要求）。
8. **链接尽量少**。微信公众号正文不允许任意外链；如必须，使用"长按识别"或文字提示，不要直接 `<a href>` 外部链接（会被屏蔽）。
9. **行高 1.75**，段间距 14px。
10. **最大宽度自适应**，所有外层 `<section>` 用 `width: 100%; box-sizing: border-box;`。

## 通用骨架（伪代码示意）

```html
<section style="margin:0;padding:0;font-family:'Microsoft YaHei','PingFang SC',sans-serif;line-height:1.75;font-size:16px;color:#333;">

  <!-- ① 头部固定图 -->
  <section style="margin:0;padding:0;text-align:center;">
    <img src="{{HEADER_IMG}}" style="width:100%;height:auto;display:block;border:0;" />
  </section>

  <!-- ② 主标题 -->
  <section style="padding:24px 16px 12px;">
    <h1 style="font-size:22px;font-weight:bold;color:#1a4b8c;text-align:center;margin:0;line-height:1.4;">{{TITLE}}</h1>
  </section>

  <!-- ③ 导语（可选） -->
  <section style="padding:0 16px 16px;">
    <p style="font-size:14px;color:#888;text-align:center;margin:0;">{{LEAD}}</p>
  </section>

  <!-- ④ 正文段落（重复 N 次） -->
  <section style="padding:0 16px;">
    <p style="margin:0 0 14px;">{{PARAGRAPH}}</p>
  </section>

  <!-- ⑤ 重点卡片 -->
  <section style="margin:16px;padding:16px;background-color:#f5f9ff;border-left:4px solid #1a4b8c;">
    <p style="margin:0;font-weight:bold;color:#1a4b8c;">{{HIGHLIGHT}}</p>
  </section>

  <!-- ⑥ 列表 -->
  <section style="padding:0 16px;">
    <p style="margin:0 0 8px;font-weight:bold;">{{LIST_TITLE}}</p>
    <p style="margin:0 0 6px;">①&nbsp;{{ITEM_1}}</p>
    <p style="margin:0 0 6px;">②&nbsp;{{ITEM_2}}</p>
    <p style="margin:0 0 6px;">③&nbsp;{{ITEM_3}}</p>
  </section>

  <!-- ⑦ CTA -->
  <section style="padding:24px 16px;text-align:center;">
    <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#d9534f;">{{CTA_TITLE}}</p>
    <p style="margin:0;color:#666;font-size:14px;">{{CTA_SUBTITLE}}</p>
    <p style="margin:12px 0 0;font-size:16px;font-weight:bold;color:#1a4b8c;">咨询热线 4000-323-118</p>
  </section>

  <!-- ⑧ B 端引流（C 端推文必带） -->
  <section style="margin:16px;padding:12px 16px;background-color:#fff8e1;border:1px dashed #e0a800;">
    <p style="margin:0;font-size:14px;color:#7a5d00;text-align:center;">贵司有批量培训 / 资质升级需求？4000-323-118 转商务，10 分钟出方案</p>
  </section>

  <!-- ⑩ inline 插图（穿插在 ④/⑤ 块之间，按 article-type 配额，详见 _shared/image-generation.md） -->
  <section style="margin:14px 16px;padding:0;text-align:center;">
    <img src="{{INLINE_IMG_URL}}" style="width:100%;height:auto;display:block;border:0;border-radius:4px;" />
  </section>

  <!-- ⑨ 尾部固定图（永远使用 brand.yaml.article_assets.footer_image_url，不替换） -->
  <section style="margin:0;padding:0;text-align:center;">
    <img src="{{FOOTER_IMG}}" style="width:100%;height:auto;display:block;border:0;" />
  </section>

</section>
```

## 不同推文类型用哪些块

| 推文类型 | 必带块 | 可选块 | inline 插图 ⑩ 张数 |
|---|---|---|---|
| 政策解读+营销 | ①②③④⑤⑥⑦⑨ | ⑧(C 端时必带) | 1–2 |
| 温馨提示+营销 | ①②④⑤⑦⑨ | ③⑥⑧ | 1 |
| 指引指南 | ①②④⑥⑦⑨ | ③⑤⑧ | 2–3 |
| 学校新闻 | ①②③④⑨ | ⑤⑥⑦ | 1 |
| 节日放假通知 | ①ⓐ②ⓑ④ⓒ⑨ | ⑦（B/C 端 CTA，二选一） | 0 |

> ⑩ inline 插图的具体生成 / 落位 / 失败处理见 `_shared/image-generation.md`。

## 装饰块（高精细度排版 / 节日通知必用）

ⓐ **Eyebrow ribbon**（标题之上的小标签，把"年份 + 节日全称"剥离出来，让主标题更干净）

```html
<section style="padding:28px 16px 0;text-align:center;">
  <span style="display:inline-block;padding:5px 18px;font-size:12px;letter-spacing:6px;color:#b89b5e;border:1px solid #b89b5e;background:#fafaf7;">2026 · 五一国际劳动节</span>
</section>
```

ⓑ **Ornamental divider**（细线 + 中心点装饰，区隔段落，文人感）

```html
<section style="padding:4px 0 18px;text-align:center;">
  <span style="display:inline-block;width:28px;height:1px;background:#b89b5e;vertical-align:middle;"></span>
  <span style="display:inline-block;margin:0 10px;color:#b89b5e;font-size:11px;vertical-align:middle;letter-spacing:4px;">◆</span>
  <span style="display:inline-block;width:28px;height:1px;background:#b89b5e;vertical-align:middle;"></span>
</section>
```

ⓒ **Refined date card**（替代 ⑤ 普通卡片，专用于"放假日期 / 截止日期"这类关键时间点）

```html
<section style="margin:18px 22px;padding:22px 16px;background:#fafaf7;border:1px solid #d9d2c5;text-align:center;">
  <p style="margin:0;font-size:12px;color:#888;letter-spacing:6px;">放 假 安 排</p>
  <p style="margin:10px 0 0;font-size:22px;font-weight:bold;color:#1a4b8c;letter-spacing:2px;">5月1日 — 5月5日</p>
  <p style="margin:8px 0 0;font-size:14px;color:#666;">共 5 天 &nbsp;｜&nbsp; 5月6日（周三）正常上班</p>
</section>
```

## 设计精细度按受众切换

读 `brand.yaml` 的 `audience_design`：

| 维度 | B 端（企业决策者） | C 端（个人学员） |
|---|---|---|
| 主色 | 工程蓝 #1a4b8c + 黄铜金 #b89b5e | 工程蓝 #1a4b8c + 紧迫感红 #d9534f |
| 卡片底 | #fafaf7 暖米白 + #d9d2c5 描边 | #fff8e1 暖黄 + #f0d090 描边 |
| 装饰密度 | low — 细线、小符号 ◆、单色描边 | medium — 色块、对比卡片、引导箭头 |
| CTA 语气 | "欢迎对接""商务专线" | "立即咨询""名额有限" |
| 字号节奏 | 主标题 22–24px，副信息 13–14px | 主标题 22–26px，号召语 18–20px |
| 行高 | 1.85（更舒展） | 1.75 |

**节日类推文一律走 B 端克制版**（即便受众是 C 端 —— 节日不是带货场景；带货语只在末尾独立 CTA 块出现）。这条由 `brand.yaml.holiday.designer_mode = b_end` 锁定。
