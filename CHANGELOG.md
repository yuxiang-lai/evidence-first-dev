# Changelog

All notable changes to Evidence-First Dev are recorded here.

## 1.0.0 - 2026-09-07

First public release of the complete development workflow.

### Workflow

- Reduces proposed solutions to observable outcomes, invariants, constraints,
  and failure costs before implementation.
- Uses proportional Micro, Fast, and Full modes to avoid process overhead on
  small changes while protecting high-risk work.
- Persists project context, active work, decisions, blockers, and next actions
  in the repository so a new session or another coding agent can resume.
- Uses TDD for new behavior and reproduction-first debugging for defects.
- Requires a project-consistent prototype and explicit approval before
  production UI implementation.
- Closes work with acceptance evidence instead of an unsupported claim that
  the change is complete.

### Distribution

- Supports Codex, Claude Code, Cursor, and OpenCode through one Agent Skill.
- Provides native Codex and Claude Code marketplace manifests.
- Provides a one-command installation path with `npx skills add` and no-Node
  native or manual alternatives.
- Ships a curated 30-file package without repository README files, fixtures,
  tests, adapters, or contributor tooling.
- Keeps Node.js automation optional; the complete workflow has a portable
  Markdown mode for any programming language.

### Verification

- Validated by ledger, evidence, fixture, portable-mode, retention,
  installation, and distribution behavior tests.
- Verified with native Codex and Claude Code plugin validators and isolated
  marketplace installations.
- Verified from both GitHub and Gitee through Agent Skills discovery.
