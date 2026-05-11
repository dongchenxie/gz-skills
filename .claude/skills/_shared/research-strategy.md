# Research 统一规范

所有 **生成类 sub-skill** 在抓取/调研外部信息时必须遵守本文件。
违反任意一条，审核环节直接判定为红线，阻塞发布。

---

## 1. 信源白名单（硬约束）

- 所有被推文引用的 **URL、条款、数字、日期、机构名** 必须来自 `_shared/sources.yaml` 列出的域名。
- 学校自有内容（教务通知、平台操作指引）域名必须在 `sources.yaml.school_internal` 内。
- 非清单内的域名：**sub-agent 只能用来做背景理解**，**不允许**作为引用源出现在正文。引用前必须回到清单内的官网核对一遍同一信息。
- 清单外发现高价值信源时：**sub-agent 不要私自采纳**，把候选 URL 放回主上下文，由小编决定是否手工加白到 `sources.yaml`。

> 红线：清单外域名的政策原文、数字、条款进入正文 → 阻塞发布。

---

## 2. 抓取必须在 sub-agent 内完成

主上下文不直接 `WebFetch` 政策原文。所有抓取派 `Agent` 子 agent (`subagent_type: general-purpose`) 完成，原因：

- 政府站点 HTML 体积大，会把主上下文撑爆。
- 多页比对、JS 渲染重试、Playwright fallback 都是噪声工作，不应进主上下文。
- 主上下文只接收 sub-agent 的 **结构化 JSON**，不接收原文 HTML / Markdown。

---

## 3. 广度并发抓取（policy / tips 默认走此流程）

主题确定后，sub-agent 必须 **横向并发** 抓三层官网的相关页：

| 层级 | 来源（按 `sources.yaml`） | 用途 |
|---|---|---|
| **国家部** | `national`（mohurd / mohrss / cecs） | 上位法、全国统一规则 |
| **省厅** | `guangdong_province` | 广东本地实施细则、补贴标准 |
| **市局** | `guangzhou_city` / `jiangmen_city` / `yunfu_city`（按受众地域） | 申报入口、本地化窗口期、咨询电话 |

并发策略：
1. sub-agent 接到主题（如"安全员证书新规"）后，先在三层各自的**通知公告/政策法规**栏目内检索匹配项（栏目路径见 `sources.yaml` 的 `category_path` 字段，若该字段为空则从首页爬一层）。
2. 命中的页面用 `WebFetch` 并发抓；403/302/空壳 → fallback Playwright MCP。
3. 对每一篇候选打分（见 §5），淘汰低分项。
4. 回主上下文的 JSON 只包含 **top 1-3**。

> 单源精读（如 `guide` 类，用户已经直接给了平台 URL）不走并发，但仍必须经过域名白名单校验。

---

## 4. 外网（清单外域名）规则

- 行业自媒体、协会简报、新闻报道：**只读不引用**。允许 sub-agent 浏览以建立背景理解（"业内对此政策的普遍解读视角"），但产出物里**不出现**这些来源。
- 行业自媒体提到的"具体数字 / 期限 / 条款" → 必须回到清单内官网二次核实，核实不到的一律删除。
- 不允许 sub-agent 跳到搜索引擎结果直接复述。任何"网上有人说……"的信息要么找到官网原文，要么舍弃。

---

## 5. 价值评分（sub-agent 在返回前对每篇候选打分）

| 维度 | 高分（3 分） | 中分（2 分） | 低分（1 分） |
|---|---|---|---|
| **权威级别** | 国家部委文件 | 省厅文件 | 市局通知 / 协会简报 |
| **时效** | 发文 ≤ 90 天 | 90 天 – 1 年 | > 1 年 |
| **政策刚性** | 通知 / 办法 / 决定 / 公告 | 通则 / 实施细则 | 意见 / 指南 / 答复 |
| **受众相关性** | 题目/正文直接命中 Q1 客户画像 | 间接相关 | 沾边 |
| **可量化条款数量** | ≥ 3 个具体数字（金额/期限/人数） | 1–2 个 | 0 个 |

加权总分 = 简单求和。**总分 < 8 的候选不进 top N**，sub-agent 在 `rejected` 字段标明原因。

---

## 6. Sub-agent I/O 契约

### 输入

```yaml
topic: string              # 主题，1 句话
audience: B|C|mix          # 客户画像（来自 Q1）
goal: fan|conv|hybrid      # 文章目的（来自 Q0）
primary_url: string|null   # 用户提供的主 URL（可选）
regions: [gz, jm, yf, ...] # 关心的市级地域
```

### 输出（**仅 JSON，无 HTML**）

```json
{
  "primary": {
    "title": "...",
    "issuer": "...",
    "issue_date": "YYYY-MM-DD",
    "effective_date": "YYYY-MM-DD",
    "url": "https://...",
    "key_clauses": ["...", "..."],
    "key_numbers": { "subsidy_max": "3000元", "deadline": "2026-06-30" },
    "applicable_targets": ["..."],
    "value_score": 13
  },
  "supporting": [
    { "title": "...", "url": "...", "value_score": 11, "why_kept": "省级实施细则补充" }
  ],
  "rejected": [
    { "url": "...", "value_score": 6, "reason": "发文超 2 年" }
  ],
  "background_only_external": [
    { "domain": "xxx.com", "summary": "业内普遍认为该政策利好 X 群体（仅作背景，未引用具体数据）" }
  ]
}
```

主上下文拿到 JSON 后才开始撰稿。**不要让 sub-agent 直接撰稿**，撰稿必须在主上下文按 `article-goals.md` × 客户画像执行。
