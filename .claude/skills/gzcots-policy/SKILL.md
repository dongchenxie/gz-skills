---
name: gzcots-policy
description: 广建职校公众号"政策解读+营销"类推文生成。当用户要把一份建筑/人社新政策写成公众号推文并接入学校课程营销时使用。信源严格限定在 _shared/sources.yaml 列出的官方网站。
---

# gzcots-policy

**类型**：政策解读 + 营销
**触发感**：制造紧迫感（"政策窗口期"、"最高补贴"、"错过等一年"）

## ⚠️ 必须项（违反任意一条即审核红线）

- **信源白名单**：所有引用的 URL、条款、数字、日期、机构名必须出自 `_shared/sources.yaml`。
- **抓取在 sub-agent 内**：主上下文不直接 WebFetch，按 `_shared/research-strategy.md` 执行。
- **三层并发**：本类推文默认执行 国家部 + 广东省厅 + 受众市局 的三层并发抓取，sub-agent 打分挑 top 1-3 回主上下文。
- **先问 Q0 再问 Q1–Q4**：本篇目的决定全文文体，按 `_shared/article-goals.md` 落地。
- **配图（inline）必须自动生成**：Research 后、渲染前派 sub-agent 调 `scripts/gen-image.mjs --role inline`，产出 1–2 张装饰图穿插正文。头图 ①、尾图 ⑨ **不替换**，仍走 brand.yaml。详见 `_shared/image-generation.md`。基调锁中国语境（东亚人脸 / 中式建筑 / 政府政策手册视觉）。

## 启动前置检查

调用前先按 `gzcots-publish/SKILL.md` 的"启动前置检查"确认 brand.yaml 头尾图已就绪。

## 输入：先 Q0，再 Q1–Q4

**Q0（必须最先问 —— 决定全文文体）** 本篇核心目的：
- A. **fan**（增粉 / 曝光 / 分享）—— 政策大事件借势，强情绪共鸣
- B. **conv**（转化 / 咨询 / 报名）—— 招生季、补贴窗口、报名截止前
- C. **hybrid**（混合，默认推荐）—— 前段增粉，后段轻量转化

→ 选好后按 `_shared/article-goals.md` 锁定文体规范。

**Q1（决定话术对谁说）** 客户画像：
- A. **B 端：建筑施工企业**（主推：资质升级 / 批量培训 / 合规风险）
- B. **C 端：个人持证人员**（继教 / 学时 / 不被吊销）
- C. **C 端：考证求职者**（一/二建 / 求职 / 晋升）
- D. **C 端：蓝领工人**（技能证 / 补贴）
- E. **明 C 暗 B**：主线写给个人看，结尾强引流 B 端合作

**Q2** 政策原文 URL（可选）。如果用户只给标题没有 URL，让 sub-agent 在 `_shared/sources.yaml` 列出的官方源里检索匹配项。

**Q3** 关联推销的课程（多选，从 `_shared/courses.yaml` 的 categories 列表选）。

**Q4** 受众市域（决定第三层并发抓哪个市局）：广州 / 江门 / 云浮 / 多地。

## Research（必须 sub-agent + 三层并发）

派一个 `Agent` (`subagent_type: general-purpose`)，按 `_shared/research-strategy.md` 的契约执行：

- **输入**：`{ topic, audience: Q1, goal: Q0, primary_url: Q2 or null, regions: Q4 }`
- **执行**：
  1. 在 sources.yaml 的 `national` + `guangdong_province` + 选中市级层 并发抓相关页（栏目入口走 `category_path` 字段，空则爬首页一层）。
  2. WebFetch 失败 → Playwright MCP fallback。
  3. 每篇候选按价值评分维度（权威级别、时效、政策刚性、受众相关性、可量化条款数量）打分。
  4. **域名白名单校验**：每个 URL 的 host 必须在 sources.yaml 内，否则丢入 `rejected` 字段。
- **输出**：只回结构化 JSON（primary / supporting / rejected / background_only_external），**不回 HTML**。

主上下文拿到 JSON 后才开始撰稿。

