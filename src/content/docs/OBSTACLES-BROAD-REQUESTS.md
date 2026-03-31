# Obstacles: HAL Handling Broad Requests Like "Increase Test Coverage to 50%"

*Last updated: 2026-02-28*

## Goal

User asks something like "Increase Test Coverage to 50%" and The engine approaches it intelligently using the LLM for assistance—splitting the work, scoping tasks, and implementing them.

## Current Obstacles (in flow order)

### 1. PM LLM latency / timeout

**What:** PM calls the LLM to refine or split. Large prompts (even after trimming) or slow local models cause timeouts (240s).

**Impact:** Split never completes; user sees failure. Card stays in Active Work.

**Mitigations in place:** Trimmed context, 240s timeout, 20s connect timeout, no retry loop.

**Remaining:** Local models (Ollama, etc.) may still be too slow for split output (5+ full DoR tickets). Options: use faster/smaller model for PM, or two-phase split (LLM lists components first, then generates DoR per component in separate calls).

---

### 2. Duplicate agent triggers

**What:** Multiple CardMoved events for one user action, or race between handlers, caused PM and Implementation to fire repeatedly for the same card.

**Impact:** Wasted LLM calls, confused state, Implementation receiving wrong/stale task (e.g. SPLIT_INTO_TICKETS JSON instead of refined description).

**Mitigations in place:** Atomic check-and-record dedupe (15s window) for PM and Implementation triggers. First handler wins; concurrent duplicates are skipped.

