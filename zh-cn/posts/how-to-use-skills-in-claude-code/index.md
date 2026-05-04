# 如何使用Claude Code Skills？


Claude Code 是 Anthropic 推出的 agentic（智能体）命令行工具，而 **Skills（技能）** 是其核心的扩展机制。

简单来说，**Skills 是一组打包好的指令、脚本和资源**，用于教导 Claude 如何以**标准化的方式**完成特定任务。

## 什么是 Claude Code 的 Skills？
在 Claude Code 中，Skills 就像是给 AI 增加的“专业插件”或“ SOP（标准作业程序）”。

它是存储在特定文件夹中的 Markdown 指令，有时还包含可执行脚本。其核心价值是避免你在每次对话中重复输入相同的偏好、流程或领域知识。

### 与Claude Projects的区别
“Claude Projects” 通常指的是 Claude.ai 网页版的一个功能，你可以把相关的文档、代码文件、技术标准上传到一个 Project 里。
- **Claude Projects**（网页版功能）：像是给 AI 准备的“参考资料库”
    - 你上传文档、代码、技术标准
    - AI 会阅读这些资料来理解你的项目背景
    - 类似：给新员工发的“公司手册”
  
- **Claude Code Skills**（命令行工具功能）：像是给 AI 准备的“工作流程手册”
    - 你定义具体的操作步骤和执行逻辑
    - AI 会按照这些步骤自动执行任务
    - 类似：给新员工发的“操作 SOP”

Projects = “这是什么”（静态知识）→ “这是我们的 API 文档”

Skills = “怎么做”（程序化流程）→ “按照这 5 个步骤生成 PR 描述”

### Skills 如何提升生产力？

Skills 通过以下方式提升生产效率：

* **消除重复劳动**：将常用的多步骤操作（如"生成 PR → 运行测试 → 更新文档"）封装为一个命令
* **知识标准化**：团队的最佳实践可以打包成 Skill，确保所有成员遵循相同的工作流
* **保持上下文**：Skills 会记住你的偏好（如代码风格、命名规范），无需每次对话重新说明
* **自动化工作流**：可以串联多个操作，例如一个 `deploy` Skill 可以自动执行：代码检查 → 构建 → 运行测试 → 推送到远程

**举例说明**：
- 没有 Skill：每次需要手动输入"请用 ESLint 检查代码，修复错误，然后运行 Jest 测试，最后生成测试覆盖率报告"
- 有了 Skill：直接输入 `/code-quality-check`，所有步骤自动按顺序执行

## Claude Code 的功能构成

在介绍Claude Code Skills的作用机制之前，我们有必要先理解 Claude Code 的功能构成。

Claude Code 的能力主要由以下 **三个技术模块** 共同驱动：

### 1. 原生系统工具
这是工具内置的底层能力，允许 Claude 直接与你的本地环境交互。
* **文件系统操作**：包括读取、搜索 (`grep`)、编辑和创建文件。
* **终端执行权**：Claude 可以直接在你的 Shell 中运行命令（如 `git`、代码构建命令或测试套件）。
* **权限范围**：它通过只读或读写权限控制，在受限的范围内操作本地资源。

### 2. 项目上下文配置文件 (`CLAUDE.md`)
这是一种基于文件的本地配置机制，用于定义特定项目的运行规则。
* **环境定义**：明确项目使用的构建系统（如 `npm`、`go build`）和测试命令。
* **规范约束**：存储编码风格、库使用偏好或架构决策，减少 AI 生成代码时的偏差。
* **自动化引导**：当 Claude 进入目录时，它会首先检索此文件以获取“项目操作说明”。

### 3. MCP 标准协议 (Model Context Protocol)
这是一种标准化的开放协议，用于实现与外部服务的能力集成。
* **互操作性**：通过连接到独立的 MCP 服务器（如 GitHub、Slack 或数据库连接器），扩展 AI 的数据边界。
* **动态发现**：Claude 会根据任务需求，动态查询已连接 MCP 服务器所提供的远程函数和资源。
* **解耦设计**：它允许用户在不修改 Claude Code 核心代码的情况下，通过添加新的协议节点来增加新功能。

