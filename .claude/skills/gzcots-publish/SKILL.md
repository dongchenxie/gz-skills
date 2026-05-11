---
name: gzcots-publish
description: 广建职校公众号推文生成入口。当用户要给广建职校公众号写一篇新推文时使用。先问推文类型，再路由到对应的子 skill。
---

# gzcots-publish

广州市建设职业培训学校（gzcots）公众号推文生成的统一入口。本 skill 本身不直接生成内容，而是**问清类型并路由**到对应的 sub-skill。

## 启动前置检查

1. 读 `.claude/skills/_shared/brand.yaml`。
2. 若 `article_assets.header_image_url` 或 `footer_image_url` 仍为 `TODO`：
   - 先要求用户提供 1 篇历史公众号推文 URL（mp.weixin.qq.com）。
   - 用 Playwright MCP（`mcp__playwright__*` 系列工具）打开该 URL，定位文章首尾 `<img>` 的 `src`（通常是 mmbiz.qpic.cn 域名）。
   - 把抓到的两个 URL 写回 `brand.yaml`，然后再继续。
   - 这一步**必须**在 subagent 里跑（`Agent` tool, `subagent_type: general-purpose`），抓取产生的大量 HTML 不要进主上下文。

## 主流程

向用户问 **1 道选择题**，然后调用对应 sub-skill：

| 选项 | sub-skill |
|---|---|
| 1. 政策解读 + 营销 | `gzcots-policy` |
| 2. 温馨提示 + 营销 | `gzcots-tips` |
| 3. 指引指南 | `gzcots-guide` |
| 4. 学校新闻 | `gzcots-news` |
| 5. 节日放假通知 | `gzcots-holiday` |

使用 `AskUserQuestion` 工具单选询问。用户回答后，**不要自己开始写**，让对应 sub-skill 接管（提示用户输入 `/<sub-skill-name>` 或直接读对应目录的 SKILL.md 执行）。

## 规则

- 这是入口 skill，**不写正文、不渲染 HTML**。
- 不要凭关键词猜类型，必须显式问。一句"年中休假通知"可能是放假通知，也可能是借节日做营销的"温馨提示"，让小编自己定。
- 路由完成后立即退出，不要在主上下文里残留中间产物。
