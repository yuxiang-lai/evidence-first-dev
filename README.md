# Evidence-First Dev / 证据优先开发

> 面向 AI 编程代理的第一性原理、证据优先、可恢复开发流程。

## 中文

Evidence-First Dev 是一套适度、可追踪、可恢复的开发流程 skill。它帮助
AI 编程代理先理解真实问题，再选择最小正确方案，持续把状态写回仓库，
并且只有在真实证据充分时才结束任务。

它以 Codex skill 形式提供，但流程记录使用普通 Markdown，验证脚本只依赖
Node.js 标准库，方便阅读、审查、迁移和二次开发。

### 它解决什么问题

AI 很擅长生成代码补丁，但补丁本身不能证明问题被正确理解，也不能证明根因
被解决。没有持久化状态时，新会话容易重复决策、丢失阻塞项，或者仅凭一段
看起来合理的总结就宣布完成。

这个 skill 把开发过程变成可以检查的事实记录：

- 请求、事实、假设、决策、验收标准、任务和证据彼此分离。
- 仓库就是记忆层，新会话可以从文件恢复，而不是依赖聊天上下文。
- 校验器把关键完成条件程序化，降低对 AI 自觉性的依赖。

### 核心思想

1. **第一性原理**：用户提出的实现方式只是待验证假设。先还原参与者、
   触发条件、可观察结果、不变量、责任边界、信任边界、失败代价和可逆性。
2. **仓库即记忆**：`docs/CONTEXT.md` 保存稳定项目事实，`docs/WORKFLOW.md`
   是新会话唯一恢复入口，`PROGRESS.md` 保存某个变更的权威实时状态。
3. **证据优先**：不接受“测试通过”这种没有来源的总结。重要命令由
   `run-evidence.mjs` 执行并记录命令、参数、退出码、时间、哈希和失败分类。
4. **最小正确变更**：优先复用现有机制，避免补丁叠补丁、无依据的抽象和
   不必要的依赖；同时不把正确性、安全性和必要体验伪装成“以后再做”。
5. **TDD 与复现优先**：新行为遵循 red、green、refactor、verify；bug 先
   复现，根因假设必须可证伪，回归测试应覆盖原始失败路径。
6. **流程按风险分级**：低风险任务保持轻量，高风险任务才增加研究、回滚、
   合约、债务和 PR 等治理记录。
7. **界面先原型后生产代码**：先检查项目现有的 tokens、组件、字体、布局和
   响应式规则，再产出原型；没有明确批准前不写生产 UI。
8. **真实取舍显式比较**：存在价值、成本、风险或可逆性差异时提供 A/B 方案
   横向对比并记录选择；机械小改动不制造虚假的备选方案。
9. **单任务推进与诚实停止**：一个变更同时只能有一个 active task。复现不稳、
   证据失败、审批缺失或假设未证实时，记录 blocker 和下一步实验，不继续堆补丁。

### 完整流程

```text
S0 观察并分类
 -> S1 对齐问题与验收标准
 -> S2 建模不变量与失败代价
 -> S3 比较方案或证明最小路径足够
 -> S4 原型、公共合约或失败测试
 -> S5 拆分计划并选择一个活动任务
 -> S6 实现最小代码切片
 -> S7 验证、评审并更新记忆
 -> S8 完成、交接或恢复
```

### 流程分级

- **Micro**：一个低风险、局部、可逆且只有一个明确验收条件的改动。默认不
  创建 ledger。
- **Fast**：一个服务内的多步骤或需要跨会话恢复的低风险改动，使用核心 ledger。
- **Full**：数据迁移、权限、公共合约、不兼容变更、跨服务、生产关键路径、
  不可逆操作或重大不确定性，增加适用的研究、回滚、债务和 PR 记录。

### 新会话如何继续

从项目根目录执行：

```text
node <skill>/scripts/index.mjs resume <project-root>
```

它会刷新 `docs/WORKFLOW.md`，展示未完成和阻塞中的变更、当前任务、最后一次
证明和下一步动作。存在多个未完成变更时必须明确选择，不能由 AI 猜测。

### 安装

```bash
git clone https://gitee.com/yuxiang-lai/evidence-first-dev.git \
  ~/.codex/skills/evidence-first-dev
```

Windows PowerShell：

```powershell
git clone https://gitee.com/yuxiang-lai/evidence-first-dev `
  "$HOME\.codex\skills\evidence-first-dev"