| 组成部分 | 属性 | 数据流向 | 解决的问题 |
| :--- | :--- | :--- | :--- |
| **原生工具** | 内置功能 | 双向 (本地系统) | “如何操作我的文件和命令行？” |
| **CLAUDE.md** | 静态配置 | 单向 (输入给 AI) | “这个项目的开发规范和命令是什么？” |
| **MCP 协议** | 外部插件 | 双向 (远程/外部 API) | “如何获取项目之外的数据或调用第三方服务？” |

## Claude Code Skills的作用机制

Claude Code Skills是一种**基于文件系统的声明式指令集**。

### 1. 物理形态：结构化的 Markdown
在 Claude Code 中，一个 Skill 通常表现为一个包含 `SKILL.md` 的文件夹。它的内部结构受到严格定义：
* **Frontmatter (元数据)**：在 Markdown 顶部，用 YAML 定义 Skill 的名称、描述、触发词（Trigger Phrases）以及它需要的权限。
```yaml
---
name: "技能显示名称"
id: "skill-folder-name"  # 必须与文件夹名一致
description: "简短描述这个技能的用途（会在 /skills 列表中显示）"
triggers: ["触发词1", "触发词2"]  # 用户输入这些词时自动激活
tools_required: ["read_file", "bash", "mcp:github"]  # 声明需要的工具
version: "1.0.0"
---
```

* **Instructions (指令区)**：核心部分。它不是简单的 Prompt，而是一套 **SOP（标准作业程序）**，规定了处理特定任务的算法逻辑或步骤。这是 Skill 的“大脑”，用自然语言描述执行逻辑：
```
当用户触发此技能时，请按以下顺序操作：

1. **检查前置条件**：确认项目根目录存在 `package.json`
2. **执行主要任务**：运行 `npm run lint` 并捕获输出
3. **错误处理**：如果发现错误，逐个修复并重新验证
4. **生成报告**：在终端输出修复摘要

```


* **Resources (资源区，可选)**：Skill 文件夹内可以包含参考代码、Schema 定义或脚本，供 Claude 在执行任务时读取。

    - 模板文件（如 `.github/PULL_REQUEST_TEMPLATE.md`）
    - 配置示例（如 `.eslintrc.json`）
    - 参考脚本（如 `scripts/deploy.sh`）

Claude 可以在执行时读取这些文件作为参考。

![claude-code-skills-markdown-example](claude-code-skills-markdown-example.png)

### 2. 运行机制：元工具（Meta-Tool）模式
Claude Code 处理 Skills 的方式被称为 **“渐进式加载（Progressive Disclosure）”**：
* **发现阶段**：启动时，Claude 只读取所有可用 Skill 的“摘要信息”（通常只有 30-50 个 token），这被视为一种“元工具”。
* **按需调用**：只有当你的需求命中了 Skill 的触发词，或者模型推理认为该 Skill 相关时，它才会通过一个内置的 `load_skill` 工具，将该 Skill 的**完整指令**注入到当前的上下文窗口中。
* **优点**：这种机制极大地节省了上下文带宽，防止因注入过多无关指令而导致的模型性能下降（Token 损耗）。

### 3. 技术分层：Skill 到底负责什么？
为了更好地理解Skills的作用，必须将其与另外两个核心组件区分开：

| 组件 | 技术本质 | 解决的问题 | 隐喻（仅供对比） |
| :--- | :--- | :--- | :--- |
| **MCP** | 协议/接口 (JSON-RPC) | 连接外部数据和 API 的**能力** | 人的“手” |
| **Skills** | **程序化知识** (Markdown) | 处理特定任务的**流程与策略** | 人的“专业经验” |
| **CLAUDE.md** | 静态项目配置 | 项目的**全局背景** | 人的“短期记忆” |

### 4. 如何触发Claude Code Skills？

Claude Code 提供了三种触发方式，适用于不同的使用场景：

#### 方式 1：显式斜杠命令
直接在终端输入 `/技能名称`，强制加载指定的 Skill：
```bash
/security-audit
```
适用场景：当你明确知道要使用哪个技能时（推荐用于明确任务）

