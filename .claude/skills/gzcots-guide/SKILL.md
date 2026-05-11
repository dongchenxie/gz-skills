---
name: gzcots-guide
description: 广建职校公众号"指引指南"类推文生成。当用户要写个人补贴申报、企业资质申报、学校平台操作等流程指南时使用。信源严格限定在 _shared/sources.yaml 列出的官方网站。
---

# gzcots-guide

**类型**：指引指南（操作类）
**触发感**：建立专业信任（"跟着做就行，无门槛"）

## ⚠️ 必须项（违反任意一条即审核红线）

- **信源白名单**：操作平台 URL、所需材料、入口链接、咨询电话必须来自 `_shared/sources.yaml`（school_internal 域名也算合法）。
- **抓取在 sub-agent 内**：按 `_shared/research-strategy.md` 派 sub-agent，不在主上下文 WebFetch。
- **单源精读 + 上位法校验**：本类用户通常给 1 个具体平台 URL；sub-agent 精读该 URL，但**必须额外**在 sources.yaml 内查同主题上位法（避免指引步骤已被新政策废止）。
- **域名硬条款**：如 Q2 URL 的 host 不在 sources.yaml 内（且不在 school_internal） → sub-agent 立即 abort，把 URL 报回主上下文，**不允许继续抓**。由小编决定是否加白。
- **先问 Q0**：本类默认推 conv（指引类天然带客）。按 `_shared/article-goals.md` 落地文体。

## 启动前置检查

同 `gzcots-publish/SKILL.md`。

## 输入：先 Q0，再 Q1–Q3

**Q0（必须最先问）** 本篇核心目的：
- A. **fan**（增粉，借"小白也能办"做共鸣传播）
- B. **conv**（转化，**默认推荐** —— 指引文天然是流量→咨询的入口）
- C. **hybrid**（混合）

**Q1** 客户画像：
- A. **B 端：建筑施工企业**（资质申报 / 升级 / 延续操作指南）
- B. **C 端：个人**（个人补贴申报 / 报名指引 / 平台操作）
- C. **明 C 暗 B**（个人指引，结尾加企业合作引流）

**Q2** 指引主题 + 操作平台 URL（必填，至少给一个 URL，否则没法拆解步骤）。常见来源：
- 广东政务服务网 https://www.gdzwfw.gov.cn/
- 住建部 / 厅 / 局申报通知页
- 人社局 / 厅申报通知页
- 学校自有平台 https://www.gzcots.com/?c=school&a=introduce&cid=1
（以上均在 `_shared/sources.yaml` 白名单内；其他域名 sub-agent 会拒绝抓取并回报。）

**Q3** 截止时间（如有，决定是否拉紧迫感尾巴）。

## Research（必须 sub-agent）

派 `Agent` 按 `_shared/research-strategy.md` 执行：

1. **域名校验**：先校验 Q2 URL 的 host 在 sources.yaml（含 school_internal）内，不在则 abort 回报。
2. **主源精读**：WebFetch 主 URL。失败 → Playwright MCP fallback（政府站点经常需要等 JS 渲染或携带 cookie）。
3. 提取：操作目的、申报对象、所需材料、操作步骤（按页面逻辑切分）、入口链接、截止日期、咨询电话。
4. **上位法横向校验**：另外在 sources.yaml 的 `national` + `guangdong_province` 内查同主题最新通知，若发现"指引依据的政策已被废止/修订" → 在返回 JSON 的 `warnings` 字段标出，主上下文必须停下来问小编。
5. 只把结构化步骤数组 + warnings 返回主上下文。

## 撰稿规则

文风硬约束（用户原话）："**逻辑通顺、文字简洁、言语易懂、无门槛跟学操作**"。具体落地：

- 每个步骤 1 句话 + 1 个动作 + 1 个截图描述（截图本身阶段 1 不做，只标 `[此处插图：xxx]` 占位）。
- 不用专业术语，要把"申报"翻译成"提交资料"，把"受理"翻译成"工作人员接收"。
- 步骤编号用 ①②③（中文圈号），不要 1. 2. 3.（在微信上对齐难看）。
- 每个步骤之间用 ⑤ 重点卡片块 / ⑥ 列表块 间隔，避免长段。

按 Q0 切换叙事节奏：

- **fan**：开头用"很多人不知道其实可以这样办"，结尾"转发给身边需要的人"，不放二维码。
- **conv**：开头用"满足以下条件可办，我们 X 分钟帮你过一遍"，结尾 ⑦ CTA（二维码+电话+咨询入口）。
- **hybrid**：前段 fan 的故事化叙事 → 后段轻量 CTA。

CTA 切换（按 Q1）：

- **B 端**：结尾推 `qiye_zizhi` 课程，强调"我们代办过 N 家企业资质，10 分钟出方案"。
- **C 端**：结尾推对应课程（补贴 → `jineng_gongren`；个人继教 → `jixu_jiaoyu`；考证 → `jianzaoshi_*`）。
- **明 C 暗 B**：C 端主体 + ⑧ B 端引流块。

## 渲染

按 `_shared/135-editor.md` 骨架，**必带块按 Q0 切换**：

| Q0 | 必带块 |
|---|---|
| fan | ①②④⑥⑦（软）⑨ |
| conv | ①②④⑥⑦⑨；C 端必带 ⑧ |
| hybrid | ①②④⑥⑦（轻量）⑨；C 端必带 ⑧ |

## 审核 / 输出

同 `gzcots-policy` 的审核 + 双产物输出。

**额外审核项**：

- 步骤是否漏环节 —— skill 自己读完输出 HTML，模拟一个"完全没操作过的小白"能不能从头跟到尾。任何"需要先做 X 才能做 Y"但 X 没提到的，标记 ❌。
- sub-agent 返回的 `warnings`（如"指引政策已被废止"）必须在审核报告头部高亮显示。
- Q0 一致性检查（见 `article-goals.md` 审核钩子）。
