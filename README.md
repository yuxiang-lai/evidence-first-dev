# Evidence-First Dev / 证据优先开发

> 面向 AI 编程代理的第一性原理、环境即记忆、证据优先、可恢复开发流程。

中文 | [English](README.en.md)

## 中文

Evidence-First Dev 不是一套让 AI “多写文档”的流程，而是让 AI 在写代码前
先把问题想清楚，在写代码时控制复杂度，在结束任务前拿出真实证据，并且让
下一次会话能够接着做。

它以 Codex skill 形式提供，但核心流程使用普通 Markdown，不依赖 Node.js、
Python 或目标项目的开发语言；可选的 Node.js 脚本只负责自动化护栏。它也可以
通过项目规则接入 Cursor、Claude Code、Windsurf、
Cline、Roo Code、GitHub Copilot、Gemini CLI 和 Aider。

## 核心思想

一句话概括：**不让 AI 只做一个听话的代码生成器，而是让它像一个会思考、
会验证、会交接的工程师一样工作。**

### 1. 环境即记忆

把项目事实、技术约定、设计决策、当前进度、阻塞原因和下一步动作写回仓库。

- `docs/CONTEXT.md`：项目长期事实和约定
- `docs/WORKFLOW.md`：新会话唯一恢复入口
- `docs/changes/<id>/PROGRESS.md`：当前变更的实时状态
- `evidence/`：命令执行留下的机器证据

**解决的问题**：换会话、换 AI 或隔几天回来时，不会丢失上下文、重复分析，
也不会不知道上次卡在哪里。

它也不会把入口文件当成日志：`CONTEXT.md` 只保留当前事实，`WORKFLOW.md`
只索引未完成项和最近完成项，`DEBTS.md` 只保留未偿还债务；单个 change ledger
才保存完整历史。

### 2. 第一性原理

用户说“加缓存”“重构这里”或“加一个页面”，只是解决方案建议，不一定是
真正的问题。AI 先还原：谁遇到了什么问题、什么结果才算解决、哪个条件不能
被破坏、失败的代价是什么。

**解决的问题**：避免 AI 因为用户提出了一个方案，就不加判断地把错误方向
做得越来越复杂。

### 3. 证据优先

“应该好了”“测试通过了”都不等于完成。有 Node.js 时，重要命令由
`run-evidence.mjs` 真实执行，记录命令、参数、退出码、时间、输出摘要和证据
文件；没有 Node.js 时，使用固定格式的 `manual-observed` Markdown 证据。无论
哪种模式，没有对应证据就不能把任务标记为完成。

**解决的问题**：让团队知道到底验证了什么、结果是什么，并且能够复查和复现，
而不是相信 AI 的一句总结。

### 4. 最小正确变更

先检查现有代码、组件、平台能力和依赖，能复用就不新建，能不做就不做。目标
不是简单地少写代码，而是用足够小、可回滚的改动解决根因，同时明确哪些能力
暂时不做，以及什么事实出现后才需要升级方案。

**解决的问题**：减少补丁叠补丁、无必要的抽象、大范围重构和依赖膨胀。

### 5. TDD 与复现优先

新功能先写一个能证明“当前还不满足”的失败测试；bug 先复现，再提出可证伪
的根因假设，最后用覆盖原始失败路径的回归测试锁定修复。

**解决的问题**：避免靠猜测修改代码，也避免某次碰巧通过后就误以为问题已经
解决。

### 6. UI 先原型，后生产代码

做界面前先检查项目已有的组件、颜色、字体、间距、布局、响应式规则和交互状态。
先产出符合项目视觉语言的原型，确认结构并获得批准后，再写生产 UI。

**解决的问题**：减少 UI 风格不一致、状态遗漏、交互返工和“代码写完才发现
设计不对”。

### 7. 真实方案横向对比

当方案之间存在明显的价值、成本、风险或可逆性差异时，提供 A/B 方案横向对比，
让用户做出选择并记录决策。没有真实取舍时，不为了形式制造复杂方案。

**解决的问题**：避免 AI 擅自替用户做重要决定，也避免小改动被虚假的流程拖慢。

### 8. 一个任务，一步证明

复杂工作按依赖拆成小任务，每次只推进一个 `active task`。每个任务都要有输出、
验证方式和停止条件；假设未证实、复现不稳定、检查失败或审批缺失时，先记录
`blocker` 和下一步实验，不继续堆补丁碰运气。

