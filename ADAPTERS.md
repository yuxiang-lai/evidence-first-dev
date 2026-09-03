# Tool Adapters / 跨工具接入

## 中文

Evidence-First Dev 的流程、模板和 Node.js 脚本是工具无关的。不同 AI
工具的差异主要在于：它们从哪个目录自动读取规则文件，以及是否支持
`SKILL.md` 这种目录结构。

本仓库遵循一个原则：

> `SKILL.md` 是唯一规范源，适配器只负责让具体工具找到它。

不要为 Cursor、Claude Code 或其他工具复制一份完整流程。复制的适配器
只应包含触发条件、canonical 文件路径和最少的使用约束。

### 能力分层

| 层级 | 内容 | 是否跨工具 |
| --- | --- | --- |
| 流程规则 | `SKILL.md`、`references/` | 是 |
| 环境即记忆 | `docs/CONTEXT.md`、`docs/WORKFLOW.md`、change ledger | 是 |
| 证据与校验 | `scripts/`、`templates/`、`fixtures/` | 是，只需要 Node.js |
| 自动发现 | `agents/openai.yaml`、工具规则目录 | 否，由工具决定 |

### Codex

Codex 可以原生使用本仓库：

```text
~/.codex/skills/evidence-first-dev/SKILL.md
```

`agents/openai.yaml` 只提供 Codex 的界面元数据。其他工具可以忽略它。

### Cursor

Cursor 最稳定的方式是使用项目级 `.cursor/rules`：

```powershell
New-Item -ItemType Directory -Force .cursor | Out-Null
git clone https://gitee.com/yuxiang-lai/evidence-first-dev.git `
  ".cursor\evidence-first-dev"
New-Item -ItemType Directory -Force ".cursor\rules" | Out-Null
Copy-Item ".cursor\evidence-first-dev\adapters\cursor\evidence-first-dev.mdc" `
  ".cursor\rules\evidence-first-dev.mdc"
```

仓库内的 [Cursor adapter](adapters/cursor/evidence-first-dev.mdc) 会引导
Cursor 读取 `.cursor/evidence-first-dev/SKILL.md`。如果不希望对所有请求
自动触发，可以把 `alwaysApply` 改为 `false`，在需要时启用该规则。

### Claude Code

如果当前版本支持 Agent Skills，可以直接把整个目录放入：

```text
.claude/skills/evidence-first-dev/
```

保留根目录 `SKILL.md`，忽略 `agents/openai.yaml` 即可。如果当前版本不
支持目录式 skill，把 [generic adapter](adapters/generic/AGENTS.md) 的内容
放到项目规则文件中，并把其中的路径改成实际 clone 路径。

### Windsurf、Cline、Roo、Copilot、Gemini CLI、Aider

这些工具通常可以通过各自的项目规则或约定文件接入。使用
[generic adapter](adapters/generic/AGENTS.md) 作为内容基础，放入对应的
规则入口，并把 `.ai/evidence-first-dev/SKILL.md` 改成实际路径：

| 工具 | 常见入口 | 推荐接入方式 |
| --- | --- | --- |
| Windsurf | `.windsurf/rules/` | 放入通用 adapter，按版本启用项目规则 |
| Cline | `.clinerules/` | 放入通用 adapter |
| Roo Code | `.roo/rules/` 或项目规则 | 放入通用 adapter |
| GitHub Copilot | `.github/copilot-instructions.md` | 合并通用 adapter 的正文 |
| Gemini CLI | `GEMINI.md` | 合并通用 adapter 的正文 |
| Aider | `CONVENTIONS.md` | 合并通用 adapter 的正文 |

这些工具的规则发现机制可能随版本变化。仓库标签只能帮助搜索，不能
保证工具自动加载 skill；应以工具当前版本的规则文档为准。

### 通用适配器的路径约定

通用模板默认 skill 位于：

```text
.ai/evidence-first-dev/SKILL.md
```

例如：

```powershell
New-Item -ItemType Directory -Force .ai | Out-Null
git clone https://gitee.com/yuxiang-lai/evidence-first-dev.git `
  ".ai\evidence-first-dev"
Copy-Item ".ai\evidence-first-dev\adapters\generic\AGENTS.md" ".\AGENTS.md"
```

如果工具规则文件位于其他目录，只需要调整 adapter 中的路径，不要复制或
改写完整的 `SKILL.md`。

### 运行证据脚本

适配器只影响规则加载，脚本命令仍然相同：

```text
node <skill-path>/scripts/index.mjs resume <project-root>
node <skill-path>/scripts/run-evidence.mjs <project-root> <change-id> <task-or-ac> -- <command> [args...]
node <skill-path>/scripts/validate.mjs <project-root> <change-id>
```

项目中的 `docs/WORKFLOW.md`、`docs/CONTEXT.md` 和 change ledger 才是跨工具
共享的环境记忆。无论使用哪个 AI，恢复都应从 `docs/WORKFLOW.md` 开始。

## English

The workflow, templates, and Node.js helpers are tool-agnostic. Tool-specific
integration is mostly a discovery problem: each agent looks for rules in a
different location.

`SKILL.md` is the single source of truth. Adapters are intentionally thin
bridges that point an agent to that file; they must not duplicate the workflow.

- Codex can load the repository as a native skill from `~/.codex/skills`.
- Cursor can use the committed `.mdc` bridge through `.cursor/rules`.
- Claude Code can use the directory as an Agent Skill when supported by the
  installed version.
- Other agents can place the generic `AGENTS.md` bridge in their rule entry.

The shared memory and evidence layer remains portable:
`docs/WORKFLOW.md`, `docs/CONTEXT.md`, `docs/changes/`, `scripts/`, and
`templates/`. Repository tags improve discoverability but do not control skill
loading.