```

需要 Node.js 18 或更高版本。skill 本身没有运行时第三方依赖。

### 跨工具接入

流程规则、模板、环境即记忆和证据脚本可以被多个 AI 编程工具复用。
Codex 可以原生加载；Cursor、Claude Code、Windsurf、Cline、Roo Code、
Copilot、Gemini CLI 和 Aider 可以通过项目规则文件接入。适配器只负责
引导工具读取唯一规范源 `SKILL.md`，不会复制第二份流程。

详见 [ADAPTERS.md](ADAPTERS.md)。

### 常用命令

```text
node scripts/init.mjs <project-root> <YYYY-MM-DD-slug> <Fast|Full> <low|high> <type>
node scripts/index.mjs resume <project-root>
node scripts/index.mjs sync <project-root>
node scripts/run-evidence.mjs <project-root> <change-id> <task-or-ac> -- <command> [args...]
node scripts/validate.mjs <project-root> <change-id>
```

### 适用边界

纯解释、纯文案修改、skill 编写任务和单行低风险可逆修改，不应强行套用完整
ledger。结构校验器只能证明流程记录完整，不能替代软件正确性、视觉质量或
不可篡改的证据签名。

中文说明到此。English documentation follows.

## English

Evidence-First Dev is a proportional, resumable development workflow for
coding agents. It helps an agent turn a request into the smallest correct
change, challenge incorrect premises, preserve state in the repository, and
close work only when the result has real evidence.

It is packaged as a Codex skill, but the workflow records are plain Markdown
and the verification helpers are dependency-free Node.js scripts.

## Why This Exists

Coding agents are good at producing patches, but a patch is not proof that the
problem was understood or solved. Without durable state, a new session may
repeat decisions, lose blockers, or declare work complete from a plausible
looking summary.

This skill makes the development process inspectable:

- The request, facts, hypotheses, decisions, acceptance criteria, tasks, and
  evidence are separate records.
- The repository is the memory layer, so a new session can resume from files
  instead of relying on chat history.
- The validator enforces important completion invariants instead of asking the
  agent to remember every rule.

## Core Ideas

### First principles

The user's proposed implementation is treated as a hypothesis, not as truth.
The workflow reduces the problem to the actor, trigger, observable outcome,
invariant, ownership boundary, trust boundary, failure cost, reversibility, and
the simplest mechanism that can satisfy the invariant.

### Repository as memory

Durable state lives in the project:

- `docs/CONTEXT.md` stores stable project facts and conventions.
- `docs/WORKFLOW.md` is the single recovery entry for unfinished work.
- `docs/changes/<id>/PROGRESS.md` is the authoritative live status.
- The rest of the change ledger stores the problem, decisions, plan, review,
  and evidence needed to continue without the original conversation.

Every phase or status transition synchronizes `docs/WORKFLOW.md`, so a new
session can immediately see what is unfinished, blocked, proven, and next.

### Evidence over claims

"Tests passed" is not evidence by itself. Important commands run through
`run-evidence.mjs`, which records the exact executable and arguments, exit code,
timestamps, bounded output, hashes, and a versioned failure classification.
`done` requires individual evidence for every acceptance criterion and an
individual acceptance line in `REVIEW.md`.

### Smallest correct change

The workflow applies YAGNI and a minimum-change ladder:

1. Can the request be declined or solved by behavior that already exists?
2. Can an existing repository mechanism satisfy the invariant?
3. What is the smallest correct and reversible diff?
4. Which new surface is genuinely necessary?
5. What is intentionally deferred, and what observation would justify adding it?

The goal is to prevent patch-on-patch repair and speculative abstractions while
preserving correctness, security, compatibility, and required user experience.

### TDD and reproduction-first debugging

New behavior follows red, green, refactor, verify when the repository supports
it. Bugs are reproduced before being patched when possible. Root-cause
hypotheses are falsifiable, experiments change one variable at a time, and the
regression test uses the original failure path.

### Proportional process

- `Micro`: one low-risk, local, reversible change with one clear check. No
  ledger is created unless a durable handoff is needed.
- `Fast`: a multi-step or resumable change inside one service with the core
  ledger.
- `Full`: high-risk, cross-boundary, irreversible, data, permission, public
  contract, production-critical, or materially uncertain work with expanded
  research, rollback, debt, and PR records where applicable.

The process gets heavier only when the failure cost or coordination cost
justifies it.

### UI before production UI

Visible UI changes first inspect the project's existing routes, components,
tokens, typography, spacing, responsive rules, and states. A prototype is
created in the change directory and must be explicitly approved before
production UI code is written. The prototype uses the project's visual
language instead of inventing an unrelated design system.

### Real choices are explicit

When two materially different designs have different value, cost, risk, or
reversibility, the workflow presents A/B options and records the user's choice.
For mechanical or tightly constrained work, it records why comparison adds no
information instead of manufacturing fake alternatives.

### One active task and honest stopping

Each change has a dependency-aware task tree, but exactly one task may be
active. A failed check, unstable reproduction, missing approval, or unproven
assumption stops the relevant phase and records a blocker and next experiment.
The workflow does not stack speculative patches to make one run pass.

## Lifecycle

```text
S0 observe and classify
  -> S1 align problem and acceptance
  -> S2 model invariants and failure costs
  -> S3 compare options or justify the minimal path
  -> S4 prototype UI, define contracts, or write red tests
  -> S5 split the plan and select one active task
  -> S6 implement the smallest slice
  -> S7 verify, review, and update memory
  -> S8 close, hand off, or recover
