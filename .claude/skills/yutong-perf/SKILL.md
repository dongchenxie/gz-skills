---
name: yutong-perf
description: 月度技术绩效考核。基于云效（Yunxiao）MCP 的代码 + 项目数据，为广东禹通互联网科技有限公司（协会管理 / 培训平台 / 商城多业务线）员工生成 5 维度量化考核报告。使用场景：HR 月底要考核材料、leader 复盘团队表现、个人查看自己分数。
---

# yutong-perf

为广东禹通生成月度技术绩效考核报告。所有数据通过云效 MCP 拉取，无需员工手工填表。

## 公司画像

- 业务：协会管理系统 / 培训选课平台 / 直播 / 商城（B 端为主，多业务线）
- 团队：5+ 人，前端 / 后端 / 全栈混合
- 云效组织 ID：`69fd28e2405bafb07e12ed36`
- 老板账号：`yutong2025`（`69fd25e9a407dfca29f835ff`）

## 5 维度考核模型

| # | 维度 | 权重 | 数据源 | 自动程度 |
|---|------|------|--------|----------|
| 1 | 代码交付 | 25% | `list_commits` | 全自动 |
| 2 | 代码质量与评审 | 20% | `list_change_requests` + comments | 全自动 |
| 3 | 任务交付 | 20% | `search_workitems` + activities | 半自动（需补工作项） |
| 4 | 业务影响力 | 20% | 工作项 priority + 项目关联 | 半自动 |
| 5 | 协作与可靠 | 15% | CR 评审时长 + 故障工作项 | 大部分自动 |

### 维度 1：代码交付（25%）

**指标**：
- 周期内 commit 数（按 `authorEmail` 或 `committerEmail` 聚合）
- 活跃天数（按 `committedDate` 去重天数）
- 提交信息规范度（是否含 `feat/fix/refactor/docs/chore/test` 前缀）

**打分公式**（0-100）：
```
score = min(100, commit_count * 3 + active_days * 8 + convention_rate * 20)
```
其中 `convention_rate` = 含规范前缀的 commit / 总 commit。

**评语模板**：
- ≥ 80：`交付节奏稳定，信息规范`
- 50-79：`交付正常，可加强节奏`
- < 50：`交付偏少，需关注`

### 维度 2：代码质量与评审（20%）

**指标**：
- 周期内作为 author 的 CR 数
- 一次通过率：未触发再次修改直接合并的占比（看 `totalCommentCount`、`unResolvedCommentCount`、评审次数）
- 自评审率：作者也是评审人的比例（防止「自审自合」）
- 行内评论密度：`unResolvedCommentCount / CR 数`

**打分公式**：
```
quality_score = pass_rate * 50 + self_review_penalty + comment_density_score
self_review_penalty = -20 if 自审率 > 50% else 0
comment_density_score = min(30, avg_unresolved_comments * 10)  # 鼓励充分评审
```

### 维度 3：任务交付（20%）

**指标**：
- 周期内完成的工作项数（status 流转到「已完成 / 开发完成 / 测试通过」）
- 按时完成率（在 dueDate 前完成）
- 跨迭代项数（延期项）

**MCP 调用**：
- `search_workitems` 按 `assignedTo=用户ID` + `status=已完成` 拉取
- `list_workitem_activities` 看 `finishTime` vs `dueDate`

**打分公式**：
```
score = completed * 5 + on_time_rate * 50 + (1 - overdue_rate) * 30
max 100，超出封顶 100
```

**数据缺失说明**：若项目下工作项数 < 3，本维度按团队平均分 × 1.0 兜底，并在报告里标注「该成员工作项录入不足，建议补录」。

### 维度 4：业务影响力（20%）

**指标**：
- 参与「核心项目」的工作量占比（核心项目 = 客户已上线 / 有持续迭代的项目，如禹通云管、禹通官网）
- 高优工作项（priority 1-2）完成占比
- 跨项目贡献：涉及的 repo 数

**MCP 调用**：
- 周期内 `list_commits` 按 `repositoryId` 去重数
- `search_workitems` `priority=1,2` 计数

