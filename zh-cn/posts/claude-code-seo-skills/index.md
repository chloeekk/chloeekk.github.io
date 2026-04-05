# 从“对话框”到“工作流”：拆解 Claude Code SEO Skills



如果你还在试图通过在 ChatGPT 或 Claude 的网页端输入“请帮我优化这段标题”来做 SEO，那么你可能已经落后了。这种模式下的 AI 只是一个 **“高级文案助手”**，它受限于陈旧的训练数据，且对你网站的真实技术细节一无所知。

然而，随着 **Claude Code** 及其 **Skills（技能系统）** 的出现，游戏规则被彻底改写。AI 不再只是坐在屏幕另一头和你聊天，而是直接“住”进了你的终端，拿起了爬虫工具，像一名真正的资深 SEO 专家一样开始审视代码。

这篇文章将分析 GitHub 上目前最全面的 SEO 技能库之一：[https://github.com/AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo)。在剥离掉数千行复杂的 Markdown 指令和 JSON 配置后，我发现其强大的核心来自一套严谨的 **“三层金字塔模型”**。这套架构让 Claude 从一个会产生幻觉的“工具人”，进化为了一个拥有自主决策能力的 **“SEO 智能体（Agent）”**。

## Claude Code SEO Skills解耦设计

我们可以将其拆解为三个关键层级：

1. 指令层 - `SKILL.md`
传统的 AI 指令往往试图一次性告诉 AI 所有事，结果导致 AI 很快就“顾此失彼”。
该项目采用了 **渐进式披露 (Progressive Disclosure)** 的策略。其主入口文件极其精简（通常不到 200 行），它不预载任何具体的 SEO 算法，而只负责定义“界面”。

只有当你输入 `/seo audit` 时，它才会去按需调用相关的子技能。这种设计极大地节省了 Claude 宝贵的上下文窗口，确保每一份 Token 都花在解决问题的刀刃上。

很多人以为写一个 SKILL.md 就够了，但这套代码采用了 **‘身份入口（seo.md）+ 逻辑编排（seo_audit.md）’** 的分离设计。这种设计的好处在于：
- 高内聚：seo.md 只需要管好菜单和身份，极其轻量。
- 可扩展：如果你想增加一个‘本地 SEO’功能，你只需要增加一个 seo_local.md 并在 seo.md 菜单里注册一下，而不需要改动核心审计逻辑

2. 编排层 - Sub-agents
在该层级，复杂的 SEO 任务被拆解给了 **12 个以上的子智能体**（如 `seo-technical` 负责技术审计，`seo-content` 负责内容策略）。

这些子智能体遵循 **并行处理 (Parallel Agents)** 逻辑。当你运行全站审计时，技术专家在检查 `robots.txt` 的同时，文案专家正在分析 E-E-A-T 信号。这种互不干扰、最后由主控逻辑汇总的模式。

3. 执行层 - CP & Tools
没有数据的 SEO 只是盲目猜测。该项目通过 **MCP (Model Context Protocol)** 协议，为 Claude 挂载了 `Firecrawl`、`DataForSEO` 等实时工具。

这让 AI 拥有了实时观测互联网的能力。它不再依赖两年前的训练记忆，而是能实时抓取你网页的 HTML，调用 Google API 查询真实的搜索量。至此，AI 真正拥有了**“看遍互联网的眼睛”和“操作代码的手”**。

## 从全局身份定义到多模块流程编排 ([seo](https://github.com/AgriciDaniel/claude-seo/blob/main/skills/seo/SKILL.md) & [seo-audit](https://github.com/AgriciDaniel/claude-seo/blob/main/skills/seo-audit/SKILL.md))

首先，我们会发现skill都采用 **“文件夹/SKILL.md”的命名模式**。

在早期的 AI 指令中，大家习惯把所有东西塞进一个 .md 文件。但在工业级项目中，采用“文件夹封装”意味着每个技能都是一个独立的原子包。

为什么要这么做？ 这样每个技能文件夹内不仅可以放 SKILL.md，还可以放置该技能专属的脚本、参考数据集或子模板，实现了高内聚、低耦合。

### seo/SKILL.md：身份锚定与指令路由

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
该 Skill 的核心能力在于将 Google 抽象的“经验、专业、权威、可靠”准则转化为了**可检测的信号点**。

* 通过二级标题下的细分指令，强制 Claude 检索页面中的“第一手研究”、“作者简介”、“物理地址”和“引用来源”。
* 它不仅仅是“读”文字，而是在搜索**信任背书信号**。例如，它会检查是否有 `Organization` 或 `Person` 类型的结构化数据。这使得 AI 的分析结果从“我觉得这篇文章写得不错”升级为“该页面缺乏第一手实验数据，Experience 维度得分较低”。

**B. 维度二：工程化指标与非教条约束**

该维度体现了 Skill 对 SEO 演进规律的深度集成，避免了传统工具常见的“唯数据论”坑点。

虽然设定了不同页面类型的字数底线（如博客 1500 字），但通过二级标题中的 `Important` 备注，强制 AI 将“话题覆盖完整度”置于“字数统计”之上。

引入 Flesch 阅读易懂度指标，但同步内置了“Google 不直接使用该指标进行排名”的约束逻辑，防止 AI 引导用户进行无效优化。

这种 **“带权重的指标分析”** 能力，确保了 AI 给出的建议是基于搜索意图（User Intent）的，而非僵化的字数或密度。

**C. 维度三：GEO (生成式引擎优化) 与 AI 引用就绪度**
这是该 Skill 区别于以往所有 SEO 插件的最前沿维度，针对 2025-2026 年的 **Google AI Mode** 进行了深度适配。

分析内容是否具备清晰的、可被 LLM 提取的统计数据和事实陈述。同时检查 H1->H3 的层级流动以及“答案优先”的格式，以确保内容能被 ChatGPT、Perplexity 等生成式引擎精准抓取。

它将 visibility（可见性）的定义从“排名”扩展到了“引用”。通过 `AI Citation Readiness` 指标，它在指导用户如何通过优化 Entity Clarity（实体清晰度）来获取 AI 搜索时代的流量。

**D. 维度四：量化评分与优先级行动路线**
作为一个执行层工具，其最终产出不是感性的评价，而是**标准化的数据接口**，包括：
    * **加权评分系统**：将内容质量拆解为四个子项，每个子项占 25 分。
    * **任务分级逻辑**：根据对排名的潜在影响，将建议划分为 Critical（必须立即修复）到 Low（积压任务）四个等级。

这种 **“结果可度量化”**的设计，让 Claude 能够输出一份包含 SEO 健康分、E-E-A-T 细分表和实施路线图的专业报告。

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

