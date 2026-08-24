---
title: "Advanced Claude Code Guide: Complex Tasks, Performance Optimization & Extension Ecosystem"
description: "Advanced Claude Code guide covering Plan mode, Subagents, Git Worktrees, session management, Effort levels, CLAUDE.md, and extension ecosystem (Skills/Hooks/MCP/Plugins)."
date: 2026-08-15T08:42:22+08:00
draft: false

categories:
- AI

---

I've been using Claude Code for a while now. Starting from simple code modifications through conversations, I've gradually learned to handle more complex tasks. Recently, I took time to study some "advanced techniques" I had overlooked, and found there are quite a few features I wasn't using to their full potential.

This article isn't a complete tutorial, but more like my personal learning notes—recording features and experiences that made me think "I wish I'd known this earlier." It focuses on three areas: handling complex tasks, fine-tuning context and performance, and extending capabilities beyond the defaults.

If you're also using Claude Code but feel you haven't fully tapped into its potential, I hope these notes will give you some insights.

For the broader reason AI coding tools favor command-line workflows, first see [CLI vs GUI vs Skills](https://chloevolution.com/posts/cli-vs-gui-vs-skills/). This guide continues from that foundation into Claude Code's advanced execution and extension features.

---

## The Right Approach to Complex Tasks

When I first started using Claude Code, I basically just "told it what to do as I thought of it." This works fine for simple tasks, but with complex multi-step tasks, I'd often find myself halfway through realizing the direction was wrong, or having changed a bunch of files only to discover a better approach. I gradually learned that complex tasks need some "preparatory steps" and "safety mechanisms."

### Plan Mode: Plan First, Execute Later

#### What is Plan Mode

Claude Code's default workflow is "direct execution": you make a request, and it immediately starts modifying code. This approach is efficient for simple tasks, but can cause problems with complex ones—solution choices, file dependencies, and potential risks aren't sorted out upfront, and you only discover issues halfway through.

Plan mode is a "two-phase workflow":
1. **Planning Phase**: Claude first explores the codebase, designs solutions, lists steps, and writes the plan to a dedicated plan file
2. **Execution Phase**: After you confirm the plan, Claude implements it

The benefit of this approach is separating "thinking" from "doing," allowing you to spot problems before modifying code.

#### How to Enter Plan Mode

There are two ways:
1. **Claude proactively asks**: When it judges a task is complex enough, it will prompt asking whether to enter plan mode
2. **You explicitly request**: When presenting a task, clearly state it, for example:
   - "First create an implementation plan"
   - "Handle this requirement using plan mode"
   - "Don't start directly, give me a proposal first"
   - Or directly use the `/plan` command

If you want Claude to always plan for certain types of tasks, you can specify this in the project's `CLAUDE.md` file.

#### Why Plan Mode is Needed

I didn't really understand its value initially, until I wanted to add an export feature to a data analysis project with the requirement "support exporting both CSV and Excel formats." I let Claude start directly, and its implementation path was:

1. Add `/export` endpoint in the API layer
2. Write export logic in the service layer using `pandas.to_csv()` and `pandas.to_excel()`
3. Add export button to the frontend

It seemed reasonable, but halfway through I suddenly realized: some datasets in the project are quite large (hundreds of thousands of rows), and converting them directly in memory could cause OOM. Also, the existing query logic was scattered across multiple places, and when exporting they needed to be reassembled, but Claude's simplified logic was inconsistent with the actual queries.

By this point, 4 files had already been modified, making rollback troublesome.

Later I redid this requirement using Plan mode. Claude spent a few minutes exploring the code, then the Plan it produced pointed out:
- Existing query logic is in the `QueryBuilder` class, exports should reuse it rather than rewrite
- Large datasets need streaming export, recommend using `StreamingResponse`
- Excel export depends on `openpyxl`, need to check if it's installed first
- Solution comparison: synchronous export vs async task queue (ultimately chose sync+streaming because the project has no task queue infrastructure)

This Plan let me discover potential issues before starting work, and the final implementation went smoothly.

#### When Plan Mode is Worth Using

Not all tasks need planning; the key is judging whether "the benefit of planning ahead" outweighs "the cost of an extra step." Here's my comparison table:

| Task Characteristic | Recommend Plan Mode | Can Skip Plan, Do Directly |
|---------------------|---------------------|---------------------------|
| **File Count** | Need to modify 3+ files with dependencies between them | Single file modification, or multiple files but changes are independent |
| **Architectural Decisions** | Need to choose design patterns, tech solutions, which layer to place in | Implementation approach is clear, no branching choices |
| **Uncertainty** | Requirements are vague, multiple implementation paths | Requirements are clear, implementation path is unique |
| **Risk Level** | High-risk operations like big data processing, permission control, database migration | Low-risk changes like UI adjustments, copy changes |
| **Rollback Cost** | Hard to roll back if done wrong (multiple files changed, data changes involved) | Easy to roll back (local changes, no side effects) |

**Typical Scenario Examples:**

**Should Use Plan:**
- "Add user authentication system to project" (involves multi-layer architecture, security considerations)
- "Refactor database query module to support pagination" (performance-sensitive, affects multiple calls)
- "Implement export functionality supporting CSV/Excel" (solution selection, big data handling)

**Can Skip Plan:**
- "Change button text from 'Submit' to 'Confirm'" (single change)
- "Add a new environment variable to config file" (clear operation)
- "Fix spelling error" (local modification, zero risk)

Simply put: **If a task "costs a lot if done wrong" or "has multiple paths to choose from," it's worth planning first.**

#### What a Good Plan Should Include

Initially I thought a Plan was just listing TODOs, but later found the depth differs greatly. A good Plan should include:

- **Solution Comparison**: If there are multiple implementation paths, explain why you chose A over B (technical constraints? Cost considerations? Risk assessment?)
- **Risk Points**: Where might problems occur? What needs special attention? (Performance bottlenecks, compatibility, edge cases)
- **File Checklist**: Which files specifically to modify, what's the nature of each change (add/modify/delete)
- **Dependency Check**: Need to install new libraries? Need to modify configuration?

For example, I once asked Claude to add a caching layer to a project. The Plan it produced not only listed the files to modify, but also explained why Redis was chosen over local memory cache (because the project might deploy multiple instances later), and considerations for cache invalidation strategy (TTL + active invalidation). This kind of Plan lets me judge if the direction is right before execution, rather than discovering problems after implementation.

---

### Subagents: Delegation and Parallelization

#### What are Subagents

Subagent is Claude Code's "task delegation" mechanism. When you request Claude to handle a task in the main conversation, it can create one or more independent "sub-sessions" (subagents). Each subagent has full tool capabilities—can read files, search code, execute commands—and returns results to the main conversation after completion.

Key characteristics of Subagents:
- **Independent Context**: Can't see main conversation history, preventing the main conversation from being polluted by large amounts of intermediate results
- **Parallel Execution**: Multiple subagents can work simultaneously without interfering with each other
- **Result Summarization**: Subagents only return final conclusions, lengthy exploration processes don't enter the main conversation

#### How to Use Subagents

Two ways to trigger:
1. **Claude's autonomous judgment**: When it discovers a subtask suitable for independent handling, it will automatically spawn a subagent
2. **Your explicit request**: When presenting a task, specify it, for example:
   - "Please spawn a subagent to search for all places calling function X"
   - "Use subagents to run tests and check documentation in parallel"

Note: You can't directly "enter" a subagent conversation; it's created and managed by Claude in the main conversation.

#### Why Subagents are Needed

Initially I didn't really understand their value—"If I can just ask Claude directly, why have it ask another Claude?" Until one time I asked Claude to help me analyze a large project's dependency relationships.

The main conversation quickly filled up with search results, file lists, dependency trees. When I wanted to discuss "what problems were discovered," I had to scroll up for a long time to find previous discussions. Even worse, these intermediate results occupied a lot of context, making subsequent conversations expensive.

Later I learned to proactively request using subagents: have it spawn a subagent specifically for "dependency analysis," and the main conversation only receives the final summary report ("found 3 circular dependencies, 5 unused dependencies"), with process details staying in the subagent and the main conversation staying clean.

**Typical Use Cases:**

| Scenario | Why Suitable for Subagent |
|----------|---------------------------|
| **Large-scale code search** | Search results might have dozens or hundreds of entries, filling the main conversation; subagent filters and returns only key findings |
| **Parallel independent tasks** | For example running tests + checking documentation consistency simultaneously, both are independent, parallel is faster |
| **Exploratory research** | Like "investigate which third-party libraries the project uses," research process is lengthy but you only need the conclusion |
| **Dangerous experiments** | Combined with `isolation: "worktree"`, let subagent make high-risk changes in an isolated environment |

#### Keys to Using Subagents Well

**1. Writing Good Prompts is Important**

Prompts for subagents differ from direct conversation because they **can't see main conversation history**. What I've learned:

- **Context must be self-contained**: Don't say "help me look at this problem" (it doesn't know what "this problem" is), but rather "search in the `src/` directory for all places calling `legacyAuth()` function, list file paths and line numbers"
- **Specify deliverable format clearly**: Want a list? Statistics? Code examples? Make it clear
- **Control operation scope**: If only analysis is needed, explicitly say "read-only, don't modify files"; if code can be changed, specify the boundaries of changes

