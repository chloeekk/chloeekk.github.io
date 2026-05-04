---
title: "How to Use Skills in Claude Code?"
date: 2026-04-25T09:23:34+08:00
draft: false

categories:
- AI
---

Claude Code is an agentic command-line tool launched by Anthropic, and **Skills** are its core extension mechanism.

Simply put, **Skills are a packaged set of instructions, scripts, and resources** used to teach Claude how to complete specific tasks in a **standardized way**.

## What are Claude Code Skills?

In Claude Code, Skills are like adding “professional plugins” or **SOPs (Standard Operating Procedures)** to AI.

They are Markdown-based instructions stored in specific folders, sometimes including executable scripts. Their core value is to eliminate the need to repeatedly input the same preferences, workflows, or domain knowledge in every conversation.

### Difference from Claude Projects

“Claude Projects” typically refers to a feature in the Claude.ai web interface, where you can upload related documents, code files, and technical standards into a Project.

* **Claude Projects (web feature)**: like a “reference library” prepared for AI

  * You upload documents, code, and technical standards
  * The AI reads these materials to understand your project context
  * Similar to: giving a new employee a “company handbook”

* **Claude Code Skills (CLI feature)**: like a “workflow manual” prepared for AI

  * You define specific operational steps and execution logic
  * The AI executes tasks automatically following these steps
  * Similar to: giving a new employee an “operational SOP”

Projects = “What it is” (static knowledge) → “This is our API documentation”

Skills = “How to do it” (procedural workflow) → “Generate a PR description following these 5 steps”

### How do Skills improve productivity?

Skills enhance productivity in the following ways:

* **Eliminate repetitive work**: Package common multi-step operations (e.g., “generate PR → run tests → update documentation”) into a single command
* **Standardize knowledge**: Team best practices can be encapsulated into Skills, ensuring consistent workflows across members
* **Maintain context**: Skills remember your preferences (e.g., coding style, naming conventions), so you don’t need to restate them each time
* **Automate workflows**: Chain multiple operations together—for example, a `deploy` Skill can automatically run: code checks → build → testing → push to remote

**Example**:

* Without Skills: You manually input, “Please use ESLint to check the code, fix errors, then run Jest tests, and finally generate a test coverage report.”
* With Skills: Simply enter `/code-quality-check`, and all steps execute automatically in sequence

## Functional Architecture of Claude Code

Before understanding how Skills work, it’s important to first understand the overall functional architecture of Claude Code.

Claude Code’s capabilities are primarily driven by the following **three technical modules**:

### 1. Native System Tools

These are built-in low-level capabilities that allow Claude to directly interact with your local environment.

* **File system operations**: including reading, searching (`grep`), editing, and creating files
* **Terminal execution**: Claude can directly run commands in your shell (e.g., `git`, build commands, or test suites)
* **Permission scope**: operations are constrained through read-only or read-write permissions within a controlled environment

### 2. Project Context Configuration File (`CLAUDE.md`)

This is a file-based local configuration mechanism used to define rules for a specific project.

* **Environment definition**: specifies the project’s build system (e.g., `npm`, `go build`) and test commands
* **Constraints and standards**: stores coding styles, library preferences, or architectural decisions to reduce deviations in AI-generated code
* **Automated guidance**: when Claude enters a directory, it first retrieves this file to understand “how to operate within the project”

### 3. MCP Standard Protocol (Model Context Protocol)

This is a standardized open protocol used to integrate capabilities with external services.

* **Interoperability**: extends AI’s data boundaries by connecting to independent MCP servers (e.g., GitHub, Slack, or database connectors)
* **Dynamic discovery**: Claude dynamically queries connected MCP servers for available remote functions and resources based on task requirements
* **Decoupled design**: allows users to add new functionality by introducing new protocol nodes without modifying Claude Code’s core code

