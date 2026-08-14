---
name: yutong-perf
description: AI 时代的月度技术绩效考核。基于云效（Yunxiao）MCP 的代码 + 项目数据，为广东禹通互联网科技有限公司（协会管理 / 培训平台 / 商城多业务线）员工生成 5 维度考核报告。**指标体系对齐 DORA + SPACE + FAAFO 三大行业框架，专门处理 AI 辅助编码带来的指标失真**。使用场景：HR 月底要考核材料、leader 复盘团队表现、个人查看自己分数。
---

# yutong-perf

为广东禹通生成 AI 时代的月度技术绩效考核报告。所有数据通过云效 MCP 拉取，无需员工手工填表。

## 公司画像

- 业务：协会管理系统 / 培训选课平台 / 直播 / 商城（B 端为主，多业务线）
- 团队：5+ 人，前端 / 后端 / 全栈混合
- 云效组织 ID：`69fd28e2405bafb07e12ed36`
- 老板账号：`yutong2025`（`69fd25e9a407dfca29f835ff`）
- 当前技术栈：Vue / Element 前端，Java 后端，Codeup + G22 / 林振龙 主导

## 为什么 v1 的指标体系作废了

v1 还在用「commit 数 / LOC / 评审一次通过率」打分。在 AI 时代这些全是**虚荣指标**：

| 旧指标 | AI 时代的失真 | 来源 |
|--------|-------------|------|
| Commit 数 | Cursor/Copilot 一次会话能产生 30+ commit，单纯数数 = 数 AI 的产出 | Will Larson *infraeng.dev* 明确将 commit 数列为 vanity metric |
| LOC | AI 单次可生成数千行；LOC 多 ≠ 价值高 | GitHub 2022 研究：Copilot 让完成率提升但不代表更多行数 = 更好 |
| 评审通过率 | AI 写 + AI 审 = 互相打钩，零信号 | Gene Kim 在 *Vibe Coding* (2025) 明确点出 |
| 个人工时 | 不再可观察（AI 完成部分无法拆工时） | DORA 2024 已剔除 |
| 自评 commit | 失去意义 | FAAFO 反对 |

## 新指标体系：DORA + SPACE + FAAFO 混合

行业已经形成三个被广泛验证的框架，本 skill 把它们适配成 5 维：

| 来源框架 | 核心思想 | 在本 skill 中用在哪一维 |
|---------|---------|----------------------|
| **DORA**（Accelerate, Forsgren-Humble-Kim） | 4 个交付指标：Lead Time / Deploy Freq / MTTR / Change Fail Rate | 维度 1+2 |
| **SPACE**（ACM Queue, 2021） | 多维度、不要单一指标、要 outcomes 不要 output | 维度 3+4 |
| **FAAFO**（Vibe Coding, Kim-Yegge 2025） | Fast / Ambitious / Autonomous / Fun / Optionality | 维度 5 |
| **infraeng.dev**（Will Larson） | Vanity metrics 必须删、metrics + survey 结合 | 全局原则 |

## 5 维度考核模型

| # | 维度 | 权重 | 数据源 | 框架来源 |
|---|------|------|--------|---------|
| 1 | 交付速度 | 25% | `list_change_requests` + `list_change_request_patch_sets` | DORA: Lead Time + Deploy Freq |
| 2 | 质量与稳定 | 20% | `list_commits`（revert）+ `list_change_requests` | DORA: Change Fail Rate + MTTR |
| 3 | 业务结果 | 20% | `list_change_requests`（merged）+ `search_workitems`（finished） | SPACE: Performance（outcomes） |
| 4 | 协作与流动 | 15% | `list_change_request_comments` + CR reviewers | SPACE: Communication + Efficiency |
| 5 | AI 杠杆与判断力 | 20% | 综合（commit 消息体 + 跨 repo + revert 比例） | FAAFO + Will Larson |

### 维度 1：交付速度（25%）—— DORA 视角

**指标**（按 DORA 标准定义，**不要看绝对数**）：

- **Lead Time for Changes**：从 CR 创建到 merged 的中位数小时数
  - 数据：`list_change_request_patch_sets` 的 `createTime` + `list_change_requests` 的 `mergedRevision` 时间