#### 方式 2：自然语言触发
直接用日常语言描述你的需求，如果匹配了某个 Skill 的 `triggers` 字段，Claude 会自动加载：
```bash
帮我检查代码中的安全漏洞
```
如果你的 `security-audit` Skill 的 `triggers` 包含 `["check vulnerabilities", "scan for secrets"]`，这句话就会自动触发该技能。 

适用场景：日常使用，无需记住具体的 Skill 名称

#### 方式 3：上下文推理触发
即使你没有使用触发词，Claude 也可能根据对话上下文判断需要某个 Skill：
> 你："这个 API 的错误处理有问题"
>
> Claude：（自动加载 error-handling-review Skill）"我来帮你检查错误处理逻辑..."

**触发优先级**：斜杠命令 > 触发词匹配 > 上下文推理 

**验证 Skill 是否被触发**：
- Claude 会在响应中提示："正在加载 [Skill 名称] 技能..."
- 你可以通过 /skills 命令查看当前会话中已加载的技能列表


## 如何使用 Claude Code Skills？

Claude Code 的运行遵循一个名为 **“Agentic Loop”（智能体循环）** 的机制：
1.  **意图识别**：当你输入指令时，Claude 会检索可用的 Skills 列表。
2.  **动态加载（Progressive Disclosure）**：
    * 为了节省上下文窗口空间，Claude **不会**一次性加载所有 Skills。
    * 它只在判断某个 Skill 相关时，才动态加载其内容。
3.  **执行循环**：
    * **获取上下文**：读取相关文件和 Skill 指令。
    * **采取行动**：根据 Skill 提供的脚本或指令，运行终端命令、修改文件或调用 MCP 工具。
    * **验证结果**：Skill 通常包含验证步骤（如运行 linter 或测试），Claude 会根据结果决定是否继续。
4.  **记忆与持久化**：Claude 会根据 Skills 的执行过程自动生成“Auto-memory”，并将重要的项目规范保存在 `CLAUDE.md` 中，供下次参考。


## 如何创建或添加 Claude Code Skills？

Skill 本质上是一个遵循特定 Schema（架构）的 Markdown 文件夹。

### 1. 确定存储路径
Claude Code 会从两个位置检索 Skill 文件夹：
* **全局 Skill（跨项目可用）**：`~/.claude/skills/`
* **项目 Skill（仅当前项目可用）**：`[你的项目根目录]/.claude/skills/`

### 2. 创建 Skill 文件夹结构
每个 Skill 必须是一个**独立的文件夹**。假设你要创建一个名为 `security-audit`（安全审计）的技能：
```bash
mkdir -p .claude/skills/security-audit
touch .claude/skills/security-audit/SKILL.md
```

### 3. 编写 `SKILL.md` 
`SKILL.md` 文件必须包含符合规范的 **YAML Frontmatter**。这是 Claude Code 能够“发现”该技能的关键。

**模板示例：**
```markdown
---
name: "Security Audit"
id: "security-audit"
description: "用于扫描代码中的硬编码密钥、SQL 注入风险和过时的依赖项。"
triggers: ["audit security", "check vulnerabilities", "scan for secrets"]
tools_required: ["grep", "ls", "read_file", "mcp:github-advisory-database"]
version: "1.0.0"
---

# 技能执行指令

当你执行此技能时，请严格遵守以下步骤：

1. **静态扫描**：使用 `grep` 在所有配置文件和环境变量文件中搜索关键词（如 "key", "secret", "password"）。
2. **依赖分析**：读取 `package.json` 或 `requirements.txt`，并调用 `mcp:github-advisory-database` 工具检查已知漏洞。
3. **逻辑审查**：重点检查所有数据库查询语句，确保使用了参数化查询。
4. **输出报告**：在项目根目录生成 `SECURITY_REPORT.md`，列出风险等级和修复建议。
```

#### Skills 如何与本地文件交互？

Skills 可以通过 Claude Code 的原生工具访问你的文件系统：

**读取权限**：
- 读取项目中的任何文件（如配置文件、源代码）
- 搜索文件内容（使用 `grep` 工具）
- 列出目录结构（使用 `ls` 工具）