| Component        | Attribute       | Data Flow                    | Problem Solved                                   |
| ---------------- | --------------- | ---------------------------- | ------------------------------------------------ |
| **Native Tools** | Built-in        | Bidirectional (local system) | “How do I operate my files and command line?”    |
| **CLAUDE.md**    | Static config   | One-way (input to AI)        | “What are the project’s standards and commands?” |
| **MCP Protocol** | External plugin | Bidirectional (remote/API)   | “How do I access external data or services?”     |

## How Claude Code Skills Work

Claude Code Skills are a **declarative instruction set based on the file system**.

### 1. Physical Form: Structured Markdown

In Claude Code, a Skill typically exists as a folder containing a `SKILL.md` file. Its internal structure is strictly defined:

* **Frontmatter (metadata)**: At the top of the Markdown file, YAML is used to define the Skill’s name, description, trigger phrases, and required permissions.

```yaml
---
name: "Skill Display Name"
id: "skill-folder-name"  # Must match the folder name
description: "A short description of what this skill does (shown in /skills list)"
triggers: ["trigger phrase 1", "trigger phrase 2"]  # Automatically activates when matched
tools_required: ["read_file", "bash", "mcp:github"]  # Declare required tools
version: "1.0.0"
---
```

* **Instructions (instruction section)**: This is the core of the Skill. It is not just a simple prompt, but a full **SOP (Standard Operating Procedure)** that defines the algorithmic logic or steps for handling a specific task. This is the “brain” of the Skill, described in natural language:

```
When this skill is triggered, follow these steps in order:

1. **Check prerequisites**: Ensure `package.json` exists in the project root
2. **Execute main task**: Run `npm run lint` and capture the output
3. **Error handling**: If errors are found, fix them one by one and re-validate
4. **Generate report**: Output a summary of fixes in the terminal
```

* **Resources (optional)**: The Skill folder can include reference code, schema definitions, or scripts that Claude can read during execution.

  * Template files (e.g., `.github/PULL_REQUEST_TEMPLATE.md`)
  * Configuration examples (e.g., `.eslintrc.json`)
  * Reference scripts (e.g., `scripts/deploy.sh`)

Claude can read these files as references while executing tasks.

### 2. Execution Mechanism: Meta-Tool Mode

Claude Code processes Skills using a mechanism called **“Progressive Disclosure”**:

* **Discovery phase**: At startup, Claude only reads the “summary information” of all available Skills (typically 30–50 tokens), treating them as “meta-tools.”
* **On-demand loading**: Only when your request matches a Skill’s triggers—or when the model infers that the Skill is relevant—does Claude use a built-in `load_skill` tool to inject the **full instructions** of that Skill into the current context window.
* **Advantage**: This mechanism greatly saves context bandwidth and prevents performance degradation caused by injecting too many irrelevant instructions (token overhead).

### 3. Technical Layering: What Do Skills Actually Handle?

To better understand the role of Skills, it’s important to distinguish them from two other core components:

| Component     | Technical Nature                    | Problem Solved                                    | Analogy (for comparison only)        |
| ------------- | ----------------------------------- | ------------------------------------------------- | ------------------------------------ |
| **MCP**       | Protocol / Interface (JSON-RPC)     | Capability to connect external data and APIs      | A person’s “hands”                   |
| **Skills**    | **Procedural knowledge (Markdown)** | Workflow and strategy for handling specific tasks | A person’s “professional experience” |
| **CLAUDE.md** | Static project configuration        | Global context of the project                     | A person’s “short-term memory”       |

### 4. How to Trigger Claude Code Skills

Claude Code provides three ways to trigger Skills, each suited to different scenarios:

#### Method 1: Explicit Slash Command

Directly enter `/skill-name` in the terminal to force-load a specific Skill:

```bash
/security-audit
```

**Use case**: When you clearly know which Skill you want to use (recommended for well-defined tasks)

#### Method 2: Natural Language Trigger

Describe your request in plain language. If it matches a Skill’s `triggers` field, Claude will automatically load it:

```bash
Help me check for security vulnerabilities in the code
```