**2. Judging Parallel vs Serial**

It's not "parallel whenever possible"—you need to consider task dependencies and integration costs:

| Judgment Dimension | Suitable for Parallel | Suitable for Serial |
|--------------------|----------------------|---------------------|
| **Task Dependency** | Tasks A and B are completely independent, no interdependence | Task B needs results from task A |
| **Result Integration** | Results can be directly displayed side by side, no cross-analysis needed | Results need joint analysis to be meaningful |
| **Execution Time** | Both tasks are time-consuming, parallel saves significant time | Tasks are quick, parallel coordination cost is actually higher |

Once I had two subagents separately analyze frontend and backend performance issues, only to discover many bottlenecks were actually caused by frontend-backend interactions (API call frequency, data transfer volume). After splitting the analysis, I had to integrate it myself, which actually increased workload. In such cases, serial or doing it directly in the main conversation is more appropriate.

**3. When NOT to Use Subagents**

- **Task is very simple**: Reading a file, changing a few lines of code—doing it directly is faster than delegation
- **Frequent interaction needed**: If you expect multiple rounds of follow-up questions, subagents aren't suitable (they're one-shot tasks)
- **Highly context-dependent**: If the task heavily depends on main conversation history context, pulling it out requires lots of explanation

---

### Git Worktrees: Safe Sandbox Experimentation