**解决的问题**：让复杂任务可定位、可暂停、可恢复，避免一次性修改太多内容后
无法判断是哪一步出了问题。

### 9. 流程与风险匹配

- **Micro**：一个低风险、局部、可逆且只有一个明确验收条件的小改动。
- **Fast**：普通的多步骤或需要跨会话恢复的低风险改动。
- **Full**：数据迁移、权限、公共接口、跨服务、生产关键路径或重大不确定性。

**解决的问题**：小任务不被厚重流程拖慢，高风险任务也不会为了图快而漏掉
回滚、兼容性、安全和验收检查。

## 它解决 AI 编程中的什么问题

AI 编程的主要风险通常不是“不会写代码”，而是“很快地把错误方向写成了代码”：

| AI 编程中的问题 | 使用本流程后的改变 |
| --- | --- |
| 用户说“加缓存”，AI 就直接加缓存 | 先验证真实瓶颈、数据新鲜度和约束，方案不成立时会指出来 |
| 出 bug 后不断加判断和保护 | 先复现并找共同根因，再用回归测试锁定修复 |
| AI 说“测试通过”，但没有具体命令和输出 | 重要结论必须有真实命令、退出码和证据文件 |
| 换一个会话就忘记上次做到哪里 | 从 `docs/WORKFLOW.md` 直接恢复变更、任务、阻塞和下一步 |
| UI 先写代码，最后才发现风格不一致 | 先检查项目视觉语言，原型批准后才实现生产 UI |
| 复杂任务一次性全部展开 | 每次只推进一个可验证任务，失败时可以定位和暂停 |
| 为了小需求引入新依赖和大抽象 | 先过最小变更阶梯，只有必要的复杂度才会被留下 |

## 最终实现的效果

- **少返工**：先验证问题和方案，避免把错误方向做深。
- **少补丁**：围绕共同根因修复，而不是在表面不断添加保护条件。
- **可证明**：每个重要结论都有真实命令、测试或可观察结果支撑。
- **可恢复**：新会话直接知道还有什么没完成、卡在哪里、下一步做什么。
- **可协作**：别人只看仓库文件，也能理解目标、决策、进度和剩余风险。
- **可控复杂度**：小任务保持轻量，大任务按小切片稳定推进。

## 完整流程

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

## 新会话如何继续

从项目根目录开始：

```text
node <skill-path>/scripts/index.mjs resume <project-root>
```

有 Node.js 时，这条命令会刷新 `docs/WORKFLOW.md`，展示未完成和阻塞中的变更、
当前任务、最后一次证明和下一步动作。没有 Node.js 时，直接读取并手动维护
`docs/WORKFLOW.md`，操作步骤见 [Portable Markdown Mode](references/portable-mode.md)。
存在多个未完成变更时必须明确选择，不能由 AI 猜测。

项目级记忆不会把完整历史不断复制到入口：`WORKFLOW.md` 只保留未完成项和最近
10 个已完成变更，`CONTEXT.md` 的更新历史最多 5 条，`DEBTS.md` 只保留未偿还债务。
完整记录留在对应的 `docs/changes/<id>/` 下；有 Node.js 时可运行
`node <skill-path>/scripts/index.mjs check <project-root>` 检查入口是否超限，
详见 [记忆保留与压缩](references/retention.md)。

## 安装

希望快速接入时，直接阅读 [安装与接入](INSTALL.md)。按你的 AI 工具选择一条
路径即可，核心 Markdown 流程不要求 Node.js 或 Python。

| 我使用 | 最短路径 |
| --- | --- |
| Codex | 用安装脚本复制精选 payload 到 `~/.codex/skills/evidence-first-dev` |
| Cursor | 运行 `scripts/install.ps1 -Tool cursor`，或复制一个 `.mdc` |
| Claude Code | 放入 `.claude/skills/evidence-first-dev/` |
| Trae、CodeBuddy | 在项目规则或 Custom Agent 设置导入通用 adapter |
| 其他工具 | 复制根目录 `AGENTS.md` 到目标项目根目录 |
| 不使用 Git | 在 GitHub/Gitee 点击 `Download ZIP` |

Codex 用户安装（只复制运行所需文件）：

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

贡献者或需要修改 skill 源码时，再使用完整 checkout：