- **Deployment Frequency**：周期内 merged CR 数
  - 数据：`list_change_requests` 状态为已合并的计数
- **CR 一次性提交率**：versionNo=1 直接合并的占比（**反向指标**：反复修改 = 提交/评审质量差）

**打分公式**（0-100）：

```
score = max(0, 100 - median_lead_hours * 2) * 0.5
      + min(100, deploy_count * 10) * 0.3
      + one_shot_merge_rate * 100 * 0.2
```

**关键原则**（来自 DORA）：
- 关注**中位数**而非均值，避免被极端值带偏
- 关注**周期内趋势**（同环比），不绝对值
- 单次交付大特性 vs 多次小特性都 OK，**关键是 flow 顺畅**

**评语模板**：
- 分数 ≥ 80：`交付节奏稳定，flow 顺畅`
- 50-79：`交付正常，CR 一次通过率有提升空间`
- < 50：`交付受阻，建议排查卡点（评审等待？需求不清？）`

### 维度 2：质量与稳定（20%）—— DORA 视角

**指标**：

- **Change Fail Rate**：周期内需要回滚 / hotfix 的 commit 占比
  - `git revert` 前缀的 commit / 总 commit
  - 已合并的 CR 中被再次回滚的
- **MTTR（Mean Time To Restore）**：线上故障从发生到恢复的中位时长
  - 需配 `线上故障` 类型工作项的 `createdAt` 到 `finishedAt`
- **线上故障引入数**：assignee 是本人 + 状态 = 已修复的「线上故障」工作项

**打分公式**：

```
score = max(0, 100 - fail_rate * 500) * 0.5
      + max(0, 100 - fault_count * 20) * 0.3
      + (data available ? mttr_score : 70) * 0.2
```

MTTR 缺失时给 70 兜底分（团队均位）。

**关键洞察**（来自 Accelerate）：
- 高绩效团队的 change fail rate < 15%，elite 团队 < 5%
- 引入故障**不是耻辱**，MTTR 短 + 复盘到位才是真本事

### 维度 3：业务结果（20%）—— SPACE Performance 视角

**这是 v1 改最大的维度**。v1 是「参与核心项目工作量」，但 AI 时代下**没有任何意义**——一个工程师 1 小时就能交付 v1 时代一周的代码量。

**指标**（必须是 outcome，不是 output）：

- **特性交付数**：周期内合并到主干的、对终端用户可见的特性（commit message 含 `feat:` 前缀且涉及用户可见模块）
- **关键问题解决数**：修复了 P0/P1 缺陷的 `线上故障` 工作项
- **客户/Leader 满意度**（必需人工输入）：leader 主观评分 1-5

**打分公式**：

```
score = feature_count * 15        # 0~100 封顶
      + critical_fix_count * 25   # 一个关键修复 = 25 分
      + leader_satisfaction * 15  # 人工输入
```

**核心原则**（来自 SPACE 论文）：
- **不要数 commit 数 / LOC**——这是 output，不是 outcome
- **不要数"参与"**——参与 vs 实际交付是两件事
- **leader 主观分必须有**——纯客观数据会漏掉"安静做大事"的人

**数据缺失兜底**：工作项 < 3 个的项目，leader 满意度权重提到 50%，数据权重降到 50%。

### 维度 4：协作与流动（15%）—— SPACE 视角

**指标**：

- **评审响应时间**：作为 reviewer 的 CR，`reviewTime - 创建时间` 的中位数
  - 数据：`list_change_requests` 的 reviewers 数组
- **评审覆盖度**：周期内被指定为 reviewer 的次数
- **建设性评论密度**：`unResolvedCommentCount` 中位数（**适度的评论 = 充分讨论，过高 = 流程没对齐**）
- **跨项目协作**：在 ≥ 2 个 repo 留有 commit

**打分公式**：

```
score = max(0, 100 - median_review_hours * 3) * 0.4
      + min(100, review_coverage * 10) * 0.3
      + comment_density_score * 0.2
      + cross_repo_bonus * 0.1   # bonus
```

