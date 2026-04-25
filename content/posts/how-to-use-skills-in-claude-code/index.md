---
title: "How to Use Skills in Claude Code?"
date: 2026-04-25T09:23:34+08:00
draft: false

categories:
- AI
---

Claude Code is an agentic command-line tool introduced by Anthropic, and **Skills** are its core extension mechanism.

Simply put, **Skills are packaged sets of instructions, scripts, and resources** that teach Claude how to perform specific tasks in a standardized way.

## What Are Claude Code Skills?

In Claude Code, Skills function like “professional plugins” or **SOPs (Standard Operating Procedures)** added to AI.

* **Essence**: They are Markdown-based instructions stored in specific folders, sometimes including executable scripts.
* **Difference from Projects**: “Claude Projects” typically refer to a feature in the Claude.ai web app, where you can upload documents, code files, and technical standards into a Project and define “Custom Instructions.” Projects usually provide **static background knowledge** (e.g., “this is our API documentation”), whereas Skills provide **procedural knowledge** (e.g., “generate a PR description following these 5 steps”).
* **Core value**: Eliminates the need to repeatedly input the same preferences, workflows, or domain knowledge in every conversation.

## The Functional Architecture of Claude Code

Before understanding how Claude Code Skills work, it’s important to first understand the overall system architecture.

Claude Code’s capabilities are primarily driven by the following **three technical modules**:

### 1. Native System Tools

These are built-in low-level capabilities that allow Claude to directly interact with your local environment.

* **File system operations**: Includes reading, searching (`grep`), editing, and creating files.
* **Terminal execution**: Claude can run commands directly in your shell (e.g., `git`, build commands, or test suites).
* **Permission model**: It operates within constrained scopes using read-only or read-write permissions.


### 2. Project Context Configuration File (`CLAUDE.md`)

This is a file-based local configuration mechanism used to define project-specific rules.

* **Environment definition**: Specifies build systems (e.g., `npm`, `go build`) and test commands.
* **Constraint rules**: Stores coding styles, library preferences, or architectural decisions to reduce deviation in AI-generated code.
* **Automation guidance**: When entering a directory, Claude first reads this file to understand “how to operate within the project.”


### 3. MCP Standard Protocol (Model Context Protocol)

This is a standardized open protocol for integrating external services.

* **Interoperability**: Extends AI capabilities by connecting to MCP servers (e.g., GitHub, Slack, databases).
* **Dynamic discovery**: Claude queries connected MCP servers to discover available remote functions and resources based on task needs.
* **Decoupled design**: Allows adding new capabilities without modifying Claude Code’s core.

| Component        | Attribute            | Data Flow                    | Problem Solved                                    |
| :--------------- | :------------------- | :--------------------------- | :------------------------------------------------ |
| **Native Tools** | Built-in functions   | Bidirectional (local system) | “How do I operate files and the command line?”    |
| **CLAUDE.md**    | Static configuration | One-way (input to AI)        | “What are this project’s standards and commands?” |
| **MCP Protocol** | External plugins     | Bidirectional (remote APIs)  | “How do I access external data or services?”      |


## How Claude Code Skills Work

Claude Code Skills are **file-system-based declarative instruction sets**.

### 1. Physical Form: Structured Markdown

In Claude Code, a Skill typically appears as a folder containing a `SKILL.md` file. Its structure is strictly defined:

* **Frontmatter (metadata)**: YAML at the top defining the Skill’s name, description, trigger phrases, and required permissions.
* **Instructions**: The core section. Not just a prompt, but an **SOP** defining algorithmic logic or step-by-step procedures.
* **Resources**: The folder may include reference code, schema definitions, or scripts used during execution.

![claude-code-skills-markdown-example](claude-code-skills-markdown-example.png)

### 2. Runtime Mechanism: Meta-Tool Pattern

Claude Code processes Skills using **Progressive Disclosure**:

* **Discovery phase**: At startup, Claude reads only summary metadata (usually 30–50 tokens) of all Skills—treated as “meta-tools.”
* **On-demand loading**: When a request matches a Skill’s trigger or is deemed relevant, Claude uses an internal `load_skill` tool to inject the full instructions into the context window.
* **Advantage**: This saves context bandwidth and prevents performance degradation caused by loading unnecessary instructions.

### 3. Technical Layering: What Does a Skill Actually Do?

To fully understand Skills, they must be distinguished from other components:

| Component     | Technical Nature                    | Problem Solved                | Analogy                   |
| :------------ | :---------------------------------- | :---------------------------- | :------------------------ |
| **MCP**       | Protocol/API (JSON-RPC)             | External capabilities         | Human “hands”             |
| **Skills**    | **Procedural knowledge** (Markdown) | Task workflows and strategies | Human “expertise”         |
| **CLAUDE.md** | Static config                       | Project context               | Human “short-term memory” |


### 4. Triggering and Interaction

In the terminal interface, Skills manifest as:

* **Slash commands**: You can explicitly load a Skill using `/skill-name`.
* **Intent matching**: If you type “help me refactor this API,” Claude may automatically detect and activate a relevant Skill like `refactor-logic`.


## How to Use Claude Code Skills

Claude Code operates through an **Agentic Loop**:

1. **Intent recognition**: Claude scans available Skills when you input a request.
2. **Dynamic loading (Progressive Disclosure)**:

   * It does **not** load all Skills at once.
   * It only loads relevant Skills when needed.
3. **Execution loop**:

   * **Gather context**: Reads files and Skill instructions.
   * **Take action**: Executes commands, edits files, or calls MCP tools.
   * **Validate results**: Skills often include validation steps (e.g., linting or tests).
4. **Memory & persistence**: Claude generates “Auto-memory” and stores key rules in `CLAUDE.md`.


## How to Create or Add Claude Code Skills

A Skill is essentially a Markdown folder following a defined schema.

### 1. Define Storage Location

Claude Code looks for Skills in two locations:

* **Global Skills**: `~/.claude/skills/`
* **Project-specific Skills**: `[project root]/.claude/skills/`

### 2. Create the Folder Structure

Each Skill must be its own folder. Example:

```bash
mkdir -p .claude/skills/security-audit
touch .claude/skills/security-audit/SKILL.md
```

### 3. Write `SKILL.md` (Core Definition)

The file must include valid YAML Frontmatter.

**Example template:**

```markdown
---
name: "Security Audit"
id: "security-audit"
description: "Scan code for hardcoded secrets, SQL injection risks, and outdated dependencies."
triggers: ["audit security", "check vulnerabilities", "scan for secrets"]
tools_required: ["grep", "ls", "read_file", "mcp:github-advisory-database"]
version: "1.0.0"
---

# Instructions

When executing this skill, follow these steps:

1. **Static scan**: Use `grep` to search for keywords like "key", "secret", "password".
2. **Dependency analysis**: Read `package.json` or `requirements.txt` and check vulnerabilities via MCP.
3. **Logic review**: Ensure parameterized queries are used.
4. **Output report**: Generate `SECURITY_REPORT.md`.
```


### 4. Load and Refresh

* **Auto-indexing**: Restart Claude Code to re-scan Skills.
* **Manual refresh**: Use `/reload-skills`.


### 5. Verify the Skill

1. Use `/skills` to check if it appears
2. Test trigger phrases (e.g., “check vulnerabilities”)
3. Claude should respond and execute the defined steps


### Key Technical Considerations

* **Atomicity**: Each Skill should solve a single, repeatable workflow problem.
* **Tool binding (`tools_required`)**: Missing MCP tools will trigger installation prompts.
* **Dynamic injection**: Unlike `CLAUDE.md`, Skill instructions are only loaded when triggered, saving context space.
