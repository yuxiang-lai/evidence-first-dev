# Installation / 安装

中文 | [English](#english)

## 最简单的安装方式

如果电脑已有 Node.js/npm，一条命令即可让安装器识别 Codex、Claude Code、
Cursor 和 OpenCode，并让你选择项目级或全局安装：

```bash
npx skills add yuxiang-lai/evidence-first-dev
```

Gitee 镜像也可直接安装：

```bash
npx skills add https://gitee.com/yuxiang-lai/evidence-first-dev.git
```

一次全局安装到四个工具：

```bash
npx skills add yuxiang-lai/evidence-first-dev --skill evidence-first-dev -g -a codex -a claude-code -a cursor -a opencode
```

`npx` 只用于下载和放置文件。安装完成后，skill 是普通 Markdown；使用 C、
C++、Java、Go、Rust 或其他项目时不需要运行 Node.js，也不会给项目安装 npm 依赖。

没有 Node.js 时，使用下面任一平台原生路径。

## Codex

官方 marketplace 安装：

```bash
codex plugin marketplace add yuxiang-lai/evidence-first-dev
codex plugin add evidence-first-dev@evidence-first-dev
```

重启 Codex 或新建任务后使用。这个插件没有 hooks、MCP 或后台进程，只发布
一个按需加载的 skill。

## Claude Code

在 Claude Code 中分两次发送：

```text
/plugin marketplace add yuxiang-lai/evidence-first-dev
```

```text
/plugin install evidence-first-dev@evidence-first-dev
```

新建会话后，Claude Code 会从插件的 `skills/` 目录发现它。

## Cursor

无需 Node.js 的图形界面路径：

1. 打开侧栏的 **Customize**。
2. 进入 **Rules**，点击 **Add Rule**。
3. 选择 **Remote Rule (GitHub)**。
4. 输入 `https://github.com/yuxiang-lai/evidence-first-dev`。

也可以把发布包 `skills/evidence-first-dev/` 复制到以下任一位置：

```text
<project>/.cursor/skills/evidence-first-dev/
~/.cursor/skills/evidence-first-dev/
```

旧的 `.cursor/rules/evidence-first-dev.mdc` 仅用于兼容不支持 Agent Skills 的
Cursor 版本，默认不再使用 always-on 规则。

## OpenCode

推荐使用最上方的 `npx skills add`。无需 Node.js 时，下载 ZIP 后只复制
`skills/evidence-first-dev/` 到：

```text
<project>/.opencode/skills/evidence-first-dev/
~/.config/opencode/skills/evidence-first-dev/
```

OpenCode 也原生识别项目级和全局 `.agents/skills/evidence-first-dev/`。无需 npm
插件、常驻 system prompt 或额外配置。

## 从源码 checkout 安装

维护者或无法使用上面入口时，可 clone 仓库后运行零依赖安装器：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -Tool cursor -ProjectRoot C:\path\to\project
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -Tool claude -ProjectRoot C:\path\to\project
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -Tool opencode -ProjectRoot C:\path\to\project
```

```bash
sh scripts/install.sh cursor /path/to/project
sh scripts/install.sh claude /path/to/project
sh scripts/install.sh opencode /path/to/project
```

Codex 全局目录安装示例：

```powershell
New-Item -ItemType Directory -Force "$HOME\.codex\skills\evidence-first-dev" | Out-Null
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -Tool codex -ProjectRoot "$HOME\.codex\skills\evidence-first-dev"
```

安装器只依赖 PowerShell 或 POSIX shell，不执行 npm install，不修改项目代码，
也不自动创建 `docs/` ledger。默认不覆盖已有 skill；确认后才使用 `-Force` 或
`--force`。

## 用户实际得到什么

可安装内容只来自 `skills/evidence-first-dev/`，它由 `scripts/payload.txt` 生成并
由 CI 校验。包括：

- `SKILL.md`、`LICENSE` 与平台元数据
- `references/` 与 `templates/`
- 可选的零第三方依赖 Node.js 辅助脚本

不会进入用户 skill 目录：README、`AGENTS.md`、fixtures、测试、适配器、安装器、
贡献文档和 marketplace 清单。Claude marketplace 直接缓存精选子目录；Codex 的
私有 marketplace 缓存可能保存仓库 checkout，但只发布 `skills/` 中的内容，不会
把开发文件复制到用户项目。

## 更新与卸载

通过 Agent Skills CLI 安装：

```bash
npx skills update evidence-first-dev
npx skills remove evidence-first-dev
```

Codex 先运行 `codex plugin marketplace upgrade evidence-first-dev`，再运行
`codex plugin add evidence-first-dev@evidence-first-dev`；卸载使用
`codex plugin remove evidence-first-dev@evidence-first-dev`。Claude Code 使用
`/plugin update` / `/plugin uninstall`。手动安装则删除对应的 skill 目录。

不要删除项目的 `docs/CONTEXT.md`、`docs/WORKFLOW.md` 或 `docs/changes/`。它们是
项目自己的环境记忆，不是安装文件。

## 安装后验证

新会话中让 AI 列出已发现的 skills，或明确输入“使用 evidence-first-dev”。若有
Node.js 18+，还可以运行：

```bash
node <skill-path>/scripts/doctor.mjs <project-root>
```

Node.js 不可用时，确认目标 skill 目录存在 `SKILL.md` 即可。

---

## English

### One-command install

When `npx` is available, install interactively for Codex, Claude Code, Cursor,
or OpenCode:

```bash
npx skills add yuxiang-lai/evidence-first-dev
```

Install globally for all four:

```bash
npx skills add yuxiang-lai/evidence-first-dev --skill evidence-first-dev -g -a codex -a claude-code -a cursor -a opencode
```

Node.js is used only by this optional installer. The installed skill is plain
Markdown and does not add npm dependencies or require Node.js at runtime.

Native alternatives:

- Codex: `codex plugin marketplace add yuxiang-lai/evidence-first-dev`, then
  `codex plugin add evidence-first-dev@evidence-first-dev`.
- Claude Code: send `/plugin marketplace add yuxiang-lai/evidence-first-dev`,
  then `/plugin install evidence-first-dev@evidence-first-dev`.
- Cursor: **Customize > Rules > Add Rule > Remote Rule (GitHub)** and enter the
  repository URL, or copy `skills/evidence-first-dev/` to `.cursor/skills/`.
- OpenCode: copy `skills/evidence-first-dev/` to `.opencode/skills/` or
  `~/.config/opencode/skills/`.

Only the curated directory under `skills/evidence-first-dev/` is installed by
Agent Skills tooling. Source documentation, fixtures, tests, adapters, and
contributor files stay out of the installed skill. See [ADAPTERS.md](ADAPTERS.md)
for discovery paths and maintenance details.
