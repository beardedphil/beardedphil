# Plan: Ticket Automation Demo (Unassigned → Ready for Human Review)

## Overview

Tickets in **Unassigned** should automatically flow through the pipeline to **Ready for Human Review**, with demo versions of all artifacts. Each agent (PM, Implementation, QA) runs in "demo mode" when appropriate: PM refines to DoR, Implementation creates 8 placeholder artifacts, QA verifies artifacts and creates demo QA report.

---

## 1. Remove Inspector Button

**Location:** `apps/ui/src/App.tsx`

- Remove the Inspector button from the header (line ~207–209).
- Remove `inspectorRunId` state, `InspectorPrompt`, and `Inspector` components and their imports.
- Keep `Inspector` and `InspectorPrompt` components in the codebase (they may be used elsewhere); only remove from the header and wiring.

---

## 2. Orchestrator: Bootstrap for Existing Unassigned Tickets

**Problem:** PM is triggered only on `CardCreated` (in Unassigned) and `CardMoved` (to Unassigned). Tickets that already exist in Unassigned at startup are never processed.

**Solution:** On orchestrator startup, fetch the board via NATS and trigger PM for every card in Unassigned.

**Location:** `cmd/orchestrator/transport/handler.go`

**Changes:**
- Add `bootstrapUnassigned()` or similar, called from `Start()` after subscriptions.
- Use NATS request-reply for `cmd.Kanban.GetBoard.v1`:
  - Publish `cmd.Kanban.GetBoard.v1` with a unique `correlationId`.
  - Subscribe to `evt.Kanban.GetBoard.Result.v1` (or a wildcard) and wait for the matching result (or use `nc.Request` if Kanban supports reply inbox).
- **Alternative:** Kanban currently publishes events only (no reply). Add a short-lived subscription to `evt.Kanban.GetBoard.Result.v1`, publish `cmd.Kanban.GetBoard.v1`, and wait for the first result (with timeout, e.g. 5s).
- Parse `GetBoard.Result` payload: `columns`, `activeWork`, `cardsByColumn`.
- For each card in `cardsByColumn["Unassigned"]`, publish `cmd.PM.RunRequested.v1` with `cardId`, `title`, `description` (same shape as `onCardCreated`).

**Kanban integration:** The Kernel routes HTTP commands to NATS. The orchestrator uses NATS directly. Kanban subscribes to `cmd.Kanban.>` and publishes `evt.Kanban.GetBoard.Result.v1`. The orchestrator must:
1. Subscribe to `evt.Kanban.GetBoard.Result.v1` before publishing the command.
2. Publish `cmd.Kanban.GetBoard.v1` with a unique correlationId.
3. On first `GetBoard.Result` (or match by correlationId if payload includes it), parse and process.

**Note:** `GetBoard.Result` may not include correlationId in payload. Check `cmd/kanban/app/get_board.go` and `transport/handlers.go`. The event envelope has `correlationId`; use that for matching if the bootstrap uses a request-reply pattern.

---

## 3. PM Agent (Minimal Changes)

**Current behavior:** `HandleRunRequested` already:
- Moves card to Active Work
- Refines description via LLM to match Definition of Ready (rulebook template)
- Updates card
- Moves to Ready to Do

**Required:** Ensure PM uses `rulebook/ticket-template-and-definition-of-ready.md` (or equivalent content) in its system prompt. The current prompt in `cmd/pm/app/handler.go` already lists the required sections. No structural changes needed.

**Definition of "only two fields":** Any Unassigned card is eligible. PM refines all such tickets. No extra filtering.

---

## 4. Implementation Agent: Demo Mode

**Current behavior:**
- Triggered when card moves to Ready to Do.
- Moves card to Active Work.
- Calls `HandlePlanRequest` (LLM plan), emits `PlanReady.v1`.
- Does **not** create artifacts or move to Ready for QA.

**Required changes:**

### 4.1 Implementation service (`cmd/implementation/`)

**Add `documentWork()`:**
- Input: `runID`, `cardID`, `workspaceRoot`.
- Creates `~/.hal/runs/<runID>/` if needed.
- Writes 8 artifacts (from `rulebook/policies/artifacts.yml`):
  - `plan.md`
  - `worklog.md`
  - `changed-files.md`
  - `decisions.md`
  - `verification.md`
  - `pm-review.md`
  - `git-diff.txt`
  - `instructions-used.md`
- Each file contains only: `(Demo Mode - Did not implement)`.
- Load artifact list from artifacts policy or hardcode per `implementation_artifacts` in `artifacts.yml`.

**Add `implementTicket()`:**
- No-op for now (empty function).

### 4.2 Implementation flow

**Location:** `cmd/implementation/transport/handler.go` and `app/handlers.go`

1. On `Implementation.RunRequested.v1`:
   - Move card to Active Work (already done).
   - Call `implementTicket()` (no-op).
   - Call `documentWork(runID, cardID, workspaceRoot)`.
   - Publish `evt.Implementation.RunCompleted.v1` with payload `{cardId, runId}`.
   - Move card to Ready for QA via `cmd.Kanban.MoveCard.v1`.

### 4.3 New event: `evt.Implementation.RunCompleted.v1`

- Payload: `{cardId: string, runId: string}`.
- Orchestrator subscribes and stores `cardToImplRun[cardId] = runId` for QA.

---

## 5. Orchestrator: Handle Implementation.RunCompleted

**Location:** `cmd/orchestrator/transport/handler.go`

