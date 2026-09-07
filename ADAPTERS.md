# Tool Adapters / 跨工具接入

## 设计原则

四个平台共享一套工作流，不维护四份提示词：

```text
SKILL.source.md + references/ + templates/ + 可选 scripts/
                         |
             scripts/build-skill-package.mjs
                         |
              skills/evidence-first-dev/
                         |
          Codex / Claude / Cursor / OpenCode
```

根目录文件是维护源，`skills/evidence-first-dev/` 是精选发布包。修改维护源后运行：

```bash
node scripts/build-skill-package.mjs
node scripts/build-skill-package.mjs --check
```

CI 会比较每个文件的清单和内容，发布包不能漏更新，也不能混入 README、fixture、
测试或贡献者文件。Node.js 只参与维护和可选自动化，不是用户运行工作流的要求。

## 四个平台如何发现

| 工具 | 原生入口 | 推荐安装 |
| --- | --- | --- |
| Codex | plugin 的 `skills/` 或 `~/.codex/skills/` | Codex marketplace 或 Agent Skills CLI |
| Claude Code | plugin 的 `skills/` 或 `.claude/skills/` | Claude marketplace 或 Agent Skills CLI |
| Cursor | `.cursor/skills/`、`.agents/skills/`、Remote Rule | Agent Skills CLI 或 GitHub Remote Rule |
| OpenCode | `.opencode/skills/`、`.agents/skills/` | Agent Skills CLI 或复制发布包 |

Codex 使用 `.codex-plugin/plugin.json` 和 `.agents/plugins/marketplace.json`。
Claude Code 使用 `.claude-plugin/plugin.json` 和
`.claude-plugin/marketplace.json`。这些清单只描述发布与发现，不复制工作流正文。

Cursor 和 OpenCode 都支持按需加载 Agent Skills，所以无需把整个工作流注入每次
对话。`adapters/cursor/evidence-first-dev.mdc` 只为旧 Cursor 版本保留，且
`alwaysApply: false`。OpenCode 不需要 npm 插件；常驻注入反而会破坏 Micro/Fast/Full
的比例原则。

## 跨工具记忆

平台入口可以不同，但项目状态始终写在同一组仓库文件中：

- `docs/WORKFLOW.md`：新会话恢复总入口
- `docs/CONTEXT.md`：长期稳定事实
- `docs/changes/<id>/PROGRESS.md`：单个变更的实时状态
- `docs/changes/<id>/evidence/`：验证证据

因此任务可以从 Codex 切到 Cursor，再由 OpenCode 或 Claude Code 继续；新工具先读
`docs/WORKFLOW.md`，而不是依赖旧聊天记录。安装或卸载 skill 都不得删除这些项目
记忆。

## 其他工具

支持 Agent Skills 标准的工具优先运行：

```bash
npx skills add yuxiang-lai/evidence-first-dev
```

不支持目录式 skill 的工具可使用根目录 `AGENTS.md` 或
`adapters/generic/AGENTS.md` 作为轻量兼容桥。桥接文件只保留关键红线，不是第二份
规范源。

## English

One canonical workflow is packaged into `skills/evidence-first-dev/` and loaded
on demand by all four hosts. Codex and Claude Code use native marketplace
manifests. Cursor and OpenCode use native Agent Skill discovery. The legacy
Cursor rule is opt-in and not always-on.

Repository memory is host-independent: every agent resumes from
`docs/WORKFLOW.md` and the selected change ledger. See [INSTALL.md](INSTALL.md)
for user-facing commands and no-Node alternatives.