#### What are Git Worktrees

Git Worktrees is a Git feature that allows you to maintain multiple working directories under the same repository, with each directory working on a different branch. In Claude Code, this feature is wrapped for easier use, letting you quickly create a "parallel space" for experimental changes.

Key characteristics:
- **Isolated Environment**: Each worktree has an independent working directory and branch, no interference
- **Shared Repository**: Underlying shares the same `.git` directory, no need to clone the entire project repeatedly
- **Switch Anytime**: Can freely switch between main branch and worktree, no need to stash or commit

#### How to Use Git Worktrees

Using worktrees in Claude Code is simple:

```bash
/worktree <worktree-name>
```

For example, `/worktree refactor-auth` will create a new worktree and automatically switch into it.

Exiting worktree and cleanup:
- Use `exit worktree` command
- Choose `keep` (retain code for later merging) or `remove` (delete entire worktree)

#### Why Git Worktrees are Needed

Previously I had Claude modify code directly on branches, and several times encountered situations like:
- Had Claude try an "aggressive" refactoring approach, halfway through felt it wasn't working, wanted to roll back but had already modified dozens of files, `git reset` was troublesome
- Was working on a feature, suddenly needed to fix an urgent bug, but current changes weren't ready to commit, had to stash, switch branches, fix bug, switch back, pop stash
- Wanted to compare actual effects of two implementation approaches but didn't want to keep switching branches and rerunning builds

Later discovered Git Worktrees perfectly solve these problems—it's like giving you a "parallel space" where you can experiment freely, delete it directly if it fails, with main branch completely unaffected.

| Scenario | How to Use Worktree | Benefit |
|----------|---------------------|---------|
| **Dangerous Refactoring** | Try large-scale refactoring in worktree | If it fails just remove, if successful merge back to main branch, zero risk |
| **A/B Solution Comparison** | Create two worktrees, implement different solutions separately | Can run, test, compare actual effects, not just on paper |
| **Temporary Task Switching** | Continue developing feature in worktree, handle urgent bug in main branch | No need to stash, contexts of two tasks completely isolated |
| **Experiment with Subagent** | `isolation: "worktree"` lets subagent work in isolated environment | High-risk operations won't pollute main branch, automatic cleanup after experiment |

#### Usage Recommendations

**1. Clarify Experiment Purpose**

Before entering worktree, think through:
- What am I trying to verify? (Performance improvement? Code maintainability? New approach feasibility?)
- What's the success criteria? (Tests pass? Performance metrics met?)
- What if it fails? (Give up directly? Or adjust approach?)

