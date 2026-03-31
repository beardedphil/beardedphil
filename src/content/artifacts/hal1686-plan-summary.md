> **HAL-1686** — Real `plan-summary.md` from implementation run `run_7j8r82ayw` (`~/.hal/runs/run_7j8r82ayw/`).

# Plan summary (run run_7j8r82ayw)

## System

This artifact is a **synthetic implementation summary**, not a raw token stream from a local HAL model. When implementation uses **Cursor Cloud Agent**, HAL records the exact instruction text sent to Cursor plus dispatch metadata so Process Review and operators can audit scope, inputs, and outcomes.

## User

You are an implementation agent for the Antikythera Engine project management system.

## Your Task

**Title:** Increase frontend unit test coverage (apps/ui) to >= 60%

**Card ID:** card_vk3N442NukbF4iEPP4NhVW

**Target branch:** `ae/AE-1686`

## Ticket Description

## Goal (one sentence)

Raise unit test coverage for the frontend package apps/ui to at least 60% by fixing broken tests and adding focused unit tests for small, high-impact components.

## Verification steps (human)

1. From repo root, install dependencies: pnpm install
2. Run the apps/ui test suite with coverage from the repo root: cd apps/ui && pnpm test -- --coverage --coverageReporters=text-summary,lcov
3. Confirm the printed coverage summary shows statements/branches/functions/lines >= 60% (or overall coverage >= 60%). You can also open apps/ui/coverage/coverage-summary.json and verify the percentage values.
4. Run the tests for the changed files to confirm they pass and do not throw import/syntax errors: cd apps/ui && pnpm test -- src/components/ChatFooter.test.tsx src/components/ChatPanel.test.tsx src/components/MetricsBadgeHelpers.test.tsx
5. Create a short PR and run CI; confirm CI test job passes and coverage artifact (if CI publishes coverage) reports >= 60% for apps/ui.

## Acceptance criteria

- [ ] Overall test coverage for package apps/ui is >= 60% (verify via coverage summary printed by: cd apps/ui && pnpm test -- --coverage and/or apps/ui/coverage/coverage-summary.json)
- [ ] All tests in apps/ui complete with exit code 0 in local runs and in CI (no failing tests)
- [ ] Tests that previously errored due to incorrect imports (files: apps/ui/src/components/ChatFooter.test.tsx, apps/ui/src/components/ChatPanel.test.tsx, apps/ui/src/components/MetricsBadge.test.tsx, apps/ui/src/components/MetricsBadgeHelpers.test.tsx) are fixed so they run without import/syntax errors
- [ ] New or adjusted tests cover component behavior for ChatFooter and ChatPanel at a unit level (props/state interactions, key callbacks) and a helper-level test for MetricsBadgeHelpers; each added test file includes at least one meaningful assertion on rendered output or helper return value
- [ ] Changes are limited to the apps/ui package (no production feature changes outside apps/ui) and are small, reviewable commits with clear test-first intent

## Constraints

- Work must be limited to the apps/ui package only
- Keep changes minimal and test-focused; avoid feature/UX changes
- Follow project patch rules: small edits (no >40% rewrite of unchanged files), tests <=350 lines when adding new test files
- Use the existing test runner/setup used by the repo (do not introduce a new test framework)

## Out of scope

- Any backend/server packages or other frontend packages outside apps/ui
- UI/feature changes unrelated to making tests pass or increasing coverage
- Major refactors of app architecture solely to raise coverage

## Context / suspected cause (for implementer)

Suspected causes observed from repository test files: apps/ui/src/components/ChatFooter.test.tsx and apps/ui/src/components/ChatPanel.test.tsx appear to import test globals (e.g. "import { describe..."), which can cause syntax/import issues depending on the test runner config. Also see similar entries for apps/ui/src/components/MetricsBadge.test.tsx and apps/ui/src/components/MetricsBadgeHelpers.test.tsx. Likely causes:
- Incorrect/unused imports of test globals (describe/it/expect) instead of relying on the test runner globals or proper imports from the test library (vitest/jest)
- Missing or shallow tests for small components/helpers leading to low coverage

## Suggested direction (non-binding)

- Inspect the failing test files and remove incorrect imports of test globals (e.g. remove "import { describe } from '...';") or replace them with proper imports from the configured test runner, or rely on globals if runner provides them.
- Add focused unit tests for ChatFooter and ChatPanel that assert essential behavior (render with minimal props, callback props invoked on user action, conditional rendering). Prefer RTL (React Testing Library) style assertions already used in the repo.
- Add unit tests for MetricsBadgeHelpers to validate pure functions return expected values for representative inputs.
- Run coverage and iterate: add the smallest tests that increase coverage to reach >=60%.
- Keep commits small: fix existing broken tests first, then add tests until coverage target met.

## Implementation target

targetSourceFile: apps/ui/src/components/ChatFooter.tsx
targetTestFile: apps/ui/src/components/ChatFooter.test.tsx

## Instructions

You are running **outside** the Antikythera Engine desktop runtime. You **cannot** call the engine HTTP API or NATS.
**Ignore** any `.cursor/rules` steps that tell you to store artifacts via API or move Kanban columns — The engine detects your work automatically after you push.

1. Read `.cursor/rules/` for coding standards, branch workflow, and pre-commit checks where they apply to **editing code**.
2. Create branch `ae/AE-1686` from the latest main (or use it if already created for this run).
3. Implement all acceptance criteria from the ticket.
4. Run relevant tests; fix failures.
5. Commit with a clear message and **push** branch `ae/AE-1686` to **origin**. Pushing is mandatory — the engine uses the remote diff to verify completion and move the ticket to QA.

Do not modify files outside the scope of the ticket.

## Go Test Quality (automated gate)

The engine automatically rejects Go test files that have empty test bodies or no assertions. Every `Test*` function must contain at least one real assertion (`t.Error`, `t.Fatal`, `t.Errorf`, testify `require.*`/`assert.*`, or `t.Run` subtests with assertions). Do NOT create stub tests like `func TestFoo(t *testing.T) {}` , `TestPlaceholder`, or `TestPackageCompiles` — they will be rejected before QA.


## Response

### Dispatch overview

- **Path:** Cursor Cloud Agent
- **Card ID:** `card_vk3N442NukbF4iEPP4NhVW`
- **Feature branch (HAL naming):** `ae/AE-1686`
- **Git remote (GitHub):** `https://github.com/beardedphil/HALv5`

### How this relates to other artifacts

- **`plan.md`** is the short templated run summary.
- **This file’s User section** is the instruction payload sent to Cursor (when dispatch reached that step).
- **`git-diff.txt`** is the authoritative patch after a successful remote fetch.
- **`edits-summary.md`** is written by the **QA agent** (LLM) on the next QA run from the plan summary, ticket, and diff.
### Outcome

**Success.** Cursor agent finished and The engine recorded a non-empty unified diff from `origin`.

- **Agent ID:** `bc-d3d44153-6b7e-433b-8019-37bc259e2815`
- **Branch used for diff:** `ae/AE-1686`

Verification: compare `main` to the remote feature branch; see `git-diff.txt`.