`comment_density_score` = `min(30, 20 - |avg_unresolved - 2| * 5)`，目标值是 2 条/CR。

**关键洞察**（来自 SPACE 论文 GitHub 研究）：
- 73% 用户反馈 Copilot 帮他们保持 flow
- **评审及时 > 评审质量**（快的反馈远比深思熟虑的延迟反馈价值高）
- **协作的真正信号是 cross-team 流动**，不是评审数

### 维度 5：AI 杠杆与判断力（20%）—— FAAFO + Will Larson

**这是 v1 没有的全新维度**。专门衡量「用 AI 把影响力放大」的能力。

**指标**：

- **FAAFO 体现**（基于 commit message + 行为推断）：
  - **F (Fast)**：交付周期短 + 频率高
  - **A (Ambitious)**：周期性承担跨模块 / 跨 repo 任务
  - **A (Autonomous)**：独立合并无 review 的 CR 占比适度（**< 30%**，高了反而扣分）
  - **F (Fun)**：commit 消息体积极 / 含 emoji（弱信号）
  - **O (Optionality)**：能选不同方案——表现为同时存在 `refactor:` 和 `feat:` 提交
- **工程判断力**（人工输入）：leader 评估「在不确定场景下做选择的质量」
- **AI 工具使用深度**（leader 主观）：
  - L1：偶尔用 Copilot 补全
  - L2：常态用 Cursor / Claude Code 做整段代码
  - L3：用 AI 做架构调研 / 跨文件重构
  - L4：用 AI agent 自主完成完整特性

**打分公式**：

```
score = faafo_signals * 0.4
      + eng_judgment_score * 0.4   # 人工
      + ai_depth_level * 10         # L1=10, L2=20, L3=35, L4=50, 上限 50
```

**核心洞察**（来自 Vibe Coding, Kim-Yegge 2025）：
- 衡量 AI 杠杆不是衡量"用 AI 写了多少代码"，而是**用 AI 做了哪些以前不可能做的事**
- 高 AI 杠杆 = **FAAFO 五个维度都能体现**
- **警告**：单纯数 commit 数（output）来衡量 AI 杠杆 = 自我欺骗

## 加分 / 扣分项（独立）

**加分**（每个 +3~+5，年度总加分上限 +10）：
- 跨项目关键贡献（被打回又重做后成功）
- 文档沉淀（`docs:` 前缀 commit 占比 ≥ 10%）
- 主动知识分享（`feat:` 中含示例 / 教程）
- 引入 AI 工具并帮同事用上（leader 主观）

**扣分**（无下限）：
- 引入线上故障 -5/次
- 严重回滚（`Revert` 提交） -3/次
- 周期内零 merged CR -10（脱岗预警）
- 自审自合（无 reviewer）> 70% -5
- **凑数行为**（检测：短时间 burst commit + 消息雷同） -10

## 评级映射

```
final_score = Σ(dim_score × weight) + bonus - penalty
```

| 分数 | 等级 | 含义 |
|------|------|------|
| ≥ 90 | S | 卓越 |
| 80-89 | A | 优秀 |
| 70-79 | B | 良好 |
| 60-69 | C | 合格 |
| < 60 | D | 待改进 |

## 关键禁止（写给所有使用这个 skill 的人）

1. **禁止**用 commit 数 / LOC 单独评价员工。AI 时代这两个数基本无意义。
2. **禁止**只看线上 commits 评交付——要看 merged CRs，看 lead time 中位数。
3. **禁止**纯数据评估。leader 主观分（维度 3 和维度 5 各占 40% 权重）必须有。
4. **禁止**拿 AI 自动评审当 reviewer。AI 评审记录**不算**协作分。
5. **禁止**惩罚合理使用 AI 的人。任何人用了 AI 让交付更快的，都应在 FAAFO 维度加分。

## 输出格式