Avoid aimlessly modifying things in the worktree, ending up not even knowing what was changed.

**2. Clean Up Promptly**

After experiment ends, decide immediately:
- **Keep**: Successful approach verified, ready to merge back to main branch
- **Remove**: Failed attempts, temporary tests, already-merged changes

Don't accumulate a pile of abandoned worktrees—they take up disk space and cause confusion.

**3. Utilize Isolation Feature**

When you have Claude use subagents for high-risk operations, you can explicitly request:
> "Use subagent in worktree to try refactoring the auth module, keep if tests pass, otherwise discard"

This way the subagent's experimental changes are isolated in the worktree, not affecting your main work environment.

---

## Fine-tuning Context and Performance

After using Claude Code for a while, I started noticing the importance of context management and performance tuning. Sometimes conversations become "sluggish," sometimes Claude's response quality suddenly drops—these problems are often related to context pollution or improper effort level settings.

### Session Management: Keeping Conversations Clear

Session management refers to how to maintain, clean up, and continue your conversation context with Claude. Each conversation accumulates historical messages, which are both the basis for Claude to understand your needs and a potential source of interference and cost:

- **Context Window**: The length of conversation history Claude can "remember" (though large, not infinite)
- **Context Pollution**: Error information, outdated assumptions, irrelevant details in conversation history interfering with current tasks
- **Context Cost**: Longer history means higher token consumption and response latency

**Core Commands**:
- `/clear`: Clear current session, start fresh conversation
- `/continue`: Continue previous conversation's context in new session (cross-session memory)

#### When to Use /clear

Initially I almost never used `/clear`, thinking "the more history, the better Claude understands my project." But later found that in some situations, history actually becomes a burden.

My current judgment criteria:

| Scenario | Description | Should Clear? |
|----------|-------------|---------------|
| **Repeated Mistakes** | Claude repeatedly gives same wrong solution even after you've corrected it | ✅ Context likely has misleading information |
| **Topic Drift** | Conversation jumped from task A to B to C, history became messy | ✅ New task starting fresh is clearer |
| **Response Slows** | Claude's replies noticeably slower, or starts "thinking" for a long time | ✅ Context too long affecting performance |
| **Complete Task Switch** | Switching from frontend development to database optimization, completely unrelated | ✅ Old context has no value |
| **Solution Overturned** | Previously discussed solution has been abandoned, but history is full of those discussions | ✅ Avoid Claude referencing wrong solution |
| **Deep Work on Same Project** | Continuously iterating on same module, historical conversations are all valuable context | ❌ Keeping history helps understanding |
| **Need Project-wide Perspective** | Need Claude to remember previously discussed architectural decisions and conventions | ❌ Clearing loses project knowledge |

**For scenarios where you shouldn't clear, how to handle context issues:**

When you need to maintain project knowledge but worry about context being too long, better approaches are:
- **Use CLAUDE.md**: Write important architectural decisions and project conventions into the `CLAUDE.md` file (see part three), so even after clearing, Claude can get project knowledge by reading the file
- **Use Memory**: Claude Code has persistent memory functionality, can store repeatedly mentioned project information and user preferences in Memory, retained across sessions
- **Proactive Summarization**: Before clearing, have Claude summarize current key decisions and progress, then paste the summary back after clearing as the start of the new conversation

#### When to Use /continue

The value of `/continue` is **cross-session continuation**. When you've closed Claude Code or switched working directories but later want to continue previous discussions, using `/continue` lets Claude "recall" the previous context.

Typical scenarios:
- **Continue work across days**: Discussed refactoring solution yesterday, want to continue implementation today
- **Return after switching directories**: Temporarily went to another project to handle things, want to continue previous task after returning
- **Recovery after unexpected interruption**: Claude Code crashed or network disconnected, want to restore progress after restart

Note: `/continue` isn't omnipotent; it depends on previous session records. If you proactively `/clear`ed, you can't continue back.

#### Context vs Memory

Easy to confuse: what's the difference between session context and Memory?

**What is Memory:**

Memory is Claude Code's persistent memory system, stored as files in the project directory (usually in `.claude/projects/<project-name>/memory/`). When you explicitly tell Claude "remember this," or certain information repeatedly appears, Claude will write it to Memory files, which can be read in subsequent sessions.

**Context vs Memory Differences:**

