# gz-skills

个人 AI 自动化 skill 仓库，通过 Git 管理，配合 [Claude Code](https://claude.com/claude-code) 使用。

## 结构

```
.claude/
  skills/
    <skill-name>/
      SKILL.md       # YAML frontmatter (name + description) + 正文说明
    ...
  settings.local.json
```

每个 skill 是一个独立目录，里面的 `SKILL.md` 顶部需要包含 frontmatter：

```yaml
---
name: skill-name
description: 一行话说明什么时候应该触发这个 skill
---
```

## 当前 skills

| 名字 | 作用 |
|---|---|
| `commit-msg` | 根据 staged changes 生成 commit message 草稿 |
| `daily-standup` | 从近期 git 活动生成 standup 汇报（昨天/今天/Blocker） |

## 如何使用

把这个仓库 clone 到本地任意目录，里面的 `.claude/skills/` 会被 Claude Code 自动识别。在 Claude Code 里输入 `/<skill-name>` 即可调用。

## 新增一个 skill

1. 在 `.claude/skills/` 下创建新目录，名字即 skill 名。
2. 在目录里放 `SKILL.md`，写好 frontmatter 和正文。
3. 在 `README.md` 的列表里补一行。
4. commit + push。