**写入权限**：
- 创建新文件（如生成报告、配置文件）
- 修改现有文件（如自动修复代码错误）
- 执行 Shell 命令（如运行构建脚本、Git 操作）

**安全机制**：
- Skills 的文件访问权限受 Claude Code 的全局权限控制
- 你可以在 `~/.claude/config.json` 中设置只读模式或限制访问路径
- 敏感操作（如删除文件）会触发用户确认提示



### 4. 加载与刷新
添加文件后，你不需要重新编译任何东西，但需要让 Claude Code 重新索引：

* **自动索引**：在大多数情况下，当你重新启动 Claude Code 会话时，它会自动扫描 `.claude/skills/` 目录。
* **手动刷新**：在终端输入 `/reload-skills`。

### 5. 如何验证 Skill 已生效
在 Claude Code 的命令行界面中，你可以通过以下方式确认：
1.  **查看列表**：输入 `/skills`，你应该能在输出列表中看到 `security-audit`。
2.  **测试触发**：直接说：“对当前项目执行 check vulnerabilities”，Claude 应该会响应：“正在加载 Security Audit 技能...”，并开始执行 `SKILL.md` 中定义的步骤。

### 一些需要注意的技术要点
* **原子性**：一个 Skill 应该只解决一个特定的、可重复的工作流问题。
* **是否成功绑定工具**：如果你在 Frontmatter 中声明了某个 MCP 工具，而当前环境未配置该 MCP，Claude 会在使用技能前提示你安装缺失的依赖。
* **动态注入**：与 `CLAUDE.md` 不同，Skill 的详细指令不会在会话开始时就占据上下文（Context Window），只有在命中 `triggers` 时，这部分 Markdown 内容才会被动态加载到模型内存中。

## 如何组织多个 Skills？

当你的 Skills 数量增加时，合理的组织策略不仅能提升效率，还能避免技能冲突和上下文污染。

### 1. 目录结构设计：按职责分层

**反模式（扁平化堆积）**：
```
.claude/skills/
├── fix-lint/
├── format-code/
├── security-check/
├── commit/
├── pr/
├── deploy/
├── docs/
└── test/  # 当有 20+ 个 Skills 时，难以管理
```

**推荐模式（分层组织）**：
```
.claude/skills/
├── code-quality/          # 代码质量域
│   ├── lint-fix/
│   ├── format-code/
│   └── security-audit/
├── git-workflow/          # Git 操作域
│   ├── smart-commit/
│   ├── pr-generator/
│   └── branch-cleanup/
├── deployment/            # 部署域
│   ├── deploy-staging/
│   ├── deploy-production/
│   └── rollback/
└── _shared/               # 共享组件（以 _ 开头避免被直接触发）
    ├── git-status-check/
    └── env-validator/
```

**设计原则**：
- **单一职责**：每个 Skill 只做一件事，但做到极致
- **可组合性**：复杂任务通过组合多个小 Skills 完成
- **命名空间隔离**：用文件夹避免触发词冲突

### 2. 全局 vs 项目级 Skills

| 判断维度 | 全局 Skills (`~/.claude/skills/`) | 项目级 Skills (`项目/.claude/skills/`) |
|---------|----------------------------------|--------------------------------------|
| **适用范围** | 跨所有项目通用 | 仅当前项目有效 |
| **典型场景** | Git 提交规范、代码格式化、通用安全检查 | 项目特定的构建脚本、领域业务逻辑 |
| **版本控制** | 不应提交到项目仓库 | 应提交到项目仓库，团队共享 |
| **更新频率** | 低（个人偏好稳定） | 高（随项目演进） |
| **依赖性** | 不依赖特定项目结构 | 可能依赖项目特定的文件路径或配置 |

**举例**：
```bash
# 全局 Skill：通用的 Git 提交规范
~/.claude/skills/conventional-commit/SKILL.md
→ 适用于所有项目，检查提交信息格式

# 项目级 Skill：特定项目的微服务部署
my-project/.claude/skills/deploy-microservices/SKILL.md
→ 依赖项目的 docker-compose.yml 和 k8s 配置
```

### 3. 命名规范：可发现性设计

**命名公式**：`[领域前缀]-[动作]-[对象]`