| Dimension | Session Context | Memory |
|-----------|----------------|---------|
| **Lifecycle** | Current conversation or adjacent few conversations | Long-term storage, across multiple sessions |
| **Content Nature** | Specific task discussions, intermediate results, temporary decisions | Project knowledge, user preferences, repeatedly verified experience |
| **When to Clean** | Task switching, context pollution, performance degradation | When information is outdated or incorrect |
| **Query Cost** | Free (already in conversation) | Needs explicit Memory file reading |
| **Storage Location** | In memory, restored via `/continue` after closing session | In file system, permanently saved |

Simply put: **Context is short-term memory, Memory is long-term memory.**

**When to Use Memory:**
- Project architectural conventions ("We uniformly use Repository pattern to access database")
- User preferences ("Test files uniformly placed in `__tests__` directory")
- Repeatedly stepped-on pitfalls ("This API has rate limit, needs retry logic")

This way even after `/clear`ing the session, important project knowledge remains in Memory.

---

### Effort Levels: Balancing Speed and Depth

Effort level controls Claude's "thinking depth" when answering questions. Claude Code supports four levels:
- **low**: Quick response, suitable for simple tasks
- **medium**: Balance speed and quality
- **high**: Deep thinking (default)
- **max**: Deepest thinking and reasoning, suitable for most complex problems

Can switch via `/effort <level>` command, or temporarily specify when asking questions.

#### Differences Between Four Effort Levels

Initially I thought effort only affected speed, but later discovered the differences go beyond that:

| Dimension | Low | Medium | High (Default) | Max |
|-----------|-----|--------|----------------|-----|
| **Response Speed** | Very fast | Moderate | Slower | Slowest |
| **Thinking Depth** | Shallow analysis | Regular reasoning | Deep reasoning, multi-angle weighing | Deepest reasoning, exhausting possibilities |
| **Suitable Tasks** | Simple modifications, queries, formatting | Medium complexity development tasks | Architectural design, complex refactoring, difficult debugging | Extremely complex problems, critical decisions |
| **Cost** | Low | Medium | High | Highest |
| **Error Prone** | Not for simple tasks, easy for complex ones | Balanced | Handles complex tasks well | Rarely errors |

#### How to Choose Effort Level

My experience is to choose by **task nature** rather than task size:

**Low effort suitable for:**
- Code formatting, variable renaming
- Simple queries ("Where is this function defined?")
- Writing test cases (logic already clear, just writing code)
- Documentation generation, adding comments

**Medium effort suitable for:**
- Daily development tasks (not too complex feature implementation)
- Bug fixes (problem already located)
- Code review (routine checking)
- Simple refactoring

**High effort suitable for (default, most scenarios):**
- Architectural decisions ("Should we use microservices or monolith?")
- Complex refactoring (spans multiple modules, wide-reaching impact)
- Difficult debugging (problem cause unclear)
- Performance optimization (need to weigh multiple solutions)
- Plan mode (planning itself needs deep thinking)

**Max effort suitable for:**
- Critical architectural decisions (affecting long-term tech stack choices)
- Extremely complex bugs (involving multiple system interactions, hard to reproduce)
- Security vulnerability analysis (need to consider various attack vectors)
- Production incident analysis (need to exhaust all possible causes)

#### Cost Awareness

High and max effort have higher costs (time and tokens), need to weigh based on scenario. My strategy:
- **Exploration phase** (uncertain direction): use high or even max effort, time spent thinking is worth it
- **Execution phase** (solution determined): drop to medium or low, implement quickly
- **Iterative optimization** (minor adjustments): use low, keep development flowing
- **Critical decisions** (far-reaching impact): don't hesitate to use max effort, avoid directional errors

Sometimes I dynamically adjust within the same task: first use high/max effort to determine solution, then switch to medium/low to execute specific code modifications.

Since default is already high effort, I don't need to manually adjust for most tasks. Only drop to low/medium when "truly very simple," or raise to max for "extremely complex" problems.

---

## Persisting and Reusing Project Knowledge—CLAUDE.md

Previously mentioned session management and Memory, but there's an even more important persistence mechanism: **CLAUDE.md**. If Memory is "personal notes," then CLAUDE.md is "project documentation"—it's a project knowledge base shared by the entire team.

#### What is CLAUDE.md