- Add subscription to `evt.Implementation.RunCompleted.v1`.
- Store `cardToImplRun[cardId] = runId` (new map or reuse `cardToRun` semantics).
- When publishing `cmd.QA.RunRequested.v1` for a card moved to Ready for QA, include `implRunId` in the payload so QA can verify artifacts.

---

## 6. QA Agent: Demo Mode

**Current behavior:**
- Triggered when card moves to Ready for QA.
- Moves card to Active Work.
- Runs Playwright E2E (`pnpm e2e`).
- Writes `qa-report.md`, `manifest.json`, and `implementation-agent-note.md` (on FAIL).
- Moves to Ready for Human Review (PASS) or Ready to Do (FAIL).

**Required changes:**

### 6.1 Demo mode behavior

For demo mode, QA should:
1. Move card to Active Work (already done).
2. Look up `implRunId` from the request payload.
3. Verify the 8 implementation artifacts exist in `~/.hal/runs/<implRunId>/`.
4. Create demo versions of QA artifacts:
   - `qa-report.md` with placeholder sections and `(Demo Mode - Did not implement)` content.
   - `manifest.json` (as today).
5. Skip Playwright E2E (or run it but treat failures as non-blocking for demo).
6. Move card to **Ready for Human Review** (always PASS in demo mode).

### 6.2 QA request payload

Extend `domain.RunRequest` (or equivalent) to include `ImplRunID *string`. Orchestrator sets it from `cardToImplRun[cardId]` when publishing `QA.RunRequested`.

### 6.3 Artifact verification

- If `implRunId` is provided, check that all 8 files exist in `~/.hal/runs/<implRunId>/`.
- If any missing, optionally log warning but still proceed (demo mode is tolerant).
- Write demo `qa-report.md` with structure from `rulebook/roles/qa.md` but content `(Demo Mode - Did not implement)` for each section.

---

## 7. End-to-End Flow Summary

```
Unassigned (minimal ticket)
    │
    ▼ [PM.RunRequested - on CardCreated, CardMoved to Unassigned, or bootstrap]
PM Agent
    │ Move to Active Work → Refine to DoR → Update card → Move to Ready to Do
    ▼
Ready to Do
    │
    ▼ [Implementation.RunRequested - on CardMoved to Ready to Do]
Implementation Agent
    │ Move to Active Work → implementTicket() (no-op) → documentWork() (8 demo artifacts)
    │ Publish Implementation.RunCompleted
    │ Move to Ready for QA
    ▼
Ready for QA
    │
    ▼ [QA.RunRequested - on CardMoved to Ready for QA, with implRunId]
QA Agent
    │ Move to Active Work → Verify 8 artifacts → Create demo qa-report.md
    │ Skip/relax Playwright → Move to Ready for Human Review
    ▼
Ready for Human Review
```

---

## 8. File Changes Checklist

| File | Change |
|------|--------|
| `apps/ui/src/App.tsx` | Remove Inspector button, state, and Inspector/InspectorPrompt from header |
| `cmd/orchestrator/transport/handler.go` | Bootstrap Unassigned on startup; subscribe to `Implementation.RunCompleted`; pass `implRunId` to QA |
| `cmd/implementation/transport/handler.go` | After plan/documentWork, publish RunCompleted, move card to Ready for QA |
| `cmd/implementation/app/handlers.go` | Add `documentWork()`, `implementTicket()` (no-op); wire into RunRequested flow |
| `cmd/qa/app/orchestrator.go` | Add demo mode: verify 8 impl artifacts, write demo qa-report, always move to Ready for Human Review |
| `cmd/qa/domain/` | Add `ImplRunID` to run request payload |
| `rulebook/policies/artifacts.yml` | (Reference only) already defines 8 implementation artifacts |

---

## 9. Implementation Order

1. Remove Inspector button (quick win).
2. Add `documentWork()` and `implementTicket()` to Implementation; wire into RunRequested; publish RunCompleted; move to Ready for QA.
3. Orchestrator: subscribe to Implementation.RunCompleted; extend QA.RunRequested payload with implRunId.
4. QA: add demo mode (verify artifacts, demo qa-report, skip/relax E2E, move to Ready for Human Review).
5. Orchestrator: bootstrap Unassigned on startup (GetBoard + trigger PM for each Unassigned card).

---

## 10. Feature Branch Workflow (Implemented 2026-03-01)

When a card has a display number, The engine uses feature branches:

1. **Implementation start:** Create git worktree at `.hal/worktrees/HAL-NNNN` for branch `hal/HAL-NNNN`. Apply edits there. Commit after successful apply. Main repo is never touched—no "uncommitted changes" conflicts. Multiple agents can run simultaneously.
2. **QA pass:** Merge feature branch into `main`, push to `origin`. Then move card to Ready for Human Review (so human reviews in real app environment).
3. **Branch stored:** Card description gets `- **Branch:** hal/HAL-NNNN` in Implementation artifacts section; QA parses this for merge.

**Opt-out:** `HAL_DISABLE_GIT_BRANCH_WORKFLOW=1` disables branch creation, commits, and merge/push.

**Rule GIT-MAIN-001:** Main stays clean. No one makes changes on main directly. See `rulebook/rules/GIT-MAIN-001.md`.

---

## 11. References

- Ticket template and DoR: `rulebook/ticket-template-and-definition-of-ready.md`
- Implementation artifacts: `rulebook/roles/implementation.md`, `rulebook/policies/artifacts.yml`
- QA artifacts and flow: `rulebook/roles/qa.md`
- Old ticket template: `old_hal/portfolio-2026-hal/docs/templates/ticket.template.md` (reference; use current rulebook version)