**好的命名示例**：
```
git-commit-conventional    # 清晰表达：Git 领域 + 提交动作 + 规范约束
api-generate-openapi       # API 领域 + 生成动作 + OpenAPI 规范
test-run-e2e               # 测试领域 + 运行动作 + E2E 类型
```

**避免的命名**：
```
helper                     # ❌ 过于宽泛，无法理解用途
my-skill                   # ❌ 无语义信息
fix                        # ❌ 修复什么？范围不明确
utils                      # ❌ 工具集合，违反单一职责
```

**触发词设计技巧**：
```yaml
# 不好的触发词（过于宽泛，容易误触发）
triggers: ["fix", "check", "help"]

# 好的触发词（具体且有上下文）
triggers:
  - "fix linting errors"
  - "run eslint and auto-fix"
  - "check code style violations"
```

### 4. 避免 Skills 冲突与重复

#### 问题 1：触发词冲突
**场景**：两个 Skills 的触发词重叠
```yaml
# Skill A: security-audit
triggers: ["check security", "audit code"]

# Skill B: code-review
triggers: ["check code", "audit code"]  # "audit code" 冲突！
```

**解决方案**：
- 使用更具体的触发词：`"audit security vulnerabilities"` vs `"audit code quality"`
- 在 Skill 的 `description` 中明确区分场景

#### 问题 2：逻辑重复
**场景**：多个 Skills 都需要"检查 Git 状态"

**反模式**：在每个 Skill 中重复相同的逻辑
```markdown
# deploy-staging/SKILL.md
1. 检查 Git 状态，确保工作区干净
2. 执行部署...

# pr-generator/SKILL.md
1. 检查 Git 状态，确保在正确分支
2. 生成 PR...
```

**推荐模式**：创建可复用的"元 Skill"
```markdown
# _shared/git-status-check/SKILL.md
---
name: "Git Status Check"
id: "git-status-check"
description: "验证 Git 工作区状态（内部工具，不直接触发）"
triggers: []  # 空触发词，仅供其他 Skills 调用
---

检查以下条件：
1. 工作区无未提交的更改
2. 当前分支已推送到远程
3. 无未解决的合并冲突

# 其他 Skills 中引用
# deploy-staging/SKILL.md
1. 首先执行 `/git-status-check` 验证环境
2. 如果验证通过，继续部署流程...
```

### 5. 团队协作：Skills 的版本控制策略

#### 场景 1：团队共享标准化工作流
```bash
# 项目结构
my-team-project/
├── .claude/
│   └── skills/
│       ├── code-review/       # 团队代码审查标准
│       ├── deploy-staging/    # 统一的部署流程
│       └── README.md          # 说明每个 Skill 的用途和依赖
├── .gitignore                 # 不要忽略 .claude/skills/
└── package.json

# 提交到 Git
git add .claude/skills/
git commit -m "feat: add team-wide code review skill"
git push
```

**团队成员使用**：
```bash
git pull
# Claude Code 自动检测到新 Skills
# 在终端输入 /skills 验证
```

#### 场景 2：处理 MCP 依赖
如果 Skill 依赖外部 MCP 服务器（如 GitHub API），需要在项目文档中说明：

```markdown
# .claude/skills/README.md

## 依赖的 MCP 服务器

### github-mcp
- **用途**：`pr-generator` 和 `issue-tracker` Skills 需要
- **安装**：`npx @modelcontextprotocol/server-github`
- **配置**：在 `~/.claude/config.json` 中添加 GitHub token

### slack-mcp
- **用途**：`deploy-notify` Skill 需要
- **安装**：参考 https://github.com/...
```

#### 场景 3：个人定制 vs 团队标准
```bash
# 团队共享（提交到仓库）
my-project/.claude/skills/
└── deploy-staging/           # 所有人使用相同的部署流程

# 个人定制（不提交）
~/.claude/skills/
└── my-commit-style/          # 你个人的提交信息偏好
```

**在 `.gitignore` 中的配置**：
```gitignore
# 不要忽略团队共享的 Skills
!.claude/skills/

# 但忽略个人的临时 Skills（如果有）
.claude/skills/_personal/
```

