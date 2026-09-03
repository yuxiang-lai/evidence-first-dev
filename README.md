# Evidence-First Dev / 证据优先开发

> 面向 AI 编程代理的第一性原理、环境即记忆、证据优先、可恢复开发流程。

## 中文

Evidence-First Dev 不是一套让 AI “多写文档”的流程，而是让 AI 在写代码前
先把问题想清楚，在写代码时控制复杂度，在结束任务前拿出真实证据，并且让
下一次会话能够接着做。

它以 Codex skill 形式提供，但核心流程使用普通 Markdown，验证脚本只依赖
Node.js 标准库，也可以通过项目规则接入 Cursor、Claude Code、Windsurf、
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

### 2. 第一性原理

用户说“加缓存”“重构这里”或“加一个页面”，只是解决方案建议，不一定是
真正的问题。AI 先还原：谁遇到了什么问题、什么结果才算解决、哪个条件不能
被破坏、失败的代价是什么。

**解决的问题**：避免 AI 因为用户提出了一个方案，就不加判断地把错误方向
做得越来越复杂。

### 3. 证据优先

“应该好了”“测试通过了”都不等于完成。重要命令由 `run-evidence.mjs` 真实
执行，记录命令、参数、退出码、时间、输出摘要和证据文件；没有对应证据，
就不能把任务标记为完成。

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

从项目根目录执行：

```text
node <skill-path>/scripts/index.mjs resume <project-root>
```

它会刷新 `docs/WORKFLOW.md`，展示未完成和阻塞中的变更、当前任务、最后一次
证明和下一步动作。存在多个未完成变更时必须明确选择，不能由 AI 猜测。

## 安装

Codex：

```bash
git clone https://gitee.com/yuxiang-lai/evidence-first-dev.git \
  ~/.codex/skills/evidence-first-dev
```

Windows PowerShell：

```powershell
git clone https://gitee.com/yuxiang-lai/evidence-first-dev `
  "$HOME\.codex\skills\evidence-first-dev"
```

其他 AI 工具的接入方式见 [ADAPTERS.md](ADAPTERS.md)。适配器只负责引导工具
读取唯一规范源 `SKILL.md`，不会复制第二份流程。

需要 Node.js 18 或更高版本。skill 本身没有运行时第三方依赖。

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
|-- ADAPTERS.md              跨工具接入说明
|-- adapters/                轻量规则桥接模板
|-- references/              详细流程、审查和评估
|-- templates/               环境即记忆的文档模板
|-- scripts/                 恢复、证据和校验脚本
`-- fixtures/                bug、UI、合约和恢复演练样本
```

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
python <path-to-skill-creator>/scripts/quick_validate.py .
```

详见 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [references/evals.md](references/evals.md)。

## English Summary

Evidence-First Dev is a portable, proportional, and resumable development
workflow for coding agents. It is built around first-principles reasoning,
repository-as-memory, real command evidence, minimum correct changes, TDD or
reproduction-first debugging, prototype-before-production UI, explicit design
trade-offs, one active task, and honest stopping.

It addresses common agent failures: blindly implementing a user's proposed
solution, stacking patches without finding the root cause, claiming completion
without reproducible proof, losing context between sessions, and introducing
UI or architectural complexity without evidence.

The canonical rules live in `SKILL.md`. Markdown ledgers, templates, recovery
scripts, evidence capture, validators, and fixture repositories are portable
across agent tools. See [ADAPTERS.md](ADAPTERS.md) for Cursor, Claude Code,
Windsurf, Cline, Roo Code, Copilot, Gemini CLI, and Aider integration.

## License

MIT. See [LICENSE](LICENSE).