CLAUDE.md is a Markdown file placed in the project root directory that Claude Code automatically reads at the start of each conversation. You can write any project information you want Claude to "always remember": architectural decisions, development conventions, special context, solutions to common problems, etc.

Key characteristics:
- **Auto-load**: Claude automatically reads on startup, no manual reminder needed
- **Version Control**: Can be committed to Git, team members share same project knowledge
- **High Priority**: Takes precedence over session context and Memory, Claude strictly follows instructions within it
- **Persistently Effective**: Not lost due to `/clear`

#### Why CLAUDE.md is Needed

Once in a multi-person collaborative project I encountered a problem: every time a new colleague used Claude Code, project-specific conventions had to be re-explained ("We use Repository pattern," "Test files uniformly in `__tests__` directory," "API error codes use four-digit numbers"). And even for myself, after `/clear`ing a few days later, had to explain again.

Later I created CLAUDE.md and wrote these conventions in it. From then on, no matter who, no matter when using Claude Code, it could "remember" these rules—newcomers and veterans get the same complete project context.

#### What Should Go in CLAUDE.md

**Content suitable for CLAUDE.md:**

| Type | Specific Content | Example |
|------|------------------|---------|
| **Architectural Conventions** | Project tech stack, design patterns, layered structure | "Uses Clean Architecture, Domain layer doesn't depend on any external frameworks" |
| **Development Standards** | Code style, naming rules, file organization | "Component filenames use PascalCase, hooks filenames use camelCase" |
| **Special Context** | Project's unique background, historical baggage, tech debt | "Auth module migrating from JWT to OAuth2, two sets of logic coexist" |
| **Common Pitfalls** | Easy-to-step-on traps, performance bottlenecks, known bugs | "ORM's eager loading has bug, must manually join" |
| **Workflow Guidance** | Specific task handling processes, tool usage | "When adding new API, remember to sync update OpenAPI spec" |
| **External Dependency Notes** | Special usage of key third-party libraries, version restrictions | "Redis client must use 4.x, 5.x has compatibility issues" |

**Content that should NOT go in CLAUDE.md:**

- **Rapidly aging information**: Current TODOs, ongoing tasks, temporary decisions (these should be in sessions or plan files)
- **Overly specific implementation details**: Specific implementation of a function (code itself is documentation)
- **Personal preferences**: Individual developer habits (should be in personal Memory)
- **Sensitive information**: Passwords, API keys, internal URLs (should be in config files or environment variables)

#### An Actual CLAUDE.md Example