**打分公式**：
```
score = core_project_ratio * 40 + high_priority_ratio * 40 + repo_diversity * 20
```

### 维度 5：协作与可靠（15%）

**指标**：
- 作为评审人时，从 CR 创建到评审完成的平均时长
- 评审覆盖率：周期内有 CR 但作为评审人的次数
- 引入的线上故障数（看 `线上故障` 类型工作项，assignee 是本人且 status=已修复）
- 月度未交付承诺延期

**打分公式**：
```
score = review_speed_score + coverage_score - fault_penalty
review_speed_score = max(0, 40 - avg_hours * 2)
coverage_score = min(30, coverage_count * 5)
fault_penalty = online_fault_count * 15
```

## 加分 / 扣分项（独立）

**加分**（每个 +3~+5，年度总加分上限 +10）：
- 跨项目代码贡献：commits 涉及 ≥ 3 个 repo
- 文档沉淀：`docs:` 前缀的 commit 占比 ≥ 10%
- 技术分享 / 知识传递：评审意见被采纳率高

**扣分**（无下限）：
- 引入线上故障 -5/次
- 严重回滚（`Revert` 提交） -3/次
- 周期内无任何 commit 或 CR -10（脱岗预警）
- 月度打卡 / 会议无故缺席（人工录入，leader 提供数据）

## 评级映射

```
final_score = Σ(dim_score × weight) + bonus - penalty
```

| 分数 | 等级 | 含义 |
|------|------|------|
| ≥ 90 | S | 卓越，可加薪 / 晋升候选 |
| 80-89 | A | 优秀，绩效全额 |
| 70-79 | B | 良好，绩效 80% |
| 60-69 | C | 合格，绩效 60% |
| < 60 | D | 待改进，需辅导 |

## 输出格式

```markdown
# {员工姓名} {YYYY-MM} 月度考核报告

## 总分：{score}（{S/A/B/C/D}）

## 五维度雷达
- 代码交付：{n}/100
- 质量评审：{n}/100
- 任务交付：{n}/100
- 业务影响：{n}/100
- 协作可靠：{n}/100

## 关键数据
- 周期内 commit：{n} 次，活跃 {n} 天
- 提交 CR：{n} 个，通过率 {n}%
- 完成工作项：{n} 个，按时率 {n}%
- 涉及项目 / 仓库：{list}

## 加分 / 扣分
- ...

## 综合评语（1-2 段）
- 本周期亮点
- 下周期建议

## 数据可信度
- 完整：✅
- 部分缺失：⚠️ {列出哪些维度因数据不足打了兜底分}
```

## 使用流程

1. 确认考核周期（默认上月 1 号到月末）
2. 列出要考核的员工 userId 列表（`search_organization_members` 拿全员）
3. 对每个员工，并行调用 5 个维度的 MCP 数据
4. 按公式计算分数，输出 markdown 报告
5. 合并为 `report-{month}.md` 团队汇总

## 已知限制 & 升级路径

- **工作项录入不足**：当前 9 个项目里大部分工作项为空。**行动项**：要求 leader 在迭代开始时建任务，否则维度 3/4 无法精准打分，只能兜底。
- **工时数据缺失**：`list_current_user_effort_records` 返回空。先不上线「工时」维度，等团队养成登记习惯再加。
- **Programs API 报 403**：免费版组织不支持，影响项目集维度的批量拉取。
- **代码量统计**：当前只能通过 commit 数 + 消息体粗略估算。**升级路径**：接入 Codeup 的 diff stats API（待 Yunxiao MCP 开放）来取真实 +/- 行数。
- **多人同邮箱**：`1225792591@qq.com` 出现 G22 / 林振龙 两个名字，注意按 `committerName` 兜底匹配 `name`。

## Rules

- 所有分数必须可追溯到具体 MCP 数据，禁止凭空打分
- 数据不足的维度**必须标注兜底**，不能隐藏
- 个人考核只给本人 + leader 看，团队汇总可全公司
- 月度报告归档到 `~/.yutong-perf/{YYYY-MM}/` 供季度复盘
- 不要把 commit 数当唯一指标；4 人小团队里单人可能 0 commit 因为在做设计 / 调研，要看维度 5 和评语
