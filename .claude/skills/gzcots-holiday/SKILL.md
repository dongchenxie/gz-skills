---
name: gzcots-holiday
description: 广建职校公众号节日放假通知推文生成。当用户要发节日放假通知（春节/国庆/中秋/元旦/端午/清明/劳动节/双节）时使用。贺词中引用的五年规划/行业政策/部委发文信源严格限定在 _shared/sources.yaml 列出的官方网站。
---

# gzcots-holiday

**类型**：节日放假通知
**触发感**：维系关系存在感
**自动化程度**：**高**（版式固定、字段少；但贺词需要结合当年形势手工润色）

## ⚠️ 必须项（违反任意一条即审核红线）

- **信源白名单**：贺词中若引用**五年规划阶段、当年行业政策、部委发文、具体文号**，信源必须来自 `_shared/sources.yaml`；不能"凭印象"写"住建部最近强调 X" —— 要么有官网原文，要么改为含糊表述。
- **抓取在 sub-agent 内**：如需核对"当年是什么五年规划阶段""住建部近期发文方向"，派 sub-agent 在 sources.yaml 的 `national` 层抓"通知公告"栏目摘要。
- **先问 Q0**：本类 Q0 替代了原 Q4 营销小尾巴选项，按 `_shared/article-goals.md` 末段 holiday 表落地文体。
- **不生成 inline 配图**：节日通知文体克制，沿用固定头尾图即可，**不调用 `scripts/gen-image.mjs`**。`_shared/image-generation.md` §3 已锁 holiday 类 inline 张数 = 0。

## 启动前置检查

同 `gzcots-publish/SKILL.md`。

## 输入：先 Q0，再 Q1–Q3

**Q0（必须最先问）** 本篇核心目的：
- A. **pure_notice**（纯通知，**默认推荐** —— 最干净版本）
- B. **fan_flavored**（节日借势增粉 —— 贺词更有故事感，鼓励转发）
- C. **conv_flavored**（含营销小尾巴 —— 落款后独立 ⑦ 块）

**Q1** 节日名称（春节 / 元旦 / 清明 / 劳动节 / 端午 / 中秋 / 国庆 / 教师节 / 双节 / 其他）。

**Q2** 放假起止日期（如 `2026-10-01` 至 `2026-10-07`）。

**Q3** 上班 / 复课日期。

如 Q0 = conv_flavored，再追问 Q3.5：营销小尾巴面向 **B 端** 还是 **C 端**。
值班联系方式默认使用 `_shared/brand.yaml` 的 `school.hotline`。

## Research（条件触发）

无主动抓取。但**贺词撰写前**应核对：
- 当年所属五年规划阶段（如 2026 = 十五五开局之年）；
- 当下建造业 1–2 个热议议程（智能建造 / 绿色低碳 / 新型工业化 / 装配式 / 双碳 / 老旧小区改造）；
- 近期住建部 / 人社部发文方向。

如不确定，**派 sub-agent**（按 `_shared/research-strategy.md`）在 sources.yaml 的 `national` 层抓 mohurd / mohrss 的"通知公告"栏目首屏，提取近期 3–5 条发文标题作为贺词的"当年形势"素材。**不允许在主上下文猜测当年发文方向。**

## 撰稿规则

- **标题格式**："关于 XXX 放假安排的通知" 或 "XXXX 放假通知"，存档全称用 `brand.yaml.holiday.title_template`。
  - 推文标题层可拆成 **eyebrow ribbon**（年份 + 节日全称）+ **主标题**（如 "放 假 通 知"，字距拉开）—— 见 `_shared/135-editor.md` 的 ⓐ 块。
- **全文不少于 `brand.yaml.holiday.min_length`（默认 200 汉字）**。整篇过短显得敷衍 —— 节日通知是维系关系的场景，而不是简讯。
- **贺词必须结合当年形势**（见 `brand.yaml.holiday.blessing_rule`）：
  - ① 年份所属五年规划阶段；
  - ② 建造业当下议程；
  - ③ 或近期行业重大政策。
  - 禁止空泛的"放假快乐 + 注意安全"。
  - 引用的政策方向、规划名称必须来自 sub-agent 抓取的官网摘要，不可凭印象。
- 致敬建设者的句子要**具体到岗位**（"建筑工地 / 设计院 / 项目部一线 / 安全员 / 特种作业人员"），而不是抽象的"全体劳动者"。

按 Q0 切换：

- **pure_notice**：贺词正式克制，无 CTA，无营销尾巴。
- **fan_flavored**：贺词可更具故事性（"今年是十五五开局之年，建筑行业每一位 XXX……"），落款前加一句"转发给身边的建设者"，仍不放二维码。
- **conv_flavored**：在落款后**独立成段**加 ⑦ CTA 块，按 Q3.5 走 `audience_design.{b_end\|c_end}.cta_tone`。**视觉上仍按 b_end 渲染**（即便 CTA 是 C 端口径），因为节日不是带货场景。

## 渲染

按 `_shared/135-editor.md` 骨架渲染。**节日通知一律走 B 端克制版**（即便受众是 C 端 —— 节日不是带货场景，带货语只在末尾独立 CTA 块里出现）。由 `brand.yaml.holiday.designer_mode = b_end` 锁定。

渲染顺序：
① 头图 → ⓐ Eyebrow ribbon → ② 主标题（字距 letter-spacing 拉开）→ ⓑ 装饰分割线 → 贺词正文（3 段以上，首行缩进 2em，行高 1.85）→ ⓒ Refined date card → 值班 / 安全提示 → 落款（右对齐，含具体日期）→ ⓑ 装饰分割线 → **仅 Q0=conv_flavored 时**加 ⑦ CTA（B 端克制视觉 + Q3.5 对应口径）→ ⑨ 尾图。

## 审核 / 输出

跑维度 1（错字）+ 维度 2（排版），并额外检查：

- **Q0 一致性**：pure_notice 不应出现"咨询/扫码"；fan_flavored 不应出现二维码；conv_flavored 必须有独立 ⑦ 块。
- **全文汉字数 ≥ `holiday.min_length`**；不足则报 ⚠️。
- **贺词是否引用了当年形势**（关键词命中：五年规划名称 / 智能建造 / 绿色低碳 / 新型工业化 / 装配式 / 双碳 / 当年具体政策文号或部委发文）；未命中则报 ⚠️。
- **若贺词引用了具体政策文号或部委发文**：sub-agent 是否已在 sources.yaml 内核对过？未核对的视为红线，必须替换为含糊表述或停下来由小编核对。
- **日期格式是否与 `holiday.date_format` 一致**。
- **配图维度**：本类不生成 inline 图，audit 第 6 维默认通过；但需检查 ① 头图、⑨ 尾图是否仍为 brand.yaml 固定 URL（被替换 = 红线）。

输出双产物（与其他 sub-skill 一致），落盘位置按 `brand.yaml.editor.output_dir`：
- `article.html` — 仅 `<section>` 片段，粘进 135 编辑器用；
- `preview.html` — 完整 HTML，模拟 420px 微信视口，浏览器直接打开预览；
- `audit-report.md` — 审核表 + 必须人工二次确认清单。
