# gz-skills

个人 / 客户 AI 自动化 skill 仓库，通过 Git 管理，配合 [Claude Code](https://claude.com/claude-code) 使用。

## 结构

```
.claude/skills/
├── _shared/                    # 共享资源（被各 skill 在运行时读取）
│   ├── brand.yaml              # 品牌信息 / 头尾固定图 URL / 视觉规范
│   ├── courses.yaml            # 课程话术弹药库（B 端 / C 端分开）
│   ├── sources.yaml            # 政策官网白名单
│   ├── 135-editor.md           # 135 编辑器 HTML 输出硬约束
│   ├── audit-checklist.md      # 5 维审核清单
│   └── templates/              # （阶段 2 加入）HTML 模板片段
│
├── gzcots-publish/             # 入口 skill：选类型 → 路由
├── gzcots-policy/              # 政策解读 + 营销
├── gzcots-tips/                # 温馨提示 + 营销
├── gzcots-guide/               # 指引指南
├── gzcots-news/                # 学校新闻（半自动，留位给老板）
├── gzcots-holiday/             # 节日放假通知
│
├── commit-msg/                 # 通用：写 commit message
└── daily-standup/              # 通用：从 git 活动生成 standup
```

## gzcots 系列：客户广建职校公众号推文生成

**业务背景**：
广州市建设职业培训学校（gzcots，建校 1988，广州市教育局直属）需要每周产出多篇公众号推文，分 5 类：政策解读+营销 / 温馨提示+营销 / 指引指南 / 学校新闻 / 节日放假通知。
**主打 B 端客户**（建筑施工企业，单价高），C 端推文末尾必带 B 端引流 CTA。

**使用流程**：
1. 小编输入 `/gzcots-publish`，回答 1 道选择题（推文类型）。
2. 路由到对应的 sub-skill，sub-skill 先问"客户画像"（B 端 / C 端 / 混合），再问 2–5 道结构化问题。
3. Skill 派 subagent 用 Playwright MCP 抓取政策原文（自动避免污染主上下文）。
4. 按 `_shared/courses.yaml` 拉对应话术，按 `_shared/135-editor.md` 渲染 HTML。
5. 自动跑 5 维审核（错字 / 排版 / 字句 / 政策匹配度 / 政策理解度）。
6. 输出 `article.html` + `audit-report.md` 两份产物。**最后人工审一遍再粘到 135 编辑器**。

**首次安装必做**：
1. 安装 Playwright MCP（推荐 `@playwright/mcp`）—— 政府政策站点直连经常失败，必须有浏览器自动化兜底。
2. 用一篇历史公众号推文 URL 初始化 `_shared/brand.yaml` 的 `header_image_url` / `footer_image_url`（这两张图直接以微信 CDN URL 引用，不需要重新上传）。
3. 校对 `_shared/courses.yaml`（课程话术）和 `_shared/brand.yaml`（品牌色）。

## 通用 skill

| 名字 | 作用 |
|---|---|
| `commit-msg` | 根据 staged changes 生成 commit message 草稿 |
| `daily-standup` | 从近期 git 活动生成 standup 汇报 |

## 新增一个 skill

1. 在 `.claude/skills/` 下创建新目录，名字即 skill 名。
2. 在目录里放 `SKILL.md`，顶部 YAML frontmatter 需含 `name` 和 `description`。
3. 在 `README.md` 的列表里补一行。
4. commit + push。