```markdown
# Project Context

## Tech Stack
- **Backend**: Python 3.11 + FastAPI + SQLAlchemy
- **Database**: PostgreSQL 14
- **Cache**: Redis 6.x (Note: Must use 6.x, 7.x's ACL feature incompatible with our deployment environment)
- **Testing**: pytest + httpx

## Architectural Conventions

### Repository Pattern
All database access must go through Repository layer, direct SQL not allowed in Service or Controller.

### Error Handling
- API error codes uniformly use four-digit numbers (1xxx client errors, 2xxx server errors)
- All exceptions must be caught at Controller layer and converted to standard error responses

## Development Standards

### File Organization
```
src/
├── domain/       # Domain models and business logic
├── repository/   # Data access layer
├── service/      # Application service layer
├── api/          # API routes and controllers
└── tests/        # Test files (mirrors src directory structure)
```

### Testing Requirements
- All API endpoints must have integration tests
- Repository layer must have unit tests (mock database)
- Test file naming: `test_<module_name>.py`

## Special Context

### Auth Module Migration in Progress
Auth module migrating from JWT to OAuth2 (started 2024-08). Currently two sets of logic coexist:
- `/api/v1/auth/*` still uses JWT (compatible with old clients)
- `/api/v2/auth/*` already switched to OAuth2
- When modifying auth logic, confirm clearly which version

### Known Performance Bottleneck
`/api/v1/users` endpoint performance degrades noticeably with >10k users, cause is N+1 queries.
Temporary solution: Added Redis cache (TTL 5min).
Long-term solution: Refactor to pagination + eager loading (in backlog)

## Common Task Guidance

### Adding New API Endpoint
1. Create route under `api/routes/`
2. Implement business logic under `service/`
3. Add data access method under `repository/` (if needed)
4. Update `openapi.yaml`
5. Add integration test under `tests/api/`

### Database Migration
Using Alembic:
```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```
Note: Migration scripts must undergo code review before merging
```
```

#### How to Maintain CLAUDE.md

**1. Update as Project Evolves**

CLAUDE.md isn't a write-once-and-done document; it should be continuously updated as the project evolves:
- After architectural refactoring, update architectural conventions
- When discovering new common pitfalls, supplement to documentation
- When tech debt is paid off, delete related notes

**2. Keep Concise and Effective**

Don't treat CLAUDE.md as a knowledge base to pile everything into. For each piece of information, ask yourself:
- Does Claude need this information to work correctly?
- Without this information, might Claude make mistakes?
- Is there a better place for this information (like code comments, README, Wiki)?

Only keep "high-value, high-frequency use" information.

**3. Team Collaboration**

If it's a team project:
- Include CLAUDE.md in code review process
- When new members ask "why do it this way," consider whether it should go in CLAUDE.md
- Regular reviews (like each Sprint), delete outdated content

#### CLAUDE.md vs Memory vs Session Context

The positioning and use cases of the three:

| Dimension | CLAUDE.md | Memory | Session Context |
|-----------|-----------|--------|-----------------|
| **Scope** | Entire project, shared by everyone | Individual user's personal memory in this project | Current conversation |
| **Lifecycle** | Permanent (unless manually deleted) | Long-term (cross-session) | Short-term (current session) |
| **Version Control** | ✅ Committed to Git | ❌ Local file | ❌ Not persisted |
| **Typical Content** | Architectural conventions, development standards, project background | Personal preferences, personally encountered pitfalls | Current task discussions, temporary decisions |
| **When to Use** | Project knowledge everyone needs to know | Personal long-term preferences and experience | Specific details of current task |

**Usage Principles:**
- **Team Consensus** → CLAUDE.md
- **Personal Experience** → Memory
- **Temporary Discussion** → Session Context

## Extension Ecosystem: Breaking Through Default Capability Boundaries

Claude Code itself is already powerful, but through extension mechanisms can further break through capability boundaries. Currently there are four main extension methods: **Skills**, **Hooks**, **MCP**, **Plugins**.

### Comparison of Four Extension Methods

Let's first establish an overall understanding:

| Extension Method | Positioning | Learning Cost | Flexibility | Typical Scenarios |
|------------------|-------------|---------------|-------------|-------------------|
| **Skills** | Pre-built capability packages, ready to use | Low (just know the commands) | Low (use as designed) | SEO audits, security reviews, code reviews |
| **Hooks** | Automation triggers | Medium (need to write shell scripts) | Medium (can customize scripts) | Pre-commit checks, auto-format on file save |
| **MCP** | External tool integration | Medium (need to configure servers) | High (can access any API) | Connect databases, call third-party APIs, read external data |
| **Plugins** | Functionality enhancement modules | Low to Medium | Medium to High | Enhance existing features, add new tools |

### Skills: Pre-built Capability Packages

Skills are "pre-built capability packages" provided by Claude Code official or community. Each skill encapsulates a complete workflow. For example, the `/seo` skill can do complete SEO audits, the `/review` skill can do code reviews.

Usage is simple:
```
/skill-name [parameters]
```

#### When to Use Skills

Skills are suitable for **standardized, repetitive tasks**. Judgment criteria:
- Does this task have clear processes and checklist items?
- Does this task need to be done repeatedly?
- Is there a ready-made skill in the community?

If all three questions are "yes," using a skill is more efficient than manually describing requirements each time.

### Hooks: Workflow Automation

Hooks are "event triggers"—when specific events occur (like file save, code commit), automatically execute your preset scripts. Similar to Git hooks, but with broader scope.

Common hook types:
- **pre-commit**: Execute before git commit
- **post-edit**: Execute after file editing
- **on-save**: Execute when file is saved

#### Hook Use Cases

**Scenario 1: Auto-format Code**

I configured a `post-edit` hook that automatically runs `black` after Claude edits Python files:

```json
{
  "hooks": {
    "post-edit": {
      "command": "black {file}",
      "filePattern": "*.py"
    }
  }
}
```

This way after Claude modifies code, formatting is automatically done, no need to manually run formatter.

**Scenario 2: Pre-commit Checks**

Automatically run linter and tests before commit:

```json
{
  "hooks": {
    "pre-commit": {
      "command": "npm run lint && npm test"
    }
  }
}
```

If checks fail, commit will be blocked, avoiding submitting problematic code.

#### Hooks vs Manual Execution

| Dimension | Hooks | Manual Execution |
|-----------|-------|------------------|
| **Trigger Method** | Automatic (event-driven) | Need to remember to manually run |
| **Consistency** | Executes every time, won't miss | Easy to forget or skip |
| **Suitable Scenarios** | Repetitive, rule-based checks | Occasionally needed operations |
| **Configuration Cost** | Need to configure hook | No configuration needed |

**Usage Suggestions:**
- Configure "easy to forget but important" checks as hooks (formatting, linting, testing)
- Don't overuse hooks, otherwise every operation waits for a bunch of scripts to finish

### MCP: External Tool Integration

MCP (Model Context Protocol) is Claude Code's standard protocol for connecting external tools and data sources. Through MCP, Claude can:
- Query databases
- Call third-party APIs (GitHub, Jira, Notion, etc.)
- Read external file systems
- Execute complex system operations

#### MCP Use Cases

**Scenario 1: Database Queries**

After installing MCP database server, Claude can directly query databases:
> "Check the 10 most recently registered users in the users table"

Claude will connect to database through MCP, execute SQL, return results.

**Scenario 2: Third-party API Integration**

For example with GitHub MCP, Claude can:
- "List this repository's open issues"
- "Create a PR"
- "Check CI status"

**Scenario 3: DataForSEO (SEO Data)**

If DataForSEO MCP is installed, Claude can get real-time SEO data:
- Keyword search volume and difficulty
- SERP analysis
- Competitor rankings

#### MCP vs Other Extension Methods

MCP's unique value is in **connecting external data sources**. Skills and Hooks can only operate on local projects; MCP lets Claude "see" the world outside the project.

**When to Use MCP:**
- Need to access external APIs or databases
- Need real-time data (not static information in local files)
- Need cross-system collaboration (codebase + issue tracker + CI/CD)

### Plugins: Functionality Enhancement

Plugins are modules that extend Claude Code's core functionality. Unlike Skills, Plugins lean more toward "enhancing tool capabilities" rather than "providing workflows."

**Common Plugin Types:**
- Editor integration (VS Code, JetBrains, etc.)
- New file format support
- Custom tools and commands

Easy to confuse is the difference between Plugins and Skills:

| Dimension | Skills | Plugins |
|-----------|--------|---------|
| **Positioning** | Pre-built workflows (complete tasks) | Functionality enhancement (extend tool capabilities) |
| **Invocation Method** | `/skill-name` command | Runs in background or enabled via configuration |
| **Examples** | `/review` (code review process) | VS Code plugin (editor integration) |

### How to Choose Extension Method?

When you want to extend Claude Code's capabilities, choose according to this decision tree:

```
Need to extend capabilities
├─ Is it a standardized task?
│  ├─ Yes → First look for Skills
│  └─ No → Continue
├─ Need automated execution?
│  ├─ Yes → Use Hooks
│  └─ No → Continue
├─ Need external data/APIs?
│  ├─ Yes → Use MCP
│  └─ No → Continue
└─ Need to enhance tool itself?
   └─ Yes → Use Plugins
```

**Recommendations:**
1. **Use Skills first**: Use ready-made ones if available, don't write your own
2. **Hooks for automation**: Configure repetitive manual operations as hooks
3. **Add MCP as needed**: Only add external integrations truly needed, don't be greedy
4. **Plugins as needed**: Unless there's clear tool enhancement need, no rush to install

---

This note records some "advanced techniques" I gradually learned while using Claude Code. Reviewing the key points:

**The Right Approach to Complex Tasks:**
- Plan mode: Plan first then execute for complex tasks, avoid rework
- Subagents: Delegate independent tasks, keep main conversation clean
- Git Worktrees: Safe experimental environment, discard directly if fails

**Fine-tuning Context and Performance:**
- Session management: Know when to `/clear`, use Memory to persist important information
- Effort levels: Choose thinking depth based on task nature (default high is already enough)

**Persisting Project Knowledge:**
- CLAUDE.md: Team-shared project knowledge base, every conversation has complete context

**Extension Ecosystem:**
- Skills solve standard tasks, Hooks implement automation, MCP connects external world, Plugins enhance tools

These techniques aren't meant to be used all at once, but gradually mastered as usage deepens. My suggestion: first get Plan mode and CLAUDE.md working (these two have the biggest benefits), then gradually explore other features based on actual needs.

Hope these notes help you. If you're also using Claude Code, welcome to share your usage experience.