If your `security-audit` Skill has triggers like `["check vulnerabilities", "scan for secrets"]`, this request will automatically activate it.

**Use case**: Everyday usage without needing to remember specific Skill names

#### Method 3: Contextual Inference Trigger

Even without explicit trigger phrases, Claude may infer the need for a Skill based on the conversation context:

> You: “There’s an issue with error handling in this API”
>
> Claude: (automatically loads the `error-handling-review` Skill)
> “Let me help you review the error handling logic...”

**Trigger priority**: Slash command > Trigger phrase match > Contextual inference

**How to verify a Skill has been triggered**:

* Claude will indicate in its response: “Loading [Skill Name]...”
* You can use the `/skills` command to view the list of Skills currently loaded in the session


## How to Use Claude Code Skills

Claude Code operates based on a mechanism called the **“Agentic Loop.”**

1. **Intent recognition**: When you input a command, Claude searches through the list of available Skills.
2. **Dynamic loading (Progressive Disclosure)**:

   * To conserve context window space, Claude does **not** load all Skills at once.
   * It only dynamically loads a Skill when it determines that the Skill is relevant.
3. **Execution loop**:

   * **Gather context**: Read relevant files and Skill instructions.
   * **Take action**: Execute terminal commands, modify files, or call MCP tools based on the Skill’s scripts or instructions.
   * **Validate results**: Skills usually include validation steps (e.g., running a linter or tests), and Claude decides whether to continue based on the results.
4. **Memory and persistence**: Claude automatically generates “Auto-memory” based on Skill execution and stores important project conventions in `CLAUDE.md` for future reference.

## How to Create or Add Claude Code Skills

A Skill is essentially a Markdown folder that follows a specific schema.

### 1. Define the storage path

Claude Code looks for Skill folders in two locations:

* **Global Skills (available across projects)**: `~/.claude/skills/`
* **Project Skills (available only in the current project)**: `[your project root]/.claude/skills/`

### 2. Create the Skill folder structure

Each Skill must be an **independent folder**. For example, to create a Skill named `security-audit`:

```bash
mkdir -p .claude/skills/security-audit
touch .claude/skills/security-audit/SKILL.md
```

### 3. Write `SKILL.md`

The `SKILL.md` file must include a properly structured **YAML Frontmatter**. This is the key for Claude Code to “discover” the Skill.

**Template example:**

```markdown
---
name: "Security Audit"
id: "security-audit"
description: "Used to scan code for hardcoded secrets, SQL injection risks, and outdated dependencies."
triggers: ["audit security", "check vulnerabilities", "scan for secrets"]
tools_required: ["grep", "ls", "read_file", "mcp:github-advisory-database"]
version: "1.0.0"
---

# Skill Instructions

When executing this Skill, strictly follow these steps:

1. **Static scan**: Use `grep` to search all configuration and environment files for keywords (e.g., "key", "secret", "password").
2. **Dependency analysis**: Read `package.json` or `requirements.txt`, and call `mcp:github-advisory-database` to check for known vulnerabilities.
3. **Logic review**: Focus on all database queries and ensure parameterized queries are used.
4. **Generate report**: Create `SECURITY_REPORT.md` in the project root, listing risk levels and remediation suggestions.
```

#### How do Skills interact with local files?

Skills can access your file system through Claude Code’s native tools:

**Read permissions**:

* Read any file in the project (e.g., config files, source code)
* Search file contents (using `grep`)
* List directory structures (using `ls`)

**Write permissions**:

* Create new files (e.g., reports, config files)
* Modify existing files (e.g., automatically fix code issues)
* Execute shell commands (e.g., run build scripts, Git operations)

**Security mechanisms**:

* File access permissions are controlled by Claude Code’s global settings
* You can configure read-only mode or restrict paths in `~/.claude/config.json`
* Sensitive operations (e.g., file deletion) will trigger user confirmation prompts


### 4. Load and refresh

