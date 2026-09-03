# Tool Adapters / 跨工具接入

## 中文

Evidence-First Dev 的流程和模板是工具无关的，Node.js 脚本只是可选增强。不同 AI
工具的差异主要在于：它们从哪个目录自动读取规则文件，以及是否支持
`SKILL.md` 这种目录结构。

本仓库遵循一个原则：

> `SKILL.md` 是唯一规范源，适配器只负责让具体工具找到它。

不要为 Cursor、Claude Code 或其他工具复制一份完整流程。复制的适配器
只应包含触发条件、canonical 文件路径和最少的使用约束。即使 canonical
文件暂时不可访问，适配器也应保留足够的便携式最小规则，不能让工具静默
退化成普通代码生成。

### 能力分层

| 层级 | 内容 | 是否跨工具 |
| --- | --- | --- |
| 流程规则 | `SKILL.md`、`references/` | 是 |
| 环境即记忆 | `docs/CONTEXT.md`、`docs/WORKFLOW.md`、change ledger | 是 |
| 证据与校验 | `templates/`、`references/portable-mode.md` | 是，不需要运行时 |
| 自动化增强 | `scripts/` | 可选，只需要 Node.js 18+ |
| 自动发现 | `agents/openai.yaml`、工具规则目录 | 否，由工具决定 |

### Codex

Codex 用户安装时建议使用精选 payload，而不是把源码仓库直接放进 skill 目录：

```powershell
New-Item -ItemType Directory -Force "$HOME\.codex\skills\evidence-first-dev" | Out-Null
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 `
  -Tool codex -ProjectRoot "$HOME\.codex\skills\evidence-first-dev"
```

贡献者才需要完整 checkout。安装器不会复制 README、fixtures、测试、适配器和
开发用安装器。

Codex 可以原生使用安装后的 payload：

```text
~/.codex/skills/evidence-first-dev/SKILL.md
```

`agents/openai.yaml` 只提供 Codex 的界面元数据。其他工具可以忽略它。

### Cursor

Cursor 最稳定的方式是使用项目级 `.cursor/rules`。从 skill 仓库根目录向
目标项目安装：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 `
  -Tool cursor -ProjectRoot C:\path\to\your-project
```

没有 PowerShell 脚本时，直接将 [Cursor adapter](adapters/cursor/evidence-first-dev.mdc)
复制到目标项目的 `.cursor/rules/evidence-first-dev.mdc`。适配器会优先读取
`.ai/evidence-first-dev/SKILL.md`，并兼容旧的 `.cursor/evidence-first-dev/`
路径。如果不希望对所有请求自动触发，可以把 `alwaysApply` 改为 `false`。

### Claude Code

如果当前版本支持 Agent Skills，建议用安装器复制精选 payload：

```text
.claude/skills/evidence-first-dev/
```

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 `
  -Tool claude -ProjectRoot C:\path\to\your-project
```

手动安装时只复制 payload 清单中的文件，忽略 `agents/openai.yaml` 即可。如果当前版本不
支持目录式 skill，把 [generic adapter](adapters/generic/AGENTS.md) 的内容
放到项目规则文件中，并把其中的路径改成实际 clone 路径。

### Windsurf、Cline、Roo、Copilot、Gemini CLI、Aider

这些工具通常可以通过各自的项目规则或约定文件接入。优先运行通用安装脚本：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 `
  -Tool generic -ProjectRoot C:\path\to\your-project
```

或者使用 [generic adapter](adapters/generic/AGENTS.md) 作为内容基础，放入
对应的规则入口。适配器会按候选路径查找完整 `SKILL.md`；找不到时仍使用
便携式最小规则，不要求用户手动改写正文。

Trae 与 CodeBuddy 的具体入口应以当前版本的项目规则、Rules、Skills 或
Custom Agent 设置为准。仓库不猜测一个可能随版本变化的固定目录：导入
`adapters/generic/AGENTS.md` 或根目录 `AGENTS.md` 即可完成规则级接入。

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

例如，不使用安装脚本时：

```powershell
New-Item -ItemType Directory -Force .ai | Out-Null
New-Item -ItemType Directory -Force ".ai\evidence-first-dev" | Out-Null
Copy-Item "<skill-root>\SKILL.md" ".ai\evidence-first-dev\SKILL.md"
Copy-Item "<skill-root>\references" ".ai\evidence-first-dev\references" -Recurse
Copy-Item "<skill-root>\templates" ".ai\evidence-first-dev\templates" -Recurse
Copy-Item "<skill-root>\AGENTS.md" ".\AGENTS.md"
```

更推荐运行安装器，因为它会按 `scripts/payload.txt` 保持清单一致：

```powershell
powershell -ExecutionPolicy Bypass -File <skill-root>\scripts\install.ps1 `
  -Tool generic -ProjectRoot <project-root>
```

如果工具规则文件位于其他目录，只需要把通用 adapter 放入该入口，不要复制
或改写完整的 `SKILL.md`。如果完整 skill 存在于其他路径，把它加入 adapter
的候选路径即可。

### 安装后检查与卸载

有 Node.js 18+ 时运行：

```text
node <skill-path>/scripts/doctor.mjs <project-root>
```

没有 Node.js 时，确认目标项目存在下列任一入口即可：

```text
.cursor/rules/evidence-first-dev.mdc
AGENTS.md
.claude/skills/evidence-first-dev/SKILL.md
```

卸载只删除安装的规则桥接文件，不要自动删除项目自己的 `docs/`、
`evidence/` 或 `docs/changes/`。这些文件是环境记忆，不属于安装器所有。

### 运行证据脚本（可选）

适配器只影响规则加载，脚本命令仍然相同：

```text
node <skill-path>/scripts/index.mjs resume <project-root>
node <skill-path>/scripts/run-evidence.mjs <project-root> <change-id> <task-or-ac> -- <command> [args...]
node <skill-path>/scripts/validate.mjs <project-root> <change-id>
```

项目中的 `docs/WORKFLOW.md`、`docs/CONTEXT.md` 和 change ledger 才是跨工具
共享的环境记忆。无论使用哪个 AI，恢复都应从 `docs/WORKFLOW.md` 开始。没有
Node.js 时，使用 [Portable Markdown Mode](references/portable-mode.md)，手动
维护恢复索引并记录 `manual-observed` 证据，不需要安装 Python 或其他运行时。

## English

The workflow and templates are tool-agnostic. Node.js helpers are optional.
Tool-specific integration is mostly a discovery problem: each agent looks for rules in a
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
