# 安装与接入 / Installation

Evidence-First Dev 的核心是 Markdown。**不需要 Node.js、Python 或特定项目语言**；
Node.js 18+ 只用于可选的初始化、索引同步、校验和机器证据采集。

## 先选你的工具

| 工具 | 推荐方式 | 安装后是否需要 Node.js |
| --- | --- | --- |
| Codex | 安装到 `~/.codex/skills/evidence-first-dev` | 否 |
| Cursor | 复制一个 `.mdc` 到项目的 `.cursor/rules/` | 否 |
| Claude Code | 放入 `.claude/skills/evidence-first-dev/`，版本支持时使用 | 否 |
| Trae | 在项目规则或自定义 Agent/Skill 入口导入通用 adapter | 否 |
| CodeBuddy | 在项目规则或自定义 Agent/Skill 入口导入通用 adapter | 否 |
| 其他工具 | 复制根目录 `AGENTS.md` 到项目根目录，或导入通用 adapter | 否 |

## 下载仓库

### Git

```bash
git clone https://github.com/yuxiang-lai/evidence-first-dev.git
```

国内网络也可以使用 Gitee：

```bash
git clone https://gitee.com/yuxiang-lai/evidence-first-dev.git
```

### 不使用 Git

打开 [GitHub 仓库](https://github.com/yuxiang-lai/evidence-first-dev) 或
[Gitee 仓库](https://gitee.com/yuxiang-lai/evidence-first-dev)，选择
`Download ZIP`，解压后把解压目录作为 `<skill-root>`。

仓库本身是开发源码仓库，包含测试、fixture、文档和适配器。用户安装时应
使用下面的安装器复制精选 payload，不要把整个源码仓库当作目标项目里的 skill
目录。精选清单由 `scripts/payload.txt` 维护。

## Codex

先从 GitHub 或 Gitee 下载本仓库，然后在源码根目录执行。安装器只复制
`SKILL.md`、references、templates 和必要脚本：

```powershell
New-Item -ItemType Directory -Force "$HOME\.codex\skills\evidence-first-dev" | Out-Null
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 `
  -Tool codex -ProjectRoot "$HOME\.codex\skills\evidence-first-dev"
```

macOS/Linux：

```bash
mkdir -p ~/.codex/skills/evidence-first-dev
sh scripts/install.sh codex ~/.codex/skills/evidence-first-dev
```

然后重新打开 Codex 会话。贡献者需要修改 skill 源码时，才建议完整 clone 到
单独的源码目录，例如 `~/src/evidence-first-dev`。

## Cursor

Cursor 使用项目级规则。将下面的文件复制到**目标项目**：

```text
<skill-root>/adapters/cursor/evidence-first-dev.mdc
 -> <project-root>/.cursor/rules/evidence-first-dev.mdc
```

PowerShell：

```powershell
New-Item -ItemType Directory -Force .cursor\rules | Out-Null
Copy-Item `
  "<skill-root>\adapters\cursor\evidence-first-dev.mdc" `
  ".cursor\rules\evidence-first-dev.mdc"
```

重启或重新加载 Cursor。规则文件是独立的，不要求把整个 skill 克隆到目标项目。
若希望使用脚本和完整参考资料，使用安装器的默认 `full` 模式；它会把精选
payload 放到 `.ai/evidence-first-dev/`，不会复制源码仓库中的 README、fixtures、
测试、适配器或安装器。

## Claude Code

如果当前版本支持目录式 Agent Skills，使用安装器将精选 payload 放入目标项目：

```text
<project-root>/.claude/skills/evidence-first-dev/
```

也可以运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 `
  -Tool claude -ProjectRoot C:\path\to\your-project
```

保留根目录 `SKILL.md`。如果当前版本只读取项目规则，把根目录 `AGENTS.md`
复制到目标项目根目录。

## Trae 与 CodeBuddy

这两个工具的规则、Skill 和自定义 Agent 入口会随版本和产品形态变化，当前不
假设一个未经确认的固定目录。最稳妥的接入方式是：

1. 打开工具的项目规则、Rules、Skills 或 Custom Agent 设置。
2. 导入 `<skill-root>/adapters/generic/AGENTS.md` 的内容。
3. 如果工具支持项目根规则文件，也可以直接复制根目录 `AGENTS.md`。
4. 新建会话，让工具先读取 `docs/WORKFLOW.md`；完成一次小任务后检查是否留下了
   `docs/` 记忆记录。

这是规则导入，不是插件安装；不需要 Node.js。工具升级后，以其官方文档为准，
不要因为目录名称相似就猜测路径。

## 其他工具

对只支持项目规则的工具，优先使用根目录 `AGENTS.md`：

```powershell
Copy-Item "<skill-root>\AGENTS.md" ".\AGENTS.md"
```

也可以使用通用 adapter：

```text
<skill-root>/adapters/generic/AGENTS.md
```

常见映射：

| 工具 | 常见入口 |
| --- | --- |
| Windsurf | `.windsurf/rules/` |
| Cline | `.clinerules/` |
| Roo Code | `.roo/rules/` 或项目规则 |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Gemini CLI | `GEMINI.md` 或项目规则 |
| Aider | `CONVENTIONS.md` |

这些路径是工具约定的常见入口，不代表所有版本都完全一致。

## 使用安装脚本

脚本只使用 PowerShell 或 POSIX shell，不依赖 Node.js。脚本应从已经下载的
skill 仓库目录运行，并且默认不会覆盖已有规则文件。

Windows：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 `
  -Tool cursor -ProjectRoot C:\path\to\your-project
```

通用规则：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 `
  -Tool generic -ProjectRoot C:\path\to\your-project
```

macOS/Linux：

```bash
sh scripts/install.sh cursor /path/to/your-project
sh scripts/install.sh generic /path/to/your-project
```

脚本只负责安装规则桥接和精选 skill payload，不会修改目标项目代码、安装依赖或
创建变更 ledger。`-Mode bridge` 只安装规则桥接；默认 `-Mode full` 还会安装
`.ai/evidence-first-dev/` 精选 payload。Claude 和 Codex 使用 full payload。

## 安装后检查

最简单的检查是不依赖任何运行时：

```text
目标项目中存在 .cursor/rules/evidence-first-dev.mdc 或 AGENTS.md
AI 工具能读取该文件
新会话首先读取 docs/WORKFLOW.md（如果项目已有它）
```

如果安装了 Node.js 18+，也可以运行：

```bash
node <skill-root>/scripts/doctor.mjs <project-root>
```

## 卸载

卸载只删除安装到目标项目的规则桥接文件：

```text
.cursor/rules/evidence-first-dev.mdc
AGENTS.md（仅当它是本项目为本 skill 新增的文件）
```

不要删除项目的 `docs/`、`evidence/` 或 `docs/changes/`；它们是项目自己的环境记忆，
是否保留由项目维护者决定。

---

## English

Evidence-First Dev is Markdown-first. **Node.js, Python, and a specific project
language are not required**. Node.js 18+ only adds optional initialization,
index synchronization, validation, and machine evidence capture.

### Quick install

| Tool | Recommended integration | Node.js required |
| --- | --- | --- |
| Codex | Copy the curated payload under `~/.codex/skills/evidence-first-dev` | No |
| Cursor | Copy one `.mdc` file into `.cursor/rules/` | No |
| Claude Code | Put the directory under `.claude/skills/` when supported | No |
| Trae | Import the generic adapter into project rules or Custom Agent/Skill | No |
| CodeBuddy | Import the generic adapter into project rules or Custom Agent/Skill | No |
| Other tools | Copy `AGENTS.md` to the project root or import the generic adapter | No |

Clone from GitHub or Gitee, or download a ZIP. See the commands above. The
repository provides optional `scripts/install.ps1` and `scripts/install.sh` for
curated Codex, Claude, Cursor, and generic project-rule installation. The
default `full` mode copies only the payload listed in `scripts/payload.txt`;
`bridge` copies only a thin host rule where supported.

Adapters are intentionally thin. `SKILL.md` remains the detailed source of
truth; `AGENTS.md` and the generic/Cursor files are compact bridges for hosts
that do not load directory-based skills. They do not install dependencies or
modify project code.