```bash
git clone https://github.com/yuxiang-lai/evidence-first-dev.git \
  ~/src/evidence-first-dev
```

Gitee 镜像：

```bash
git clone https://gitee.com/yuxiang-lai/evidence-first-dev.git \
  ~/src/evidence-first-dev
```

Windows PowerShell：

```powershell
git clone https://gitee.com/yuxiang-lai/evidence-first-dev `
  "$HOME\src\evidence-first-dev"
```

其他 AI 工具的接入方式见 [INSTALL.md](INSTALL.md) 和 [ADAPTERS.md](ADAPTERS.md)。
根目录 `AGENTS.md` 和适配器只提供轻量桥接；完整流程仍以 `SKILL.md` 为规范源。
安装脚本使用 `scripts/payload.txt`，不会把 README、fixtures、测试、适配器和开发用
安装器复制进目标 skill 目录。

不安装 Node.js 也可以完整使用 Markdown 流程。安装 Node.js 18 或更高版本后，
可以额外启用初始化、恢复索引同步、结构校验和机器证据采集；skill 本身没有
运行时第三方依赖，也不要求目标项目使用 Node.js。

### 两种运行模式

| 模式 | 需要什么 | 证据方式 | 适合谁 |
| --- | --- | --- | --- |
| Portable Markdown | 只需要 AI 工具和文本文件 | `manual-observed` Markdown | 没有 Node.js，或希望流程完全跨语言、跨环境 |
| Assisted | Node.js 18+ | `run-evidence.mjs` 机器采集 | 希望自动同步、校验和保留命令输出摘要 |

两种模式共享同一套 Markdown 文档和状态协议。Node.js 是自动化适配器，不是
目标项目的技术栈要求；不建议为了使用 C、C++、Java、Go、Rust 或 Python 项目
而额外安装目标语言之外的运行时。

### 安装器与自检

从已下载的 skill 仓库根目录运行。安装器只创建或复制规则入口，不安装依赖、
不修改目标项目代码，也不会创建 change ledger：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 `
  -Tool cursor -ProjectRoot C:\path\to\your-project
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 `
  -Tool generic -ProjectRoot C:\path\to\your-project
```

```bash
sh scripts/install.sh cursor /path/to/your-project
sh scripts/install.sh generic /path/to/your-project
```

有 Node.js 18+ 时，可以检查安装入口：

```text
node scripts/doctor.mjs <project-root>
```

## 常用命令

```text
node scripts/init.mjs <project-root> <YYYY-MM-DD-slug> <Fast|Full> <low|high> <type>
node scripts/index.mjs resume <project-root>
node scripts/index.mjs sync <project-root>
node scripts/run-evidence.mjs <project-root> <change-id> <task-or-ac> -- <command> [args...]
node scripts/validate.mjs <project-root> <change-id>
```

## 仓库结构

```text
evidence-first-dev/
|-- SKILL.md                 唯一规范源
|-- AGENTS.md                通用规则桥接入口
|-- INSTALL.md               按工具分流的安装指南
|-- ADAPTERS.md              跨工具接入说明
|-- adapters/                轻量规则桥接模板
|-- references/              详细流程、审查和评估
|-- templates/               环境即记忆的文档模板
|-- scripts/                 可选自动化和安装/自检脚本
`-- fixtures/                bug、UI、合约和恢复演练样本
```

没有 Node.js 时重点使用 `SKILL.md`、`references/portable-mode.md`、
`templates/` 和项目中的 `docs/`。脚本目录可以完全不执行。

## 适用边界

纯解释、纯文案修改、skill 编写任务和单行低风险可逆修改，不应强行套用完整
ledger。结构校验器只能证明流程记录完整，不能替代软件正确性、视觉质量或
不可篡改的证据签名。

## 开发与验证

```text
node scripts/validate.test.mjs
node scripts/validate.done.test.mjs
node scripts/run-evidence.test.mjs
node scripts/fixture-smoke.test.mjs
node scripts/portable-mode.test.mjs
node scripts/doctor.test.mjs
node scripts/install.test.mjs
python <path-to-skill-creator>/scripts/quick_validate.py .
```

详见 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [references/evals.md](references/evals.md)。

## English

English documentation: [README.en.md](README.en.md).

## License

MIT. See [LICENSE](LICENSE).