## 配图生成（Research 后、渲染前 · 必须 sub-agent · 仅 inline）

按 `_shared/image-generation.md` 契约派一个 `Agent`（`subagent_type: general-purpose`）并发调 `scripts/gen-image.mjs --role inline`。本类配额：

- **inline × 1–2**：`--article-type policy --audience {Q1 映射 B/C/mix} --goal {Q0} --theme "{1 句话主题}"`
- `--style-extra` 按主题贴具体场景，例如"持证人在工位上看政策文件" / "申报截止日倒计时桌历" / "审图员在办公桌前核对资料"。

**头图 ① 与尾图 ⑨ 不替换，仍走 `brand.yaml.article_assets`**。sub-agent 只返回 `inline_urls[]`，按 ⑩ 块样式穿插在 ④/⑤ 块之间。失败的位跳过，不阻塞，但在 audit 标 ⚠️。

## 撰稿规则（Q0 × Q1 二维分流）

按 `_shared/article-goals.md` 的二维交叉表落笔：

- **fan × B**：行业洞察口吻；标题用"行业级反差"；结尾鼓励同业转发；不放二维码。
- **fan × C**：个人收益口吻；标题用"个人级反差/数字"；结尾"转发给身边考证朋友"；不放二维码。
- **conv × B**：沉稳商务；强调资质门槛/合规风险/批量培训；CTA tone = `brand.yaml.audience_design.b_end.cta_tone`（"商务专线"，不喊"立即抢报"）。
- **conv × C**：醒目直白；强调政策红利+窗口期+流程；CTA tone = `audience_design.c_end.cta_tone`；二维码醒目。
- **hybrid**：前 70% 走对应画像的 fan 文体，后 30% 接一个过渡句 + 轻量硬 CTA（小二维码 + 1 句话课程钩子）。
- **明 C 暗 B**：主线 C 端文体，结尾必带 ⑧ B 端引流块。

通用约束：

- "从学员角度出发"先讲利益、再讲流程、最后才是课程。
- 政策原文条款用 ⑤ 重点卡片块呈现，避免大段引用让读者跳过。
- 关键日期、金额必须与 sub-agent 返回 JSON 的 `key_numbers` 字段一致。**任何虚构数字 = 红线**。
- 若 sub-agent 返回 `supporting` 中含省厅/市局补充条款，必须以 ⑤ 重点卡片附上"广东本地实施细则"或"广州本地申报入口"段。

## 渲染

按 `_shared/135-editor.md` 的通用骨架渲染 HTML。**必带块按 Q0 切换**：

| Q0 | 必带块 |
|---|---|
| fan | ①②③④⑤⑥⑨（无二维码 CTA） |
| conv | ①②④⑤⑥⑦⑨；C 端额外必带 ⑧ |
| hybrid | ①②③④⑤⑥⑦（轻量）⑨；C 端必带 ⑧ |

## 审核

按 `_shared/audit-checklist.md` 跑 6 维自动审核（含配图维度），**额外**检查：

- Q0 是否在 audit-report 头部明确记录。
- 当前推文的 CTA tone / 必带块 / 二维码处理是否与 Q0 对应规范一致（详见 `article-goals.md` 末尾"审核钩子"）。
- sub-agent 返回 JSON 的 `rejected` 字段如果有"域名白名单不符"被拦截的 URL，必须在审核报告里列出（供小编评估是否需要把新域名加白到 sources.yaml）。
- 配图（inline）张数是否在 1–2 之间；① 头图、⑨ 尾图是否仍为 brand.yaml 固定图（被替换 = 红线）；inline 图是否需人工目视确认中国语境基调（详见 `_shared/image-generation.md` §5 + audit-checklist 第 6 维）。

## 最终输出

向用户返回**两份**产物，落盘位置按 `brand.yaml.editor.output_dir`：

```
=== article.html ===
<完整 HTML，可直接粘到 135 编辑器>

=== audit-report.md ===
<5 维审核表 + Q0 一致性检查 + 必须人工二次确认清单>
```

**不要替用户点"发布"**。skill 在审核报告输出后即停止。