### 6. 性能优化：控制上下文消耗

#### 问题：过多 Skills 导致启动变慢
Claude Code 启动时会扫描所有 Skills 的元数据。当 Skills 数量超过 50 个时，可能影响性能。

**优化策略**：
1. **延迟加载**：将不常用的 Skills 移到子目录，需要时手动加载
2. **精简 `description`**：元数据描述控制在 50 字以内
3. **禁用不需要的 Skills**：在文件夹名前加 `.` 或 `_disabled_`

```bash
# 禁用某个 Skill（不删除，但不加载）
mv .claude/skills/old-deploy/ .claude/skills/.old-deploy/
```

## 常见问题（FAQ）

### 概念与区别

#### 1. Skills、Tools、MCP 有什么区别？

这三者在 Claude Code 中扮演不同的角色：

| 组件 | 本质 | 作用 | 类比 |
|------|------|------|------|
| **Tools（工具）** | 原子能力 | Claude 可以执行的单个操作（如读文件、运行命令） | 工人的“锤子、扳手” |
| **Skills（技能）** | 程序化知识 | 将多个 Tools 组合成标准化工作流 | 工人的“施工图纸” |
| **MCP（协议）** | 外部接口 | 连接第三方服务（如 GitHub、数据库）的标准协议 | 工人的“外包供应商” |

**举例**：
```
任务：生成 PR 并通知团队

使用的 Tools：
- read_file（读取代码变更）
- bash（运行 git diff）
- write_file（生成 PR 描述）

使用的 Skill：
- pr-generator（定义了"如何生成高质量 PR"的步骤）

使用的 MCP：
- github-mcp（调用 GitHub API 创建 PR）
- slack-mcp（发送通知到 Slack 频道）
```


#### 2. Skills 和 Prompts 有什么不同？

| 维度 | Prompts | Skills |
|------|---------|--------|
| **形式** | 临时的文本指令 | 持久化的 Markdown 文件 |
| **作用域** | 当前对话 | 跨会话可复用 |
| **结构化** | 无强制格式 | 有严格的 YAML Frontmatter 和指令区 |
| **触发方式** | 手动输入 | 自动匹配触发词或斜杠命令 |
| **版本控制** | 不可追踪 | 可通过 Git 管理 |
| **团队共享** | 需要复制粘贴 | 提交到仓库即可共享 |

**举例**：
```markdown
# Prompt（临时指令）
"请帮我检查代码中的安全漏洞，重点关注 SQL 注入和硬编码密钥"

# Skill（持久化技能）
.claude/skills/security-audit/SKILL.md
→ 定义了完整的安全检查流程
→ 可以通过 /security-audit 或 "check vulnerabilities" 触发
→ 团队所有成员都使用相同的检查标准
```

#### 3. CLAUDE.md 文件是什么？与 Skills 有什么关系？

**CLAUDE.md** 是项目级的配置文件，用于存储项目的全局上下文和规范。与 Skills 的区别在于：

| 特性 | CLAUDE.md | Skills |
|------|-----------|--------|
| **位置** | 项目根目录 | `.claude/skills/` 目录 |
| **内容** | 项目背景、构建命令、编码规范 | 具体的任务执行流程 |
| **加载时机** | 会话开始时自动加载 | 按需动态加载 |
| **上下文占用** | 始终占用 token | 仅在触发时占用 |
| **适用场景** | "这个项目是什么" | "如何完成某个任务" |

**协同工作**：Skills 可以引用 CLAUDE.md 中的信息。例如，一个部署 Skill 可以读取 CLAUDE.md 中定义的构建命令。

### 使用限制

#### 4. Claude Code Skills 可以离线使用吗？

**部分可以，但有限制**：

**✅ 可以离线工作的部分**：
- Skills 的加载和解析（本地文件系统操作）
- 使用本地 Tools 的 Skills（如文件读写、Shell 命令）
- 不依赖 MCP 的 Skills

**❌ 需要网络的部分**：
- Claude 模型本身（需要连接 Anthropic API）
- 依赖 MCP 服务器的 Skills（如 GitHub、Slack 集成）
- 需要访问远程资源的操作