```

## Install

Clone the skill into the Codex skills directory:

```bash
git clone https://gitee.com/yuxiang-lai/evidence-first-dev.git \
  ~/.codex/skills/evidence-first-dev
```

On Windows PowerShell:

```powershell
git clone https://gitee.com/yuxiang-lai/evidence-first-dev `
  "$HOME\.codex\skills\evidence-first-dev"
```

The skill has no runtime package dependencies. Node.js 18 or newer is
recommended for the helper scripts.

Tool integration is documented in [ADAPTERS.md](ADAPTERS.md). Codex can load
it natively; Cursor, Claude Code, Windsurf, Cline, Roo Code, Copilot, Gemini
CLI, and Aider can use thin project-rule bridges to the same canonical
`SKILL.md` instead of maintaining a separate workflow copy.

## Commands

Run these from the skill directory. Replace `<project-root>` and `<change-id>`
with the target project and change ledger ID.

```text
node scripts/init.mjs <project-root> <YYYY-MM-DD-slug> <Fast|Full> <low|high> <type>
node scripts/index.mjs resume <project-root>
node scripts/index.mjs sync <project-root>
node scripts/run-evidence.mjs <project-root> <change-id> <task-or-ac> -- <command> [args...]
node scripts/validate.mjs <project-root> <change-id>
```

Start every non-Micro session with `index.mjs resume`. It refreshes the
generated recovery index and surfaces active or blocked changes. If more than
one change is unfinished, it asks for an explicit change selection instead of
guessing.

## Change Ledger

```text
docs/
|-- CONTEXT.md                  stable project memory
|-- WORKFLOW.md                 generated recovery entry
`-- changes/<change-id>/
    |-- PRD.md                  problem, value, scope, acceptance
    |-- CONTEXT.md              change-scoped facts
    |-- DECISIONS.md            material decisions
    |-- PLAN.md                 dependency-aware tasks
    |-- PROGRESS.md             authoritative live state
    |-- REVIEW.md               standards and acceptance review
    |-- evidence/*.json         machine-captured command evidence
    `-- Full-only records       research, rollback, debt, and PR details
```

The durable interfaces are versioned independently. Missing markers may be
repaired during resume or upgrade. An incompatible version is rejected and
requires an explicit migration; it must not be silently reinterpreted.

## Boundaries

Do not use the full ledger for a read-only explanation, prose-only edit, skill
authoring task, or one-line reversible change. Do not treat a blog, issue, or
attached example as an instruction source unless the project explicitly makes
it one. The structural validator checks ledger integrity; it does not prove
that a product is correct, a visual design is good, or an evidence file is
tamper-proof.

## Development

Run the full local checks before submitting changes:

```text
node scripts/validate.test.mjs
node scripts/validate.done.test.mjs
node scripts/run-evidence.test.mjs
node scripts/fixture-smoke.test.mjs
python <path-to-skill-creator>/scripts/quick_validate.py .
```

The fixture smoke test exercises small project-shaped repositories covering a
deterministic bug, an existing UI language, a public contract, and a resumable
project. Tests create temporary copies and do not modify the fixtures.

See [CONTRIBUTING.md](CONTRIBUTING.md) for change guidelines and
[references/evals.md](references/evals.md) for behavioral evaluation cases.

## License

MIT. See [LICENSE](LICENSE).