After adding files, you don’t need to recompile anything, but you do need Claude Code to re-index:

* **Automatic indexing**: In most cases, restarting the Claude Code session will automatically scan the `.claude/skills/` directory
* **Manual refresh**: Enter `/reload-skills` in the terminal

### 5. How to verify the Skill is active

In the Claude Code CLI, you can confirm using the following methods:

1. **Check the list**: Enter `/skills`, and you should see `security-audit` in the output
2. **Test trigger**: Say “Run check vulnerabilities on the current project,” and Claude should respond with “Loading Security Audit Skill...” and begin executing the steps defined in `SKILL.md`


### Key technical considerations

* **Atomicity**: A Skill should solve one specific, repeatable workflow problem
* **Tool binding (`tools_required`)**: If you declare an MCP tool in the Frontmatter but it is not configured in the current environment, Claude will prompt you to install the missing dependency before execution
* **Dynamic injection**: Unlike `CLAUDE.md`, the detailed instructions of a Skill do not occupy the context window at session start. They are only dynamically loaded into the model’s memory when the `triggers` are matched.

## How to Organize Multiple Skills

As the number of your Skills grows, a well-structured organization strategy not only improves efficiency but also prevents skill conflicts and context pollution.

### 1. Directory Structure Design: Layered by Responsibility

**Anti-pattern (flat accumulation)**:

```
.claude/skills/
├── fix-lint/
├── format-code/
├── security-check/
├── commit/
├── pr/
├── deploy/
├── docs/
└── test/  # Difficult to manage when there are 20+ Skills
```

**Recommended pattern (layered organization)**:

```
.claude/skills/
├── code-quality/          # Code quality domain
│   ├── lint-fix/
│   ├── format-code/
│   └── security-audit/
├── git-workflow/          # Git operations domain
│   ├── smart-commit/
│   ├── pr-generator/
│   └── branch-cleanup/
├── deployment/            # Deployment domain
│   ├── deploy-staging/
│   ├── deploy-production/
│   └── rollback/
└── _shared/               # Shared components (prefix with _ to avoid direct triggering)
    ├── git-status-check/
    └── env-validator/
```

**Design principles**:

* **Single responsibility**: Each Skill should focus on one task, but do it exceptionally well
* **Composability**: Complex workflows should be built by combining multiple smaller Skills
* **Namespace isolation**: Use folders to avoid trigger conflicts

### 2. Global vs Project-Level Skills

| Dimension             | Global Skills (`~/.claude/skills/`)                              | Project-Level Skills (`project/.claude/skills/`) |
| --------------------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| **Scope**             | Reusable across all projects                                     | Only applicable to the current project           |
| **Typical use cases** | Git commit conventions, code formatting, general security checks | Project-specific build scripts, domain logic     |
| **Version control**   | Should not be committed to the project repo                      | Should be committed and shared with the team     |
| **Update frequency**  | Low (personal preferences are stable)                            | High (evolves with the project)                  |
| **Dependencies**      | Not tied to specific project structures                          | May depend on project-specific paths or configs  |

**Examples**:

```bash
# Global Skill: general Git commit convention
~/.claude/skills/conventional-commit/SKILL.md
→ Applies to all projects, validates commit message format

# Project-level Skill: microservice deployment for a specific project
my-project/.claude/skills/deploy-microservices/SKILL.md
→ Depends on the project's docker-compose.yml and k8s configuration
```

### 3. Naming Conventions: Designing for Discoverability

**Naming formula**: `[domain]-[action]-[object]`

**Good naming examples**:

```
git-commit-conventional    # Clearly expresses: Git domain + commit action + convention
api-generate-openapi       # API domain + generate action + OpenAPI spec
test-run-e2e               # Testing domain + run action + E2E type
```

**Names to avoid**:

```
helper                     # ❌ Too vague, unclear purpose
my-skill                   # ❌ No semantic meaning
fix                        # ❌ Fix what? Scope unclear
utils                      # ❌ Generic toolbox, violates single responsibility
```