**Remaining:** If the same card is moved to Ready to Do multiple times with genuinely different state (e.g. minutes apart), both will trigger. May need source tracking (e.g. ignore moves initiated by PM's own MoveCard if we can distinguish them).

---

### 3. Stale or wrong task passed to Implementation

**What:** Orchestrator reads title/description from the CardMoved payload. If the card was updated and moved in quick succession, the move event may contain old state. Or multiple moves occur—one with the refined description, another with raw SPLIT_INTO_TICKETS JSON from an earlier failed/partial run.

**Impact:** Implementation receives garbage (raw JSON, wrong sub-ticket) instead of a clean "Add tests for ChatPanel to 50%" task.

**Mitigation needed:** Ensure Implementation always gets the card's current state at trigger time—e.g. fetch fresh card from Kanban before triggering, or ensure PM's UpdateCard is processed and persisted before MoveCard so the payload is correct. Investigate Kanban event ordering.

---

### 4. PM split flow: UpdateCard vs MoveCard ordering

**What:** When PM splits, it publishes UpdateCard (new title/description) then MoveCard. Kanban processes these and may emit CardMoved. The CardMoved payload may be built from state before the UpdateCard is applied, depending on Kanban's implementation.

**Impact:** Implementation receives the pre-split description instead of the first sub-ticket's description.

**Mitigation needed:** Verify Kanban applies UpdateCard before MoveCard when both are in flight, or have PM do a single "update and move" operation. Or: Orchestrator fetches the card from Kanban by ID when handling a move to Ready to Do, instead of trusting the payload.

---

### 5. Implementation agent: "add tests" task shape

**What:** Implementation is optimized for search_replace-style edits. "Add tests for ChatPanel" may require creating new test blocks, understanding coverage gaps, and writing net-new code. The agent uses NEED when it can't find the target—which helps, but the task may still be under-specified (e.g. "which behaviors to test?").

**Impact:** Implementation emits NEED, gets file content, but may produce weak or repetitive tests. Or it may misunderstand the scope.

**Mitigation needed:** Rulebook guidance for test-addition tasks: prefer plan paths that include both source and test files, suggest concrete test cases from the component's exports/props. Consider giving Implementation access to coverage report paths or a "what's uncovered" hint when the task is coverage-related.

---

### 6. Context for "which components need coverage"

**What:** PM and Implementation both need to know which components exist and which have low coverage. Context service indexes codebase but not necessarily coverage reports. PM infers from title + codebase; Implementation infers from task + retrieval.

**Impact:** PM may split into components that don't exist or have different names. Implementation may target the wrong files.

**Mitigation needed:** When the task is coverage-related, consider including coverage report (or a summary) in context, or having a pre-step that runs coverage and injects "components with <50%: X, Y, Z" into the task or context.

---

### 7. No clear "planning" phase for meta-tasks

**What:** "Increase Test Coverage to 50%" is a meta-task: it requires discovery (what's uncovered?), decomposition (which components?), and then execution. Currently PM does decomposition in one LLM call; there's no dedicated discovery step.

**Impact:** PM guesses components from the title and codebase. It may miss some or include wrong ones. The split quality depends on retrieval quality.

**Mitigation needed:** For coverage-like meta-tasks, a two-phase PM flow: (1) "List components in apps/ui/src/components/ with <50% coverage" (could use a script or LLM over coverage output), (2) "For each, produce a sub-ticket." Or: single LLM call with explicit instruction to use codebase context to enumerate real components, and validate the split against the filesystem.

---

## Summary: Highest-leverage fixes

| Priority | Obstacle | Fix |
|----------|----------|-----|
| 1 | Stale task to Implementation | Orchestrator fetches fresh card from Kanban before triggering Implementation, or Kanban guarantees MoveCard payload reflects latest state |
| 2 | UpdateCard/MoveCard ordering | Ensure PM's update is applied before move; or combine into one Kanban operation |
| 3 | Duplicate triggers (Implementation 2+ min apart) | Extend dedupe window, or track trigger source to ignore PM-initiated duplicate moves |
| 4 | PM timeout on split | Two-phase split (list components → generate DoR per component) or faster model |
| 5 | Implementation test-task quality | Rulebook + plan-path rules for "add tests" tasks; consider coverage-aware context |

---

## Implementations applied (2026-02-28)

### 1. Orchestrator: Fetch fresh card before Implementation

- **`cmd/orchestrator/transport/handler_card.go`**: Added `fetchCardFromBoard(workspaceRoot, cardID)` that calls GetBoard, finds the card in activeWork or cardsByColumn, and returns title/description.
- **`handleMoveToReadyToDo`**: Before triggering Implementation, calls `fetchCardFromBoard` and uses the fresh title/description instead of the CardMoved payload. Fallback to event payload if fetch fails or card not found.

### 2. PM: Minimal split format to reduce output size

- **`cmd/pm/app/pm_handler_run.go`**: Updated SPLIT_INTO_TICKETS prompt to use minimal format: `[{"title":"Add tests for X to 50%","description":""},...]` with empty description. `fallbackDoRTemplate` expands from title. Reduces LLM output and mitigates timeout on large splits.

### 3. Extended Implementation dedupe window

- **`cmd/orchestrator/transport/handler.go`**: Added `agentImplTriggerDedupeWindow = 90s` (was 15s) for Implementation triggers.
- **`handler_card.go`**: `tryRecordImplTrigger` now uses the 90s window. Catches duplicate triggers when a card is moved multiple times (e.g. PM split flow, user drags).

### 4. Coverage-aware context for Implementation

- **`cmd/implementation/app/impl_metrics_context.go`** (new): `loadCoverageContext(workspace, task, title)` reads `metrics.json` when task mentions tests/coverage, returns a formatted block with overall %, coverageDetail, line/branch/function breakdown.
- **`cmd/implementation/app/impl.go`**: When `taskMentionsCoverage(task, title)`, prepends coverage context to retrievalBlock before plan and edits. Implementation receives current coverage to target low-coverage areas.

### 5. Implementation rulebook: add-tests task guidance

- **`rulebook/roles/implementation.md`**: Expanded "Test / coverage tasks" section with: (1) coverage context usage, (2) source+test pair loading, (3) read-before-write, (4) tickets like "Add tests for X to 50%", (5) match existing test style.

---

## Post-mortem: HAL-0063 "Identify Uncovered Code" (2026-03-01)

### What the ticket was supposed to do

- **Goal:** Identify Uncovered Code
- **Deliverable:** Something visible and verifiable in the UI (no terminal/devtools)
- **Intent:** Either (a) add UI to show which code lacks coverage, or (b) add tests for uncovered code so coverage improves

### What actually happened

1. **Plan:** The LLM produced a 5-step exploration plan (identify test coverage data, check MetricsBadge, explore API, etc.). It was descriptive, not prescriptive—no concrete "add these tests" or "add this UI element."

2. **First run (failed):** The LLM produced one edit: change `taskWantsTestPairs` → `taskNeedsCoverage` in `impl_metrics_context.go`. That function doesn't exist; build failed.

3. **Second run (retry):** The LLM produced a different edit: change `taskWantsTestPairs` → `taskMentionsCoverage` in `impl_metrics_context.go`. That introduced **infinite recursion** (the function now calls itself). Build passed; bug slipped through.

4. **Result:** Zero tests added. Zero UI changes. Zero identification of uncovered code. The only change was to internal Implementation agent helper code—the opposite of the ticket intent.

### Root causes

| Cause | Detail |
|-------|--------|
| **Wrong files** | The LLM edited `cmd/implementation/app/impl_metrics_context.go` instead of `apps/ui/` or test files. Coverage tasks must touch `.test.ts`, `.test.tsx`, `_test.go`, or UI components—never internal agent helpers. |
| **Vague ticket** | "Identify Uncovered Code" is ambiguous. The plan interpreted it as exploration, not implementation. Better: "Add UI to show coverageDetail in MetricsBadge" or "Add tests for MetricsBadgeHelpers to raise coverage." |
| **Plan → edit disconnect** | The plan listed UI files (api.ts, MetricsBadge.tsx, etc.) but the edits ignored them. No validation that edits match plan paths. |
| **No coverage → file mapping** | `metrics.json` has `coverageDetail` (e.g. "Go: 24.7% line; UI: 81.9% line") but no per-file breakdown. The agent had no clear "add tests for file X" target. |

### Fixes applied

- **`impl_metrics_context.go`:** Restored `taskMentionsCoverage` to call `taskWantsTestPairs` (fix infinite recursion).
- **Rulebook:** Add CODE-COVERAGE-001 to forbid editing internal agent code for coverage tasks.

---

## Post-mortem: HAL-0064 "Increase Test Coverage to 45%" (2026-03-01)

### What the ticket was supposed to do

- **Goal:** Increase test coverage across all modules to 45%.
- **Deliverable:** Coverage report showing ≥ 45%.
- **Intent:** Add tests for low-coverage areas; run coverage tool; verify ≥ 45%.

### What actually happened

1. **Implementation:** Parsed 2 edit(s), applied successfully. One edit targeted `apps/ui/src/appUtils.test.ts`: cosmetic rename ("returns empty" → "returns size zero") and introduced a **syntax error** (`.toBe(0));` — extra `)`). Tests would fail if run.
2. **Coverage:** metrics.json shows 44% (below 45% target). Line coverage and test density decreased (37→36, 87→86) between runs.
3. **QA:** Passed. Report shows "(Demo Mode - Did not implement)" for Build verification, Coverage, Code Quality, UI verification, and AC checklist.
4. **Result:** Zero net coverage improvement. One test broken. Ticket moved to Ready for Human Review with both Implementation and QA claiming success.

### Root causes

| Cause | Detail |
|-------|--------|
| **Implementation never runs tests** | "Applied successfully" means search_replace patches were applied. Implementation does not run `pnpm test` or `bash scripts/check` after applying. A syntax error in a test file passes Implementation. |
| **QA is demo-only** | `cmd/qa/app/orchestrator.go` runs artifact verification only: check that 8 impl artifacts exist. Build, coverage, and test execution are "(Demo Mode - Did not implement)". QA always passes when artifacts are present. |
| **No coverage gate in pipeline** | Pipeline does not run `bash scripts/metrics` (or equivalent) after Implementation to verify coverage improved. `scripts/check` includes metrics but is not invoked by the agent QA flow. |
| **Plan → edit disconnect** | Plan said "add tests for low-coverage areas", "MetricsBadge.test.tsx", "integration and end-to-end tests". Edits produced a trivial rename + syntax error in appUtils.test.ts. No validation that edits satisfy the plan. |

### Recommendations

1. **Implementation:** After applying edits, run `pnpm --dir apps/ui test` (or minimal test subset). Fail the run if tests fail; do not report success.
2. **QA:** Implement build + unit-test execution (or delegate to Tool Gateway). Fail QA if build or tests fail. Coverage gate optional but valuable for coverage tickets.
3. **Coverage tickets:** Add post-apply validation: if `taskMentionsCoverage`, run metrics and fail if coverage did not improve (or require explicit confirmation when coverage is unchanged).

---

## Implementations applied (2026-03-01): HAL-0064 coverage fixes

### 1. Per-package Go coverage in context

- **`internal/coverage/packages.go`** (new): `LowCoveragePackages(workspace, limit)` runs `go test -coverprofile=...`, parses per-package coverage, returns lowest N packages. File cache (`.hal/coverage-packages.txt`, 10 min TTL).
- **`cmd/implementation/app/impl_metrics_context.go`**: `loadCoverageContext` now includes "Lowest coverage packages: cmd/X/app (23.7%), ..." when task mentions coverage.

### 2. Coverage gate for coverage tasks

- **`cmd/implementation/app/impl_apply_post.go`**: `runCoverageGateForCoverageTasks` reads metrics.json, runs `bash scripts/metrics` (METRICS_SKIP_GATE=1), compares before/after. Fails if coverage did not improve.
- **`cmd/implementation/app/impl.go`**: After post-apply validation passes, for `taskMentionsCoverage` tasks, runs coverage gate. Rolls back edits and fails if gate fails.

### 3. PM granular ticket splits for coverage

- **`internal/coverage/packages.go`**: `FormatForPMSplit(workspace, scopePackage)` returns prompt block with low-coverage package list.
- **`cmd/pm/app/pm_handler_run.go`**: When `pmTaskMentionsCoverage(title, desc)`, injects `FormatForPMSplit` into user prompt. System prompt: "IF COVERAGE SPLIT CONTEXT is provided: output SPLIT_INTO_TICKETS with one ticket per package (title format: 'Add tests for pkg'). Eat the elephant one bite at a time."

### 4. Implementation applySuccessBlock extraction

- **`cmd/implementation/app/impl_apply_post.go`**: `applySuccessBlock` helper for diff size outlier, git diff capture, changed-files listing.

---

## Post-mortem: HAL-0153 "Add tests for cmd/context/app" (2026-03-01)

### What the ticket was supposed to do

- **Goal:** Add unit tests for cmd/context/app to increase code coverage.
- **Deliverable:** Tests pass; coverage for cmd/context/app increases to at least 50%.

### What actually happened

1. **Path injection:** Succeeded—"Injected 2 path(s) from title package cmd/context/app" (correct package from title).
2. **LLM output:** Returned 6 search_replace edits targeting handlers_test.go. Edits attempted to modify existing tests rather than add new ones; some old_string referenced source code (handlers.go) not in the test file.
3. **Parse failure:** `Failed to parse edits: invalid character '\t' in string literal`. The LLM embedded literal tab characters in old_string/new_string values. JSON requires `\t` (escaped), not raw tab bytes.
4. **Result:** No edits applied; Implementation failed before apply.

### Root causes

| Cause | Detail |
|-------|--------|
| **Invalid JSON** | LLM output literal tabs in string values. Go's json.Unmarshal rejects control chars (tab, newline) in strings unless escaped as `\t`, `\n`. |
| **Wrong edit intent** | LLM modified existing tests (changing Limit, adding IndexContent) instead of adding NEW test functions. Prompt said "extend" but did not clearly say "add new func TestX". |
| **old_string mismatches** | Some edits referenced code from handlers.go (e.g. `results, err := h.store.QueryWithEmbedding`) which is not in handlers_test.go. |

### Fixes applied

- **`impl_edits_need_helpers.go`:** Added `escapeTabsInJSONStrings(s)` to replace literal tabs inside JSON string values with `\t` before parsing. Preserves tabs as structural whitespace between tokens.
- **`impl_edits.go`:** Minimal coverage prompt now says "Add NEW test functions" and "Do not modify existing tests." Added "Use spaces for indentation (no tab chars in JSON strings)."

### Recommendations (implemented)

1. **Validation:** ~~Consider pre-validating that old_string appears in the provided file contents before applying.~~ **Done.** `validateEditsPreApply` now receives `fileContents`; when old_string not found, uses `findPathContainingString` to detect if it's in a different file and adds hint: "old_string appears in X (wrong file). Copy old_string from the file you're editing." For coverage tasks, adds: "For add-tests: copy old_string from the TEST file, not the source."
2. **Retry with repair:** ~~When parse fails with "invalid character", the repair flow could re-prompt.~~ **Done.** `impl.go` detects repairable parse errors (`invalid character`, `invalid escape`) and calls `fetchEdits` with parse-failure context; uses `hasParseFailure` prompt to ask LLM to fix JSON (escape tabs as `\t`).

---

## Fix: MoveCard rejection / SetActiveWorkMeta spam (2026-03-01)

### Problem

When Active Work WIP limit was reached, the orchestrator could still trigger PM (or other agents) due to race conditions. PM would publish MoveCard, which failed with "WIP limit exceeded". PM continued anyway and called SetActiveWorkMeta, which failed with "card must be in Active Work lane" because the card never moved. The agent would retry SetActiveWorkMeta repeatedly, spamming logs and errors.

### Fix applied

- **`internal/kanban/wait_move.go`** (new): `WaitForMoveToActive(nc, cardID, corrID, moveRaw)` subscribes to `evt.Kanban.CardMoved.v1` and `evt.Kanban.MoveCardRejected.v1`, publishes the move command, and waits up to 3s. Returns `abort=true` if rejected or timeout.
- **PM, QA, Implementation, ProcessReview:** Each agent now calls `kanban.WaitForMoveToActive` after building the MoveCard payload and before calling SetActiveWorkMeta. If the move is rejected, the agent aborts gracefully: emits RunCompleted/ValidationComplete with appropriate status, and does not call SetActiveWorkMeta. The card remains in its original column (Unassigned, Ready to Do, Ready for QA, or Ready for Process Review).

---

## Fix: HAL-0075 "Add tests for cmd/orchestrator/app" (2026-03-01)

### Problem

Ticket HAL-0075 failed repeatedly. Root causes:
1. **Wrong package injected:** The ticket explicitly requested "cmd/orchestrator/app", but `extractPackageFromCoverageTitle` returned "" because cmd/orchestrator is in the coverage exclusion list. Implementation fell back to "lowest-coverage package" (cmd/context) and targeted the wrong files.
2. **cmd/orchestrator/app doesn't exist:** The orchestrator has `transport/`, `storage/`, not `app/`. Even if we used the package, `pathsForPackage` would return empty.
3. **pathsForPackage filtered orchestrator out:** `pathsForPackage` uses `isInternalAgentPath`, so cmd/orchestrator paths were always excluded.

### Fix applied

- **`extractPackageFromCoverageTitle`:** No longer filters out excluded packages. When the ticket title explicitly names a package (e.g. "Add tests for cmd/orchestrator/app"), we honor it. The exclusion applies only to auto-suggested "lowest coverage" packages.
- **`pathsForPackageExplicit`** (new): Variant of pathsForPackage that does NOT skip internal agent paths. Used when the package comes from the title (explicit request).
- **Parent fallback:** When the title package has no files (e.g. cmd/orchestrator/app), try the parent (cmd/orchestrator) and use those paths.

---

## Diagnosis: Why tests aren't being written (2026-03-01)

User observation: "Still don't seem to be writing any tests. Splitting a lot of tickets (100+ from splits), not positive they're all of value. Why aren't we getting tests written? Surely this didn't need to take all day and more?"

### Likely causes (in flow order)

| # | Bottleneck | Effect |
|---|------------|--------|
| 1 | **Split overload** | PM is instructed: "BIAS TOWARD SPLITTING", "When in doubt, SPLIT", coverage tasks "MUST output SPLIT_INTO_TICKETS with ONE ticket per package." So "Increase coverage" → N packages → N tickets. 100+ tickets created. Each needs PM (refine) then Implementation. |
| 2 | **Serial pipeline (WIP=1)** | Only one card in Active Work. With 100 tickets: PM processes one → Ready to Do → Implementation processes one → QA → Done. Next card moves in. 100 tickets × (PM ~1–2 min + Impl ~3–5 min + QA ~1 min) = **8+ hours minimum** even if everything succeeds. |
| 3 | **Coverage gate may roll back good work** | For coverage tasks, `runCoverageGateForCoverageTasks` compares **overall** `testCoverage` (weighted composite) before/after. Adding tests for one small package (e.g. cmd/context) may move overall by 0–1 point. Metric rounding/variance can make `after <= before` → rollback even when the package improved. |
| 4 | **Implementation edits may fail earlier** | Plan→edit disconnect, wrong files (CODE-COVERAGE-001 violations), old_string mismatch, syntax errors in test code → post-apply validation fails → rollback. No tests persist. |
| 5 | **PM throttle (new)** | 5s global throttle for PM triggers. With 100 Unassigned cards, we trigger PM for one every 5s. That alone is 500s ≈ 8 min before all get a PM run. Not the main bottleneck but adds latency. |

### Highest-leverage fixes

1. **Reduce split granularity for coverage**  
   - Option A: PM splits into ~5–10 "batches" (e.g. "Add tests for cmd/context, cmd/kanban/domain, cmd/kernel") instead of one-per-package.  
   - Option B: Add env knob `HAL_COVERAGE_SPLIT_MAX=10` — cap tickets per coverage split.  
   - Cuts ticket count from 100+ to 10–20; pipeline completes in 1–2 hours instead of 8+.

2. **Per-package coverage gate for coverage tasks**  
   - Instead of overall `testCoverage`, run `go test -coverprofile` for the target package, parse coverage for that package only, fail only if that package's coverage did not improve.  
   - Prevents rollback of valid per-package improvements when overall metric barely moves.

3. **Diagnostic: inspect recent Implementation runs**  
   - Run `pnpm hal:ticket HAL-XXXX` for a few coverage tickets.  
   - Check: Did Implementation produce edits? Did post-apply (build/test) pass? Did coverage gate fail?  
   - Identifies whether the blocker is: no edits, bad edits, or gate.

4. **Optional: relax "when in doubt, SPLIT" for coverage**  
   - For coverage tasks, allow slightly larger tickets (e.g. "Add tests for cmd/context and cmd/kanban/domain") so fewer tickets, faster throughput.

---

## Fixes applied (2026-03-02): Edit validation and empty-file handling

Diagnosis showed Implementation was failing due to: (1) old_string too short heuristic blocking valid edits, (2) empty old_string rejected when file exists but is empty (no tests yet), (3) LLM producing invalid code. Applied language-agnostic fixes:

### 1. Relaxed old_string too-short heuristic

- **`impl_validate.go`**: Short old_string (&lt; 12 chars) is now allowed when it appears **exactly once** in the file (unambiguous). Still rejected when it appears multiple times, with message: "old_string too short and appears N times—use a longer unique substring".

### 2. Empty old_string: empty files and append

- **`impl_apply.go`**: `old_string: ""` is now accepted in three cases: (1) file does not exist → create, (2) file exists but is empty → overwrite with full content, (3) file has content → **append** new_string to the end. Case (3) covers appending to a test file when there is no good anchor for old_string.

### 3. Prompt improvements (language-agnostic)

- **`impl_edits.go`**: (1) Clarified rule (3): "New or empty files" — `old_string: ""` applies when the file does not exist **or** exists but is empty. (2) Added rule (5): "Output valid, compilable code. Only reference symbols that exist in the source. Use spaces (not tabs) for indentation in JSON string values." (3) Coverage-task prompt for no test file: "No test file exists yet. Create one: use old_string \"\" and new_string \"&lt;full file content&gt;\"" (4) Coverage-task prompt: "Output valid, compilable code. Only reference symbols that exist in the source—never invent function or type names."

### 4. Tests

- **`handlers_test.go`**: Updated `TestValidateEditsPreApply_OldStringTooShort` to use a short string that appears multiple times (`\n`). Added `TestApplySearchReplaceEdits_EmptyFile` and `TestApplySearchReplaceEdits_Append` for the empty-file and append paths.

---

## Fix: HAL-0296 Implementation failures (2026-03-02)

### Problem

Ticket HAL-0296 (Add tests for cmd/context/app) failed in multiple runs. Root causes:

| Cause | Detail |
|-------|--------|
| **Repair produced wrong file** | After validation failed, repair pass returned edit for `vitest.config.ts` instead of `handlers_test.go`. |
| **NEED returned wrong files** | Query "test cases for cmd/context/app" hit semantic search; returned `apps/ui/package.json` instead of cmd/context files. |
| **Test file blocked by 200-line cap** | Valid test additions (~234 lines) hit CODE-FILESIZE-001. |
| **LLM used placeholder** | `old_string: "func TestHandlers_HandleQuery(t *testing.T) {...}"` instead of exact content. |
| **No wrong-file rejection** | Repair/NEED retry could produce edits for a different path than the one that failed. |

### Fixes applied

1. **Repair path lock** (`impl_validation_repair.go`): Added `extractPathFromValidationError` to parse target path from validation errors. Repair and NEED retry now pass `explicitTargetPath` and prepend "CRITICAL: You MUST use path X only" to the prompt. `repairEditsTargetSameFile` rejects repairs that target a different file.

2. **Coverage NEED: prefer package over semantic search** (`impl_edits_need.go`, `impl_metrics_context.go`): Broadened `isCoveragePhraseQuery` to match "test cases", "test"/"tests" + path-like. Added `extractPackageFromNeedQuery`. For coverage tasks, when the NEED query contains a package path (e.g. "test cases for cmd/context/app"), fetch that package's files via `pathsForPackageExplicit` instead of semantic search. `gatherLowCoveragePackageContent` now accepts `title` and prefers package from title when present.

3. **Test file size exemption** (`impl_validate.go`, `coding.yml`): Added `testFileMaxLines = 350` for `*_test.go`, `.test.ts`, `.test.tsx`. Valid test additions under 350 lines are no longer rejected by CODE-FILESIZE-001.

4. **Strengthen old_string prompt** (`impl_edits.go`): Added "old_string must be an exact copy-paste—never use placeholders like {...} or ..." to editFormat, repair system message, and coverage prompts.

5. **Wrong-file rejection** (`impl_validation_repair.go`): `repairEditsTargetSameFile` validates repaired and needEdits; if any edit targets a path different from the failed file, reject and fail fast.

---

## Fix: LLM backtick strings in edit JSON (HAL-0420, 2026-03-02)

### Problem

Implementation failed with `invalid character '\`' looking for beginning of value`. The LLM output JavaScript template literals (backticks) instead of JSON double-quoted strings for multi-line values:

```json
"new_string": `func TestChatQueryContext(t *testing.T) { ... }`
```

JSON requires double-quoted strings; backticks are invalid.

### Fix applied

- **`impl_edits_need_helpers.go`**: Added `fixBacktickStringsInJSON(s)` to convert `"key": `...`` patterns to proper `"key":"..."` before parsing. Invoked from `sanitizeEditJSON`. Handles escaped backticks (`\``), newlines, and optional whitespace after the colon.

---

## Fix: Coverage tasks editing source instead of test file (HAL-0437, 2026-03-02)

### Problem

Implementation failed with CODE-COVERAGE-001: the LLM edited `chat_helpers.go` (source) instead of `chat_helpers_test.go` (test). The prompt said "path MUST end with _test.go" but the model was given both paths in "Target:" and chose the wrong one.

### Fix applied

- **`impl_paths.go`**: Added `filterToTestPathsForCoverage(paths)`—returns only `*_test.go`, `.test.ts`, `.test.tsx` paths; for source `.go` files, derives the `_test.go` path and excludes the source.
- **`impl_edits.go`**: For coverage tasks with file contents, uses the filtered list for the "Target:" line. Source files stay in file contents for context; only test paths are valid edit targets.
- **`rulebook/rules/CODE-COVERAGE-001.md`**: Documented the structural constraint.

---

## Fix: hal-ticket showing wrong ticket's runs (HAL-0442 confusion, 2026-03-02)

### Problem

`pnpm hal:ticket HAL-0442` showed Implementation runs that had "Created worktree for hal/HAL-0412" and worktree errors for HAL-0412. HAL-0442's runs were conflated with HAL-0412's because both tickets shared the title "Add tests for cmd/context/app". `findAllRunsForCard` matched by title when cardID didn't match, so HAL-0412's runs appeared under HAL-0442.

### Fix applied

- **`cmd/hal-ticket/main.go`**: `findAllRunsForCard` now requires cardID match only. Removed title fallback that caused cross-ticket contamination. Runs are associated by the Card ID in plan.md, not by title similarity.

---

## Fix: Coverage task targeting wrong package (HAL-0060, 2026-03-08)

### Problem

"Add tests for cmd/move-blocked-to-ready" failed repeatedly. Both Qwen and GPT produced edits for `cmd/kanban/storage/db_test.go` (and logger_test.go) instead of creating `cmd/move-blocked-to-ready/main_test.go`. The LLMs were not at fault—they received the wrong file context.

**Root cause:** For coverage tasks that name a package, the pipeline injects target + dependency paths (e.g. `cmd/move-blocked-to-ready` + `cmd/kanban/storage`, `cmd/kanban/domain`). `reorderPathsForTestCoverage` put (source, test) pairs that **both exist** first. Storage has (db.go, db_test.go); move-blocked-to-ready has (main.go, "") with no main_test.go yet. So the pair-based flow processed (db.go, db_test.go) first. The LLM saw storage files and was asked to "add tests for cmd/move-blocked-to-ready"—it edited what it was given. Both models received the same wrong context, so both failed the same way.

### Why the LLM should have had enough info on retry

On retry, the pipeline sent the same pair again (db.go, db_test.go) because the ordering was deterministic and wrong. The failure/repair context did not change which pair was processed first. So the second attempt had the same broken context.

### Fix applied

- **`impl_paths_gather.go`**: `reorderPathsForTestCoverage` now accepts `title`. When the title names an explicit package (e.g. via `ExtractPackagesFromCoverageTitle`), paths from that package are ordered **first** (`explicitFirst`), before dependency packages with existing tests. For "Add tests for cmd/move-blocked-to-ready", (main.go, "") is now the first pair, so the LLM receives the actual target.

---

## Post-mortem: HAL-0007 "Add tests for cmd/context-reembed" (2026-03-09)

### What the ticket was supposed to do

- **Goal:** Add unit tests for cmd/context-reembed component.
- **Deliverable:** main_test.go with tests for the reembed CLI (HTTP POST to Kernel, success/failure paths).
- **Intent:** Cover the main-only package by running the binary as a subprocess against a mock HTTP server.

### What actually happened

1. **PM:** Refined ticket; scaffold created `main_test.go` with minimal content: `package main` + `import "testing"` only (no test functions).
2. **Implementation (run_ms82da1h0):** Produced proper tests (`TestContextReembed_Success`, `TestContextReembed_Failure`) using httptest + exec.Command. Post-apply validation and coverage gate passed.
3. **QA (run_zd7aczuof, run_z6m522504):** Failed. `go test ./...` reported `cmd/context-reembed/main_test.go: "testing" imported and not used` — the branch had the scaffold stub, not the Implementation's full tests.
4. **Result:** Ticket failed QA despite Implementation having produced correct, passing tests.

### Root causes

| Cause | Detail |
|-------|--------|
| **Scaffold creates compile-breaking stubs** | `internal/scaffold/scaffold.go` writes `package X` + `import "testing"` with no test functions. Go rejects "testing imported and not used". A minimal passing stub would be `func TestPlaceholder(t *testing.T) {}`. |
| **Implementation edits may not reach branch** | Implementation runs in a worktree; its changes may not be committed/merged to the branch QA runs against. changed-files.md for run_ms82da1h0 listed only metrics.json, suggesting main_test.go was not in the captured diff. |
| **QA runs go test ./...** | QA fails if any package in the repo has a broken test file. Stub files or other in-flight tickets (hal-run, docgen, hal-ticket also had "testing imported and not used") cause cross-ticket failures. |
| **main-only packages need subprocess tests** | `cmd/context-reembed/main.go` has no exported API; the only way to test is run the binary with KERNEL_URL pointing at a mock server. Implementation correctly produced that pattern. |

### Fix applied (to make ticket pass)

- **`cmd/context-reembed/main_test.go`:** Restored proper tests: `TestContextReembed_Success` (httptest server returns 202, run `go run .` via exec, assert stdout contains "Context re-embed triggered.") and `TestContextReembed_Failure` (server returns 400, assert non-zero exit). Uses `runtime.Caller` to resolve test dir for `exec.Command` so tests work from any CWD.

### Process improvements for similar tickets

1. **Scaffold stub quality:** Change `minimalContent` for Go to include `func TestPlaceholder(t *testing.T) {}` so the stub compiles. Implementation will overwrite when `old_string==""` and `new_string` starts with `package ` (impl_apply.go line 131–133).
2. **Ensure Implementation commits to branch:** Verify that Implementation worktree changes are committed to the ticket branch before QA runs. If QA runs against a different ref, failures will not match Implementation output.
3. **QA scope:** Consider running `go test ./cmd/context-reembed/...` (ticket target only) for coverage tickets, or fix all broken test files in the repo before failing a single ticket. Current `go test ./...` fails the whole run on any broken package.
4. **Rulebook:** Add guidance for main-only CLI packages: test by running the binary with env vars (e.g. KERNEL_URL) pointing at httptest. This pattern is already in impl_edits.go for "temp DB" but could be explicit for HTTP-backed CLIs.
