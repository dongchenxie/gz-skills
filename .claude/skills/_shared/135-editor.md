# 135 编辑器 / 微信公众号 HTML 输出规范

最终 HTML 会先粘到 135 编辑器（https://www.135editor.com/），再由 135 同步到微信公众号原生编辑器。
**所有 sub-skill 输出 HTML 必须遵守以下硬约束**，否则粘进去样式会丢。

## 硬约束

1. **全部内联样式**。`<style>`、`<link>`、外部 CSS 一律禁止。
2. **结构以 `<section>` 嵌套为主**。每个"内容块"是一个 `<section>`，不要用 `<div>`（微信会过滤一些 `<div>` 样式）。
3. **禁止 `<script>` / `<iframe>` / `<form>` / `<input>`**。微信和 135 都会过滤掉。
4. **不要用 `class`、`id`**。粘到 135 后会被剥掉，规则不生效。
5. **图片只用 `<img src="...">`，src 必须是公网可访问的 URL**。
   - 头尾固定图：使用 `_shared/brand.yaml` 里 `article_assets.header_image_url` / `footer_image_url`（mmbiz.qpic.cn 域名）。
   - 这两张图直接以 URL 引用，无需上传 —— 微信公众号渲染时会自动代理 mmbiz.qpic.cn 图片。
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

  <!-- ⑨ 尾部固定图 -->
  <section style="margin:0;padding:0;text-align:center;">
    <img src="{{FOOTER_IMG}}" style="width:100%;height:auto;display:block;border:0;" />
  </section>

</section>
```

## 不同推文类型用哪些块

| 推文类型 | 必带块 | 可选块 |
|---|---|---|
| 政策解读+营销 | ①②③④⑤⑥⑦⑨ | ⑧(C 端时必带) |
| 温馨提示+营销 | ①②④⑤⑦⑨ | ③⑥⑧ |
| 指引指南 | ①②④⑥⑦⑨ | ③⑤⑧ |
| 学校新闻 | ①②③④⑨ | ⑤⑥⑦ |
| 节日放假通知 | ①②④⑨ | ⑦ |