**Trigger design tips**:

```yaml
# Poor triggers (too broad, easily misfired)
triggers: ["fix", "check", "help"]

# Good triggers (specific and contextual)
triggers:
  - "fix linting errors"
  - "run eslint and auto-fix"
  - "check code style violations"
```
### 4. Avoiding Skill Conflicts and Duplication

#### Issue 1: Trigger Phrase Conflicts

**Scenario**: Two Skills have overlapping trigger phrases

```yaml
# Skill A: security-audit
triggers: ["check security", "audit code"]

# Skill B: code-review
triggers: ["check code", "audit code"]  # "audit code" conflicts!
```

**Solution**:

* Use more specific trigger phrases: `"audit security vulnerabilities"` vs `"audit code quality"`
* Clearly differentiate use cases in the Skill’s `description`

#### Issue 2: Logic Duplication

**Scenario**: Multiple Skills need to “check Git status”

**Anti-pattern**: Repeating the same logic in each Skill

```markdown
# deploy-staging/SKILL.md
1. Check Git status to ensure the working directory is clean  
2. Execute deployment...

# pr-generator/SKILL.md
1. Check Git status to ensure you're on the correct branch  
2. Generate PR...
```

**Recommended pattern**: Create a reusable “meta Skill”

```markdown
# _shared/git-status-check/SKILL.md
---
name: "Git Status Check"
id: "git-status-check"
description: "Validate Git working directory status (internal tool, not directly triggered)"
triggers: []  # No triggers, only called by other Skills
---

Check the following conditions:
1. No uncommitted changes in the working directory  
2. Current branch is pushed to remote  
3. No unresolved merge conflicts  

# Referenced in other Skills
# deploy-staging/SKILL.md
1. First run `/git-status-check` to validate the environment  
2. If validation passes, continue the deployment process...
```


### 5. Team Collaboration: Version Control Strategy for Skills

#### Scenario 1: Team-wide standardized workflows

```bash
# Project structure
my-team-project/
├── .claude/
│   └── skills/
│       ├── code-review/       # Team code review standards  
│       ├── deploy-staging/    # Unified deployment process  
│       └── README.md          # Documents each Skill’s purpose and dependencies  
├── .gitignore                 # Do NOT ignore .claude/skills/  
└── package.json  

# Commit to Git
git add .claude/skills/  
git commit -m "feat: add team-wide code review skill"  
git push  
```

**How team members use it**:

```bash
git pull  
# Claude Code automatically detects new Skills  
# Run /skills in the terminal to verify  
```

#### Scenario 2: Handling MCP dependencies

If a Skill depends on external MCP servers (e.g., GitHub API), document it in the project:

```markdown
# .claude/skills/README.md

## Required MCP Servers  

### github-mcp  
- **Purpose**: Required by `pr-generator` and `issue-tracker` Skills  
- **Installation**: `npx @modelcontextprotocol/server-github`  
- **Configuration**: Add GitHub token in `~/.claude/config.json`  

### slack-mcp  
- **Purpose**: Required by `deploy-notify` Skill  
- **Installation**: Refer to https://github.com/...  
```

#### Scenario 3: Personal customization vs team standards

```bash
# Team-shared (committed to repository)
my-project/.claude/skills/  
└── deploy-staging/           # Same deployment process for everyone  

# Personal customization (not committed)
~/.claude/skills/  
└── my-commit-style/          # Your personal commit preferences  
```

**`.gitignore` configuration**:

```gitignore
# Do NOT ignore team-shared Skills  
!.claude/skills/  

# But ignore personal temporary Skills (if any)  
.claude/skills/_personal/  
```

---

### 6. Performance Optimization: Controlling Context Usage

#### Issue: Too many Skills slow down startup

Claude Code scans metadata for all Skills at startup. When the number exceeds 50, performance may be affected.

**Optimization strategies**:

1. **Lazy loading**: Move infrequently used Skills into subdirectories and load them manually when needed
2. **Concise descriptions**: Keep metadata `description` under 50 words
3. **Disable unused Skills**: Prefix folder names with `.` or `_disabled_`

```bash
# Disable a Skill (keep it but prevent loading)
mv .claude/skills/old-deploy/ .claude/skills/.old-deploy/
```
## Frequently Asked Questions (FAQ)

### Concepts and Differences

#### 1. What is the difference between Skills, Tools, and MCP?

These three components play different roles in Claude Code:

| Component  | Nature                 | Function                                                                           | Analogy                           |
| ---------- | ---------------------- | ---------------------------------------------------------------------------------- | --------------------------------- |
| **Tools**  | Atomic capabilities    | Individual operations Claude can execute (e.g., reading files, running commands)   | A worker’s “hammer, wrench”       |
| **Skills** | Programmatic knowledge | Combine multiple Tools into standardized workflows                                 | A worker’s “blueprints”           |
| **MCP**    | External interface     | Standard protocol for connecting to third-party services (e.g., GitHub, databases) | A worker’s “outsourced suppliers” |

**Example**:

```
Task: Generate a PR and notify the team

Tools used:
- read_file (read code changes)
- bash (run git diff)
- write_file (generate PR description)

Skill used:
- pr-generator (defines the steps for "how to generate a high-quality PR")

MCP used:
- github-mcp (calls GitHub API to create PR)
- slack-mcp (sends notifications to a Slack channel)
```

#### 2. What is the difference between Skills and Prompts?

| Dimension           | Prompts                     | Skills                                                 |
| ------------------- | --------------------------- | ------------------------------------------------------ |
| **Form**            | Temporary text instructions | Persistent Markdown files                              |
| **Scope**           | Current conversation        | Reusable across sessions                               |
| **Structure**       | No enforced format          | Strict YAML Frontmatter + instruction section          |
| **Trigger method**  | Manually entered            | Automatically triggered via keywords or slash commands |
| **Version control** | Not traceable               | Managed via Git                                        |
| **Team sharing**    | Requires copy-paste         | Share by committing to repository                      |

**Example**:

```markdown
# Prompt (temporary instruction)
"Please help me check for security vulnerabilities in the code, focusing on SQL injection and hardcoded secrets"

# Skill (persistent capability)
.claude/skills/security-audit/SKILL.md
→ Defines a complete security audit workflow  
→ Can be triggered via /security-audit or "check vulnerabilities"  
→ Ensures all team members follow the same standards  
```


#### 3. What is the CLAUDE.md file? How is it related to Skills?

**CLAUDE.md** is a project-level configuration file used to store global context and conventions for the project. Its differences from Skills are:

| Feature           | CLAUDE.md                                            | Skills                              |
| ----------------- | ---------------------------------------------------- | ----------------------------------- |
| **Location**      | Project root directory                               | `.claude/skills/` directory         |
| **Content**       | Project background, build commands, coding standards | Specific task execution workflows   |
| **Load timing**   | Automatically loaded at session start                | Dynamically loaded on demand        |
| **Context usage** | Always consumes tokens                               | Only consumes tokens when triggered |
| **Use case**      | “What is this project?”                              | “How to accomplish a task?”         |

**How they work together**:
Skills can reference information from CLAUDE.md. For example, a deployment Skill can read build commands defined in CLAUDE.md.


### Usage Limitations

#### 4. Can Claude Code Skills be used offline?

**Partially, with limitations**:

**✅ Works offline**:

* Loading and parsing Skills (local file system operations)
* Skills that use local Tools (e.g., file read/write, shell commands)
* Skills that do not depend on MCP

**❌ Requires internet**:

* The Claude model itself (requires connection to the Anthropic API)
* Skills that depend on MCP servers (e.g., GitHub, Slack integrations)
* Operations requiring access to remote resources


#### 5. What programming languages does Claude Code support?

Claude Code is **language-agnostic** and supports all major programming languages:

**Fully supported** (rich ecosystem tools available):

* JavaScript/TypeScript, Python, Java, C#, Go, Rust, Ruby, PHP, Swift, Kotlin

**Well supported** (can read, write, and execute):

* C/C++, Scala, Elixir, Haskell, Dart, R, Julia, Perl

**Key points**:

* Skills can operate on any text file (including source code in any language)
* Execution depends on whether the required runtime is installed locally
* Availability of MCP servers may vary by language


#### 6. Can Skills be used in the free version?

**It depends on which version of Claude Code you are using**:

As of May 2026:

* **Claude Code CLI** (command-line tool): requires an Anthropic API key and is billed based on usage
* **Claude.ai web version**: the free tier has usage limits, while the Pro version has no such limits

**About the Skills feature itself**:

* Loading and parsing Skills are local operations and do not consume API quota
* However, executing Skills requires calling the Claude model, which consumes tokens

**Cost optimization tips**:

* Use concise Skill descriptions (reduce metadata token usage)
* Avoid including lengthy example code in Skills
* Use precise `triggers` to prevent accidental activation


#### 7. How many Skills can be loaded at once?

**Technical limits**:

| Dimension                  | Limit                                                  |
| -------------------------- | ------------------------------------------------------ |
| **Total number of Skills** | No hard limit, but recommended < 100                   |
| **Simultaneously active**  | Typically 1–3 (loaded on demand)                       |
| **Metadata scanning**      | All Skills are scanned at startup (50+ may slow down)  |
| **Context window**         | Limited by the model (Sonnet 4.5 supports 200K tokens) |

**Practical impact**:

```
10 Skills: no noticeable delay  
50 Skills: startup may take 1–2 seconds  
100+ Skills: recommended to organize into subdirectories and load on demand  
```

**Optimization strategies**:

* Group Skills into folders (e.g., `development/`, `deployment/`)
* Disable infrequently used Skills (prefix folder name with `.`)
* Keep the `description` field concise (< 50 words)


#### 8. Can Skills access local databases?

**Yes, but indirectly**:

**Method 1: Via shell commands**

```yaml id="db1"
# database-backup/SKILL.md
---
tools_required: ["bash"]
---

Steps:
1. Run `pg_dump mydb > backup.sql`  
2. Compress the backup file  
3. Upload to S3  
```

**Method 2: Via MCP servers**

```yaml id="db2"
# query-analytics/SKILL.md
---
tools_required: ["mcp:postgres"]
---

Steps:
1. Call postgres-mcp to query user activity  
2. Generate a visualization report  
```

**Method 3: Via scripts**

```yaml id="db3"
# data-migration/SKILL.md
---
tools_required: ["bash"]
---

Steps:
1. Run `python scripts/migrate_data.py`  
2. Validate the migration results  
```

**Security recommendations**:

* Do not hardcode database credentials in Skills
* Use environment variables or configuration files
* Add confirmation steps for operations on production databases

### Troubleshooting

#### 9. How to debug the “Skill Not Found” error?

**Common causes and solutions**:

**Cause 1: Folder name does not match the `id`**

```yaml
# ❌ Incorrect
Folder: .claude/skills/my-skill/
In SKILL.md: id: "my_skill"  # Underscore mismatch

# ✅ Correct
Folder: .claude/skills/my-skill/
In SKILL.md: id: "my-skill"
```

**Cause 2: Missing or incorrectly named SKILL.md file**

```bash
# Check if the file exists
ls .claude/skills/my-skill/SKILL.md

# Note: It must be uppercase SKILL.md, not skill.md or Skill.md
```

**Cause 3: YAML Frontmatter formatting error**

```yaml
# ❌ Incorrect (missing closing ---)
---
name: "My Skill"
id: "my-skill"

# ✅ Correct
---
name: "My Skill"
id: "my-skill"
---
```

**Cause 4: Skills not indexed**

