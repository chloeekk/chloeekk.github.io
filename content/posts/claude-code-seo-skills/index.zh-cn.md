---
title: "从“对话框”到“工作流”：拆解 Claude Code SEO Skills"
description: "别再用简单的 Prompt 做 SEO！本文通过解构 GitHub 热门 Claude SEO Skills 源码，揭秘如何通过 SKILL.md 构建SEO专家模型。"
date: 2026-04-05T08:30:32+08:00
draft: false
categories:
- SEO
- Digital Marketing
- AI


---

你是否尝试过在 ChatGPT 或 Claude 的网页端输入“请帮我优化这段标题”来做 SEO？这种模式下的 AI 只是一个 **“高级文案助手”**，它受限于陈旧的训练数据，且对你网站的真实技术细节一无所知。

随着 **Claude Code** 及其 **Skills（技能系统）** 的出现，AI 不再只是坐在屏幕另一头和你聊天，而是直接“住”进了你的终端，拿起了爬虫工具，像一名真正的资深 SEO 专家一样开始审视代码。

这篇文章将分析 GitHub 上目前最全面的 SEO 技能库之一：[https://github.com/AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo)。这套架构让 Claude 从一个会产生幻觉的“工具人”，进化为了一个拥有自主决策能力的 **"SEO 智能体（Agent）"**。

## 什么是 Claude Code SEO Skills？

在深入分析之前，我们需要先理解 SEO Skills 在 Claude Code 生态中的定位。

**Claude Code SEO Skills 是基于 [Claude Code Skills 系统](https://chloevolution.com/zh-cn/posts/how-to-use-skills-in-claude-code/)的SEO领域专业化工具集**。如果说通用 Skills 是“教 AI 如何执行标准化工作流”，那么 SEO Skills 就是"将 SEO 专家的诊断逻辑封装成可复用的指令包"。

以本文分析的 `AgriciDaniel/claude-seo` 项目为例，它展示了专业 SEO Skills 可能具备的特征：

**1. 领域知识的硬编码**
- 内置 Google 最新算法规则（如 2025 年 9 月 QRG 更新）
- 通过 `Quality Gates` 强制 AI 遵循行业最佳实践
- 例如：明确标注"HowTo Schema 已弃用"，防止 AI 产生过时建议

**2. 工具链的深度集成**
- 通过 [MCP 协议](https://chloevolution.com/zh-cn/posts/how-to-use-skills-in-claude-code/#3-mcp-标准协议-model-context-protocol)连接 Firecrawl、DataForSEO 等专业爬虫
- 让 AI 能实时抓取网页 HTML、查询真实搜索量
- 而非依赖训练数据中的"两年前的互联网快照"

**3. 多智能体协作架构**
- 将复杂审计任务分解给 12+ 个专业子智能体（如 `seo-technical` 负责技术诊断，`seo-content` 负责内容策略）
- 采用并行处理模式：技术专家检查 `robots.txt` 的同时，文案专家正在分析 E-E-A-T 信号
- 最后由主控逻辑汇总生成统一报告

**4. 量化评估体系**
- 输出标准化的 SEO 健康分数（0-100 分）
- 将建议按 Critical（必须立即修复）到 Low（积压任务）四级分类
- 提供可追踪的优先级行动清单

这种设计让 AI 从“回答 SEO 问题的聊天机器人”升级为“能独立执行审计任务的专家系统”。接下来我们将拆解这套系统的技术实现。

## Claude Code SEO Skills解耦设计

在分析该项目的架构之前，我们需要先明确它能自动化哪些 SEO 任务:

**技术层面**:
- 爬虫可访问性检查(robots.txt、sitemap.xml 验证)
- Core Web Vitals 性能测试(包括 2024 年新增的 INP 指标)
- 结构化数据(Schema.org)检测与验证
- 移动端适配性与响应式设计检查

**内容层面**:
- E-E-A-T 信号检测(作者资质、引用来源、第一手数据)
- 内容深度分析(话题覆盖完整度 vs 字数统计)
- AI 引用就绪度评估(针对 Google AI Overviews、ChatGPT 等)
- 薄内容(Thin Content)识别

**策略层面**:
- 竞争对手内容差距分析
- 关键词聚类与搜索意图映射
- 内部链接结构优化建议
- 本地 SEO 审计(针对 Google Business Profile)

这些任务的实现依赖于我们接下来要分析的三层架构:

1. 指令层 - `SKILL.md`
传统的 AI 指令往往试图一次性告诉 AI 所有事，结果导致 AI 很快就“顾此失彼”。
该项目采用了 **渐进式披露 (Progressive Disclosure)** 的策略。其主入口文件极其精简（通常不到 200 行），它不预载任何具体的 SEO 算法，而只负责定义“界面”。

只有当你输入 `/seo audit` 时，它才会去按需调用相关的子技能。这种设计极大地节省了 Claude 上下文窗口。

很多人以为写一个 SKILL.md 就够了，但这套代码采用了 **‘身份入口（seo.md）+ 逻辑编排（seo_audit.md）’** 的分离设计。这种设计的好处在于：
- 高内聚：seo.md 只需要管好菜单和身份，极其轻量。
- 可扩展：如果你想增加一个‘本地 SEO’功能，你只需要增加一个 seo_local.md 并在 seo.md 菜单里注册一下，而不需要改动核心审计逻辑

2. 编排层 - Sub-agents
在该层级，复杂的 SEO 任务被拆解给了 **12 个以上的子智能体**（如 `seo-technical` 负责技术审计，`seo-content` 负责内容策略）。每个子智能体可以根据任务类型使用不同的 AI 模型：[推理模型用于逻辑分析，通用模型用于内容生成](https://chloevolution.com/zh-cn/posts/inference-model-vs-general-purpose-model/)。

这些子智能体遵循 **并行处理 (Parallel Agents)** 逻辑。当你运行全站审计时，技术专家在检查 `robots.txt` 的同时，文案专家正在分析 E-E-A-T 信号。这种互不干扰、最后由主控逻辑汇总的模式。

3. 执行层 - MCP & Tools

没有数据的 SEO 只是盲目猜测。该项目通过 **MCP (Model Context Protocol)** 协议,为 Claude 挂载了 `Firecrawl`、`DataForSEO` 等实时工具。

这让 AI 拥有了实时观测互联网的能力。它不再依赖两年前的训练记忆,而是能实时抓取你网页的 HTML,调用 Google API 查询真实的搜索量。至此,AI 真正拥有了**"看遍互联网的眼睛"和"操作代码的手"**。

## 从全局身份定义到多模块流程编排 ([seo](https://github.com/AgriciDaniel/claude-seo/blob/main/skills/seo/SKILL.md) & [seo-audit](https://github.com/AgriciDaniel/claude-seo/blob/main/skills/seo-audit/SKILL.md))

首先，我们会发现skill都采用 **“文件夹/SKILL.md”的命名模式**。

在早期的 AI 指令中，大家习惯把所有东西塞进一个 .md 文件。但在工业级项目中，采用“文件夹封装”意味着每个技能都是一个独立的原子包。

为什么要这么做？ 这样每个技能文件夹内不仅可以放 SKILL.md，还可以放置该技能专属的脚本、参考数据集或子模板，实现了高内聚、低耦合。

### seo/SKILL.md

通过3部分代码，让Claude在推理过程中实现 **“检索 -> 定位 -> 执行”** 的逻辑闭环：

**1. 开头 (YAML Metadata)：技能的“注册与索引”**
这部分是给 Claude 的 **路由系统**看的，决定了技能的 **执行边界**。如果这一部分写得不好，即使后面的代码再牛，Claude 也无法在正确的时机加载它。

* **`description` 与 `keywords`**：这是最重要的部分。Claude 在后台会对用户输入进行语义检索。如果你的描述涵盖了 `EEAT`、`GEO`、`INP`，那么当用户提到这些词时，Claude 才会“唤醒”这个巨大的 Skill 包。
* **`argument-hint`**：定义了命令的语法规范（如 `[command] [url]`），确保 Claude 在调用时不会因为参数错误而崩溃。

![claude-code-seo-skills-yaml](claude-code-seo-skills-yaml.png)


**2. 一级标题：技能的“身份锚定”**

位于 `# SEO: Universal SEO Analysis Skill` 之下，这部分是给 Claude 的 **元认知**看的，作用是确立全局上下文与调用协议。它确立了 Claude 此时此刻的“专家人设”和“工具箱规模”。

* **调用规范 (`Invocation`)**：明确告诉模型如何使用变量（`$1`, `$2`），这是模型在执行命令时的“操作指南”。
* **规模声明**：提到“编排 16 个子技能和 11 个子智能体”，其目的是让 Claude 在进入任务前意识到这是一个 **复杂任务**，从而分配更多的计算资源来处理后续的编排逻辑。


![claude-code-seo-skills-identtity](claude-code-seo-skills-identtity.png)

**3. 多个二级标题：技能的“执行 SOP”**

这是最核心的 **工程逻辑块**，每一块都代表了一个独立的业务逻辑模块。通过 **模块化**，将庞大的 SEO 知识库拆解成 Claude 可以逐步消化的约束与任务流指导。

* **`Quick Reference` (交互界面)**：将自然语言指令转化为机器可识别的命令映射表。
* **`Orchestration Logic` (编排引擎)**：这是**最关键的一块**。它规定了任务的**优先级和触发条件**（例如：检测到本地业务才启动 `seo-local`）。它解决了 AI “东一榔头西一棒槌”的问题。
* **`Industry Detection` (环境自适应)**：让 AI 具备“看人下菜碟”的能力，根据网页特征自动切换分析模式。
* **`Quality Gates` (硬性约束线)**：这是专家经验的**硬编码**。它直接规定了哪些是“错”的（如弃用 HowTo Schema），强制 AI 遵循 2026 年的最新标准，防止模型产生“过时知识幻觉”。
* **`Scoring/Sub-skills` (数据结构)**：定义了输出结果的**量化标准**，确保最终生成的报告具有统一的评分逻辑。


### seo-audit/SKILL.md：多任务流水线编排

`seo-audit/SKILL.md` 将 `seo.md` 确立的全局意图转化为了具体的 **算法流程**。

如果说 `seo.md` 是一个分发请求的“路由器”，那么 `seo-audit/SKILL.md` 就是负责复杂运算的“逻辑内核”。它们共同构成了系统的 **总控层**。


**1. 开头 (YAML Metadata)：资源预算与触发边界**

它明确了任务的 **处理能力**（Crawls up to 500 pages）和 **人力配置**（10 specialists）。

这在工程上非常重要。它给了 Claude 一个明确的“预算预期”，防止 AI 试图在一个无限大的网站上耗尽所有 Token。

![claude-code-seo-skills-yaml-2](claude-code-seo-skills-yaml-2.png)

**2. 一级标题：审计的状态机**

它的作用是确立任务的先后顺序与依赖关系。

`# Full Website SEO Audit` 之下定义的 `Process` 是一套标准的**顺序逻辑流**：
        1. `Fetch` (获取数据) $\rightarrow$ 2. `Detect` (行业识别) $\rightarrow$ 3. `Crawl` (爬取遍历) $\rightarrow$ 4. `Delegate` (委派专家)。
  
它利用了 LLM 的顺序遵循能力。特别是在第 4 步，它列出了 11 个子智能体的委派逻辑。这种“先总后分”的设计是多智能体协作的标准工业实践。


**3. 多个二级标题：硬约束与标准化输出**

二级标题提供精细化的运行参数与数据结构约束：
* **`Crawl Configuration` (运行参数)**：这里硬编码了爬虫的行为准则（并发数 5，延迟 1s）。这种做法将原本属于传统软件的 **Rate Limiting（限速）** 逻辑注入到了 AI 的行为中，保护了目标网站不被 AI 流量“压垮”。
* **`Scoring Weights` (评分模型)**：这部分定义了 SEO 健康分的**权重矩阵**。它强制 AI 在生成报告时必须遵循：Content 占 23%、Technical 占 22% 等量化标准。
* **`Report Structure` (输出 Schema)**：这实际上是在定义一个 **Markdown 接口协议**。它规定了最终报告必须包含哪些章节。这种强约束确保了无论 AI 在分析过程中发现了什么乱七八糟的数据，最终交到用户手中的都是一份格式统一、结构严谨的专业文档。
* **`Optional Integrations` (条件分支逻辑)**：源码通过 `If...spawn...` 逻辑实现了**功能的热插拔**。例如，只有在检测到 Google API 或 DataForSEO 密钥时才激活高级审计。这体现了代码的健壮性：在缺少外部工具时，它能优雅地降级为“普通审计模式”。


## 专项任务执行 (以[seo-content](https://github.com/AgriciDaniel/claude-seo/blob/main/skills/seo-content/SKILL.md)为例)

在执行层，`seo-content` 模块展示了如何将抽象的“内容质量”转化为 AI 可量化的执行逻辑。

1. 开头 (YAML Metadata)

通过 `description` 明确了适用场景（E-E-A-T、内容审计、可读性检查）。最核心的是它在元数据中标记了 **Version 1.7.0**，这暗示了该技能是随着搜索算法（如 2025 年 9 月的 QRG 更新）持续迭代的，具有极强的**时效性**。

2. 一级标题

紧跟 `# Content Quality & E-E-A-T Analysis` 的是其引用的参考文件。这种“外部链接”模式让 Claude 知道：**“我的判断不是基于旧记忆，而是基于这份 2025 年 9 月更新的评估框架。”**

3. 多个二级标题

该 Skill 并非通过简单的关键词匹配来分析内容，而是通过以下四个关键维度构建了一套审计模型：

**A. 维度一：E-E-A-T 的数字化准则**
该 Skill 的核心能力在于将 Google 抽象的"经验、专业、权威、可靠"准则转化为了**可检测的信号点**。

* 通过二级标题下的细分指令，强制 Claude 检索页面中的"第一手研究"、"作者简介"、"物理地址"和"引用来源"。
* 它不仅仅是"读"文字，而是在搜索**信任背书信号**。例如，它会检查是否有 `Organization` 或 `Person` 类型的结构化数据。这使得 AI 的分析结果从"我觉得这篇文章写得不错"升级为"该页面缺乏第一手实验数据，Experience 维度得分较低"。


**B. 维度二：工程化指标与非教条约束**

该维度体现了 Skill 对 SEO 演进规律的深度集成，避免了传统工具常见的“唯数据论”坑点。

虽然设定了不同页面类型的字数底线（如博客 1500 字），但通过二级标题中的 `Important` 备注，强制 AI 将“话题覆盖完整度”置于“字数统计”之上。

引入 Flesch 阅读易懂度指标，但同步内置了“Google 不直接使用该指标进行排名”的约束逻辑，防止 AI 引导用户进行无效优化。

这种 **“带权重的指标分析”** 能力，确保了 AI 给出的建议是基于搜索意图（User Intent）的，而非僵化的字数或密度。

**C. 维度三：GEO (生成式引擎优化) 与 AI 引用就绪度**

这是该 Skill 区别于以往所有 SEO 插件的最前沿维度，针对 2025-2026 年的 **Google AI Mode** 进行了深度适配。

分析内容是否具备清晰的、可被 LLM 提取的统计数据和事实陈述。同时检查 H1->H3 的层级流动以及"答案优先"的格式，以确保内容能被 ChatGPT、Perplexity 等生成式引擎精准抓取。

**不同任务的模型选择：**
这些分析维度的有效性很大程度上取决于选择正确的 AI 模型类型。对于结构化数据提取和 E-E-A-T 信号检测，[推理模型](https://chloevolution.com/zh-cn/posts/inference-model-vs-general-purpose-model/)因其逻辑推理能力而表现出色。对于内容改写和创意优化建议，通用模型更为合适。理解这些区别有助于优化执行速度和输出质量。

它将 visibility（可见性）的定义从"排名"扩展到了"引用"。通过 `AI Citation Readiness` 指标，它在指导用户如何通过优化 Entity Clarity（实体清晰度）来获取 AI 搜索时代的流量。

**D. 维度四：量化评分与优先级行动路线**
作为一个执行层工具，其最终产出不是感性的评价，而是**标准化的数据接口**，包括：
* **加权评分系统**：将内容质量拆解为四个子项，每个子项占 25 分。
* **任务分级逻辑**：根据对排名的潜在影响，将建议划分为 Critical（必须立即修复）到 Low（积压任务）四个等级。

这种 “结果可量化”的设计，让 Claude 能够输出一份包含 SEO 健康分、E-E-A-T 细分表和实施路线图的专业报告。

### 如何使用 Skills 优化 GEO?

该项目通过 `seo-geo` 子智能体实现 Google AI Overviews 的专项优化。具体使用方式:

1. **触发审计**: 在 Claude Code 中输入 `/seo geo [你的网址]`
2. **AI 爬虫检测**: Skills 会检查你的网站是否允许 GPTBot、Google-Extended 等 AI 爬虫访问
3. **引用格式分析**: 评估内容是否符合"段落级可引用性"(Passage-level Citability)标准:
   - 是否有清晰的数据点(如"根据 2025 年研究,转化率提升 34%")
   - H2/H3 标题是否直接回答用户问题
   - 是否使用了"答案优先"的倒金字塔结构
4. **实体清晰度检查**: 验证关键实体(人物、产品、地点)是否有明确的结构化数据标注
5. **生成优化报告**: 输出包含"AI 可见性分数"和具体修改建议的 Markdown 文档

**与传统 SEO 的区别**:
传统 SEO 优化目标是"排名第一",而 GEO 优化目标是“被 AI 引用”。该 Skill 会检测你的内容是否具备被 ChatGPT、Perplexity 等工具作为信息源引用的特征。

## Claude Code SEO Skills的设计思路

我还分析了MCP Market上的一份[SEO skills](https://mcpmarket.com/tools/skills/seo-specialist-1)代码，可以到它与之前分析的 `AgriciDaniel/claude-seo` 在设计哲学上有着本质的区别，也为我们自己设计SEO相关的skills提供两种不同的方向。

如果说 GitHub 的项目是一个 **“工业级多模块系统”**，那么这份代码更像是一个 **“全能型单体工具”**。

![mcpmarket-seo-skill](mcpmarket-seo-skill.png)

我们可以通过以下两个维度，分析 `seo-specialist-1` 是如何通过不同的路径充当“专家”的：

**1. 维度一：指令结构的“扁平化”与“原子化”**

与 `AgriciDaniel` 那种“总控+子 Agent”的套娃架构不同，这份代码采用了**单文件指令集**。

它将关键词研究、页面优化、技术诊断全部整合在一个 Prompt 定义中。它不进行“任务委派”，而是让 Claude 在同一个上下文窗口内完成所有判断。

这种结构更适合 **即时任务**。例如，当你只需要快速检查一个标题或一段元描述时，这种单体工具的响应速度更快，因为它不需要加载复杂的子技能树。


**2. 维度二：从“流程驱动”转向“角色驱动”**

这份代码更多地依赖于 **Persona（人格定义）** 的深度。

它在指令开头花费了大量篇幅定义“SEO 专家”的思维逻辑和语气，但缺乏像 `seo-audit` 中那种严密的 `Crawl Configuration`或 `Quality Gates`这种物理限制。

它更依赖 Claude 自身的推理能力，而非依靠外部脚本或硬编码的权重算法。

GitHub 项目通过 **代码约束**来保证结果的稳定性；而 MCP Market 的这份代码通过 **高级提示词**来激发模型的创造性。


| 维度 | `AgriciDaniel/claude-seo` (GitHub) | `seo-specialist-1` (MCP Market) |
| :--- | :--- | :--- |
| **架构类型** | 模块化/多智能体| 单体/单指令|
| **核心优势** | 严谨性、可扩展性、处理大规模站点 | 轻量、响应快、适合单页分析 |
| **数据获取** | 强依赖外部 MCP | 侧重模型内置知识或基础抓取 |
| **适用场景** | 深度全站审计、企业级 SEO 流程 | 快速内容检查、即时策略咨询 |
| **错误容忍** | 极低（有硬性 Quality Gates） | 较高（依赖 AI 自我校准） |

## 通过模型选择优化 Skills

在构建或定制 SEO Skills 时，理解不同 AI 模型的优势至关重要：

- **技术审计**（`seo-technical`、`seo-schema`）：使用[推理模型](https://chloevolution.com/zh-cn/posts/inference-model-vs-general-purpose-model/)，因其在逻辑分析和结构化输出方面表现优异
- **内容生成**（`seo-content`、关键词建议）：使用通用模型，发挥其创造力和自然语言流畅性
- **混合任务**（E-E-A-T 分析、GEO 优化）：结合两者——推理模型负责评分逻辑，通用模型负责建议生成

这种战略性的模型分配可以将执行时间减少 30-40%，同时提高输出准确性。

## 常见问题（FAQ）

### Claude Code可以做SEO审计吗？

是的，Claude Code 可以执行全面的 SEO 审计。以 `AgriciDaniel/claude-seo` 项目为例，它能够：

**技术审计**：检查 robots.txt、sitemap.xml、Core Web Vitals（包括 INP）、结构化数据、移动端适配性
**内容审计**：分析 E-E-A-T 信号、内容深度、AI 引用就绪度、薄内容识别
**策略审计**：竞争对手分析、关键词聚类、内部链接结构、本地 SEO

与传统工具的区别在于，Claude Code 不仅能检测问题，还能**理解上下文**并提供具体的修复建议。例如，它不会只说"缺少 Schema 标记"，而是会说"建议在作者区域添加 Person Schema，包含 name、jobTitle 和 sameAs 属性"。

### Claude Code可以爬取线上网站并进行SEO分析吗?

**可以，但需要配置 MCP 服务器**。

**基础爬取能力**（无需 MCP）：
- Claude Code 可以通过 `curl` 或 `wget` 命令抓取单个页面的 HTML
- 适合小规模分析（1-10 个页面）
- 受限于速率限制和反爬虫机制

**高级爬取能力**（需要 MCP）：
- **Firecrawl MCP**：支持大规模爬取（最多 500 页），自动处理 JavaScript 渲染、遵守 robots.txt
- **DataForSEO MCP**：提供实时 SERP 数据、关键词搜索量、竞争对手分析
- **优雅降级**：如果未配置 MCP，Skills 会自动切换到"普通审计模式"，使用本地工具完成基础分析

**技术边界**：
- 无法绕过登录墙或付费内容
- 大型网站（10,000+ 页面）建议使用专业爬虫工具预处理数据
- 遵守目标网站的 robots.txt 和速率限制

### Claude Code对SEO初学者友好吗？

**适合，但有学习曲线**。

**对初学者友好的方面**：
1. **自然语言交互**：不需要记住复杂的命令，直接说"检查这个页面的 SEO 问题"
2. **解释性输出**：不仅指出问题，还会解释"为什么这是问题"和"如何修复"
3. **渐进式学习**：从简单的单页分析开始，逐步掌握全站审计
4. **内置最佳实践**：Skills 已经编码了 Google 最新算法规则，避免过时建议

**需要克服的挑战**：
1. **命令行环境**：需要基本的终端操作能力
2. **技术概念**：需要理解 HTML、Schema、robots.txt 等基础概念
3. **MCP 配置**：高级功能需要配置外部服务器（有学习成本）
4. **结果解读**：需要判断哪些建议优先实施

**对比其他工具**：
- **Yoast SEO**：更简单（WordPress 插件），但功能有限
- **Ahrefs**：功能强大，但界面复杂且昂贵
- **Claude Code**：中等难度，灵活性高，成本可控

### Claude Code可以替代如Ahrefs的SEO工具吗?

**不能完全替代，但在某些场景下是更好的选择**。

**Claude Code 的优势**：

| 功能 | Claude Code | Ahrefs |
|------|-------------|--------|
| **技术审计** | ✅ 深度分析，可定制 | ✅ 标准化报告 |
| **内容分析** | ✅ 理解上下文，E-E-A-T 评估 | ⚠️ 基础指标（字数、关键词） |
| **Schema 验证** | ✅ 详细诊断 + 生成代码 | ⚠️ 基础检测 |
| **成本** | ✅ 按需付费（$0.5-$12/审计） | ❌ $99-$999/月订阅 |
| **定制化** | ✅ 可编写自定义 Skills | ❌ 固定功能 |

**Ahrefs 的优势**：

| 功能 | Claude Code | Ahrefs |
|------|-------------|--------|
| **反向链接分析** | ❌ 需要 MCP 扩展 | ✅ 行业领先（数万亿链接数据库） |
| **关键词研究** | ⚠️ 需要 DataForSEO MCP | ✅ 内置庞大关键词库 |
| **竞争对手分析** | ⚠️ 基础功能 | ✅ 深度流量分析、内容差距 |
| **排名追踪** | ❌ 不支持 | ✅ 自动化日常追踪 |
| **历史数据** | ❌ 无历史记录 | ✅ 多年历史趋势 |

**使用建议**：

**选择 Claude Code 的场景**：
- 技术审计和 Schema 优化
- 内容质量深度分析（E-E-A-T、GEO）
- 一次性项目或预算有限
- 需要高度定制化的审计流程

**选择 Ahrefs 的场景**：
- 外链建设和竞争对手研究
- 关键词研究和排名追踪
- 需要历史数据和趋势分析
- 团队协作和客户报告


### Claude Code支持程序化SEO（Programmatic SEO）吗？

**支持，且非常适合**。

**什么是 Programmatic SEO**：
通过模板和数据库批量生成大量针对长尾关键词的页面（如 Zapier 的"App A + App B 集成"页面，Nomad List 的"城市 + 数字游民"页面）。

**Claude Code 的优势**：

**1. 模板生成**
```bash
# 示例：生成 100 个城市的 SEO 页面
/seo-programmatic plan
```
Claude 可以：
- 分析现有高排名页面的结构
- 提取模板模式（标题公式、内容框架、Schema 结构）
- 生成可复用的模板代码

**2. 内容差异化**
传统 Programmatic SEO 的问题是"模板化内容"被 Google 视为低质量。Claude 可以：
- 为每个页面生成独特的介绍段落
- 根据数据动态调整内容深度（热门城市 = 更长内容）
- 添加本地化细节（而非简单替换变量）

**3. Schema 自动化**
```javascript
// Claude 可以批量生成结构化数据
{
  "@type": "Place",
  "name": "{{city_name}}",
  "description": "{{dynamic_description}}",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "{{lat}}",
    "longitude": "{{lng}}"
  }
}
```

**4. 质量控制**
- 自动检测重复内容
- 评估每个页面的 E-E-A-T 信号
- 识别"薄内容"页面并标记需要人工丰富

**局限性**：

**Claude Code 不擅长的**：
- **大规模数据处理**：生成 10,000+ 页面时，建议用 Python 脚本 + Claude API
- **实时数据更新**：需要配合 CI/CD 流程自动化
- **性能优化**：生成的 HTML 可能需要人工优化加载速度