#### 5. Claude Code 支持哪些编程语言？

Claude Code 本身是**语言无关**的，支持所有主流编程语言：

**完全支持**（有丰富的生态工具）：
- JavaScript/TypeScript、Python、Java、C#、Go、Rust、Ruby、PHP、Swift、Kotlin

**良好支持**（可以读写和执行）：
- C/C++、Scala、Elixir、Haskell、Dart、R、Julia、Perl

**关键点**：
- Skills 可以操作任何文本文件（包括任何编程语言的源代码）
- 能否执行取决于你的本地环境是否安装了对应的运行环境
- MCP 服务器的可用性可能因语言而异


#### 6. 免费版可以使用 Skills 吗？

**取决于你使用的 Claude Code 版本**：

截至 2026 年 5 月：
- **Claude Code CLI**（命令行工具）：需要 Anthropic API 密钥，按使用量付费
- **Claude.ai 网页版**：免费版有使用限制，Pro 版无限制

**Skills 功能本身**：
- Skills 的加载和解析是本地操作，不消耗 API 额度
- 但执行 Skills 时调用 Claude 模型会消耗 token

**成本优化建议**：
- 使用精简的 Skill 描述（减少元数据 token）
- 避免在 Skills 中包含冗长的示例代码
- 利用 `triggers` 精确匹配，避免误触发

#### 7. 一次可以加载多少个 Skills？

**技术限制**：

| 维度 | 限制 |
|------|------|
| **Skills 总数** | 无硬性上限，但建议 < 100 个 |
| **同时激活** | 通常 1-3 个（按需加载） |
| **元数据扫描** | 启动时扫描所有 Skills（50+ 可能变慢） |
| **上下文窗口** | 受模型上下文限制（Sonnet 4.5 为 200K tokens） |

**实际影响**：
```
10 个 Skills：无感知延迟
50 个 Skills：启动时可能需要 1-2 秒
100+ 个 Skills：建议分类到子目录，按需加载
```

**优化策略**：
- 使用文件夹分组（如 `development/`、`deployment/`）
- 禁用不常用的 Skills（文件夹名前加 `.`）
- 精简 `description` 字段（< 50 字）

#### 8. Skills 可以访问本地数据库吗？

**可以，但需要通过间接方式**：

**方式 1：通过 Shell 命令**
```yaml
# database-backup/SKILL.md
---
tools_required: ["bash"]
---

执行步骤：
1. 运行 `pg_dump mydb > backup.sql`
2. 压缩备份文件
3. 上传到 S3
```

**方式 2：通过 MCP 服务器**
```yaml
# query-analytics/SKILL.md
---
tools_required: ["mcp:postgres"]
---

执行步骤：
1. 调用 postgres-mcp 查询用户活跃度
2. 生成可视化报告
```

**方式 3：通过脚本**
```yaml
# data-migration/SKILL.md
---
tools_required: ["bash"]
---

执行步骤：
1. 运行 `python scripts/migrate_data.py`
2. 验证迁移结果
```

**安全建议**：
- 不要在 Skills 中硬编码数据库凭证
- 使用环境变量或配置文件
- 对生产数据库操作添加确认步骤

### 故障排查

#### 9. 如何调试"Skill Not Found"错误？

**常见原因和解决方案**：

**原因 1：文件夹名与 `id` 不匹配**
```yaml
# ❌ 错误
文件夹：.claude/skills/my-skill/
SKILL.md 中：id: "my_skill"  # 下划线不匹配

# ✅ 正确
文件夹：.claude/skills/my-skill/
SKILL.md 中：id: "my-skill"
```

**原因 2：SKILL.md 文件缺失或命名错误**
```bash
# 检查文件是否存在
ls .claude/skills/my-skill/SKILL.md

# 注意：必须是大写的 SKILL.md，不能是 skill.md 或 Skill.md
```

**原因 3：YAML Frontmatter 格式错误**
```yaml
# ❌ 错误（缺少闭合的 ---）
---
name: "My Skill"
id: "my-skill"

# ✅ 正确
---
name: "My Skill"
id: "my-skill"
---
```