```bash
# Manually refresh Skills
/reload-skills

# Or restart the Claude Code session
```

**Debugging steps**:

1. Run `/skills` to view the list of loaded Skills
2. Check file paths and naming
3. Validate YAML syntax (use an online YAML validator)
4. Review Claude Code logs (if available)


#### 10. Do you need to restart Claude Code after updating a Skill?

**It depends on what was updated**:

| Update Type                 | Restart Required | Refresh Method                               |
| --------------------------- | ---------------- | -------------------------------------------- |
| **Modify SKILL.md content** | No               | Takes effect automatically (on next trigger) |
| **Modify Frontmatter**      | Yes              | `/reload-skills` or restart                  |
| **Add new Skill**           | Yes              | `/reload-skills` or restart                  |
| **Delete Skill**            | Yes              | `/reload-skills` or restart                  |
| **Modify Resources files**  | No               | Takes effect automatically                   |

**Best practice**:

```bash
# After modifying a Skill
/reload-skills

# Verify the update
/skills      # Check the list
/my-skill    # Test trigger
```

**Note**: If you modify the `triggers` field, a refresh is required for changes to take effect.


#### 11. Will Claude Code automatically detect newly added Skills?

**Partially automatic, but with delays**:

**Automatically detected when**:

* Restarting the Claude Code session
* Running the `/reload-skills` command
* Switching to a different project directory

**Not automatically detected when**:

* Adding a new Skill during the current session (requires manual refresh)
* Pulling new Skills via `git pull` (requires manual refresh)

**Recommended workflow**:

```bash
# 1. Create a new Skill
mkdir -p .claude/skills/new-feature
vim .claude/skills/new-feature/SKILL.md

# 2. Manually refresh
/reload-skills

# 3. Verify
/skills  # You should see new-feature
```

**Team collaboration scenario**:

```bash
# Team member A commits a new Skill
git pull

# Team member B needs to manually refresh
/reload-skills
```


#### 12. What are common mistakes when using Skills?

**Mistake 1: Skill scope is too broad**

```yaml
# ❌ Poor design
name: "Project Helper"
description: "Helps with various project tasks"
# Problem: unclear purpose, easily mis-triggered

# ✅ Better design
name: "API Documentation Generator"
description: "Generate OpenAPI documentation from TypeScript code"
```

**Mistake 2: Trigger phrases are too generic**

```yaml
# ❌ Easily mis-triggered
triggers: ["fix", "check", "help"]

# ✅ Specific and clear
triggers: ["generate api docs", "create openapi spec"]
```

**Mistake 3: Hardcoding file paths in Skills**

```markdown
# ❌ Not portable
1. Read `/Users/john/project/config.json`

# ✅ Use relative paths
1. Read `config.json` from the project root directory
```

**Mistake 4: Forgetting to declare dependencies**

```yaml
# ❌ Missing tool declaration
---
name: "Deploy to AWS"
---
# Uses aws-cli in instructions but not declared

# ✅ Proper declaration
---
name: "Deploy to AWS"
tools_required: ["bash", "mcp:aws"]
---
```

**Mistake 5: Circular dependencies between Skills**

```markdown
# ❌ Circular dependency
# skill-a/SKILL.md
1. First run `/skill-b`

# skill-b/SKILL.md
1. First run `/skill-a`  # Infinite loop!

# ✅ Extract shared logic
# _shared/common-check/SKILL.md
1. Run common checks

# skill-a and skill-b both call /common-check
```

**Mistake 6: Over-reliance on context**

```markdown
# ❌ Assumes Claude remembers prior conversation
1. Use the config file discussed earlier...

# ✅ Be explicit
1. Read `.env.production` file  
2. Validate required environment variables: API_KEY, DATABASE_URL  
```

**Best practices to avoid pitfalls**:

* Each Skill should be self-contained
* Use clear trigger phrases to avoid ambiguity
* Include validation steps within the Skill
* For complex Skills, define test cases (describe expected behavior in the `description`)