```markdown
# {员工姓名} {YYYY-MM} 月度考核报告

## 总分：{score}（{S/A/B/C/D}）

## 五维度雷达
- 交付速度：{n}/100（DORA: Lead Time {h}h, Deploy Freq {n}/月）
- 质量稳定：{n}/100（Change Fail Rate {n}%, 故障 {n} 次）
- 业务结果：{n}/100（特性 {n} 个, 关键修复 {n} 个）
- 协作流动：{n}/100（中位评审 {h}h, 跨 repo {n}）
- AI 杠杆：{n}/100（FAAFO 表现 + AI 深度 L{n}）

## 关键数据
- 中位 Lead Time：{h} 小时
- CR 一次通过率：{n}%
- 引入故障 / 回滚：{n} / {n}
- merged CR：{n} 个
- 涉及 repo：{list}

## 加分 / 扣分
- {+3 跨项目贡献}
- {-3 一次 Revert 提交}

## 综合评语（leader 输入）
- 本周期亮点
- 下周期建议

## 数据可信度
- 完整：✅
- 部分缺失：⚠️ {列出哪些维度因数据不足打了兜底分}

## AI 时代特别说明
- 本报告周期内，本人 commit 中 {n}% 由 AI 辅助完成（基于 commit message 中 "Generated with Claude Code" 等签名识别）
- AI 杠杆等级：L{n}（{简述}）
```

## 使用流程

1. 确认考核周期（默认上月 1 号到月末）
2. `search_organization_members` 拿全员 userId
3. 对每个员工，**并行**调用以下 MCP：
   - `list_change_requests` (repo × 每 repo) → Lead Time / Deploy Freq / Fail Rate
   - `list_commits` (repo × 每 repo) → revert 占比 / 跨 repo
   - `list_change_request_comments` (重要 CR) → 评论密度
   - `list_workitem_activities` (关键工作项) → 状态流转时间
4. 询问 leader 拿主观分（维度 3 + 维度 5）
5. 按公式计算，输出 markdown 报告
6. 合并为 `report-{month}.md` 团队汇总

## 已知限制 & 升级路径

- **工作项录入不足**：当前 9 个项目里大部分工作项为空。**行动项**：必须先让 leader 习惯建工作项，否则维度 3 只能靠 leader 主观分。
- **AI 使用检测缺失**：当前无法直接判断哪些 commit 是 AI 写的。**升级路径**：等 Yunxiao 支持读取 `.copilot-tracking` 类元数据，或约定团队统一加 `Assisted-by: claude-code` trailer。
- **Programs API 报 403**：免费版组织不支持，影响项目集批量拉取。
- **DORA Lead Time 精度**：当前只能算到 CR 维度，看不到更细的「需求 → 上线」全链路。**升级路径**：打通工作项 → CR 关联字段。
- **多 commit 同邮箱问题**：`1225792591@qq.com` 出现 G22 / 林振龙 两个名字，需按 `committerName` 兜底匹配。

## Rules

- 所有分数必须可追溯到具体 MCP 数据 + leader 主观分
- 维度 3 + 5 的 leader 主观分**禁止由系统猜**，必须问出来
- 数据不足的维度**必须标注兜底**
- 个人考核只给本人 + leader 看，团队汇总可全公司
- 月度报告归档到 `~/.yutong-perf/{YYYY-MM}/` 供季度复盘
- **季度复盘必须看分数趋势，不要看单月绝对值**（DORA 已证明趋势 > 绝对数）
- **明确告诉员工**：本 skill 不奖励 commit 数，只奖励「用 AI 把事做成的程度」

## 参考资料

- Forsgren, Humble, Kim. *Accelerate*. IT Revolution, 2018.（DORA 4 指标）
- Forsgren, Storey, Maddila, Zimmermann, Houck, Butler. *The SPACE of Developer Productivity*. ACM Queue, 2021.
- Kalliamvakou et al. *Research: Quantifying GitHub Copilot's Impact*. GitHub Blog, 2022.
- Kim, Yegge. *Vibe Coding*. IT Revolution, 2025.（FAAFO 框架）
- Larson, W. *Infrastructure Engineering: Developer Productivity Survey*. infraeng.dev.
- Larson, W. *Vanity Metrics and How to Spot Them*. lethain.com.（批判 commit 数 / LOC）