**原因 4：Skills 未被索引**
```bash
# 手动刷新 Skills
/reload-skills

# 或重启 Claude Code 会话
```

**调试步骤**：
1. 运行 `/skills` 查看已加载的 Skills 列表
2. 检查文件路径和命名
3. 验证 YAML 语法（使用在线 YAML 验证器）
4. 查看 Claude Code 的日志输出（如果有）

#### 10. 更新 Skill 后需要重启 Claude Code 吗？

**取决于更新的内容**：

| 更新类型 | 是否需要重启 | 刷新方法 |
|---------|-------------|---------|
| **修改 SKILL.md 内容** | 否 | 自动生效（下次触发时） |
| **修改 Frontmatter** | 是 | `/reload-skills` 或重启 |
| **添加新 Skill** | 是 | `/reload-skills` 或重启 |
| **删除 Skill** | 是 | `/reload-skills` 或重启 |
| **修改 Resources 文件** | 否 | 自动生效 |

**最佳实践**：
```bash
# 修改 Skill 后
/reload-skills

# 验证更新是否生效
/skills  # 查看列表
/my-skill  # 测试触发
```

**注意**：如果修改了 `triggers` 字段，必须刷新才能生效。

#### 11. Claude Code 会自动发现新添加的 Skills 吗？

**部分自动，但有延迟**：

**自动发现的场景**：
- 重启 Claude Code 会话时
- 运行 `/reload-skills` 命令时
- 切换到不同的项目目录时

**不会自动发现的场景**：
- 在当前会话中添加新 Skill（需要手动刷新）
- 通过 `git pull` 拉取的新 Skills（需要手动刷新）

**推荐工作流**：
```bash
# 1. 创建新 Skill
mkdir -p .claude/skills/new-feature
vim .claude/skills/new-feature/SKILL.md

# 2. 手动刷新
/reload-skills

# 3. 验证
/skills  # 应该能看到 new-feature
```

**团队协作场景**：
```bash
# 团队成员 A 提交了新 Skill
git pull

# 团队成员 B 需要手动刷新
/reload-skills
```

#### 12. 使用 Skills 时有哪些常见错误？

**错误 1：Skill 职责过于宽泛**
```yaml
# ❌ 不好的设计
name: "Project Helper"
description: "帮助处理项目中的各种任务"
# 问题：不清楚具体做什么，容易误触发

# ✅ 好的设计
name: "API Documentation Generator"
description: "从 TypeScript 代码生成 OpenAPI 文档"
```

**错误 2：触发词过于通用**
```yaml
# ❌ 容易误触发
triggers: ["fix", "check", "help"]

# ✅ 具体明确
triggers: ["generate api docs", "create openapi spec"]
```

**错误 3：在 Skill 中硬编码路径**
```markdown
# ❌ 不可移植
1. 读取 `/Users/john/project/config.json`

# ✅ 使用相对路径
1. 读取项目根目录的 `config.json`
```

**错误 4：忘记声明依赖**
```yaml
# ❌ 缺少工具声明
---
name: "Deploy to AWS"
---
# 指令中使用了 aws-cli，但未声明

# ✅ 明确声明
---
name: "Deploy to AWS"
tools_required: ["bash", "mcp:aws"]
---
```

**错误 5：Skill 之间循环依赖**
```markdown
# ❌ 循环依赖
# skill-a/SKILL.md
1. 首先执行 `/skill-b`

# skill-b/SKILL.md
1. 首先执行 `/skill-a`  # 死循环！

# ✅ 提取共享逻辑
# _shared/common-check/SKILL.md
1. 执行通用检查

# skill-a 和 skill-b 都调用 /common-check
```

**错误 6：过度依赖上下文**
```markdown
# ❌ 假设 Claude 记得之前的对话
1. 使用上次讨论的配置文件...

# ✅ 明确指定
1. 读取 `.env.production` 文件
2. 验证必需的环境变量：API_KEY, DATABASE_URL
```

**避坑指南**：
- 每个 Skill 应该是自包含的（self-contained）
- 使用明确的触发词，避免歧义
- 在 Skill 中包含验证步骤
- 为复杂 Skills 编写测试用例（在 `description` 中说明预期行为）
