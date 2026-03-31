# Plan: Rulebook Compliance + Summary-Based Embedding

## Vision

1. **Comply with the rulebook** — Keep files ≤200 lines (CODE-FILESIZE-001), single-purpose.
2. **Add a summary comment at the top** of each file describing what it does.
3. **Embed summaries instead of code** — Context indexes file summaries for retrieval; queries like "Remove Refresh button from header" match "header with Refresh button" in `App.tsx`'s summary.
4. **Send whole files** — Because files are small, we can include full content in prompts when needed.

## Current State: Rulebook Violations

| File | Lines | Limit | Status |
|------|-------|-------|--------|
| cmd/implementation/app/impl.go | 1837 | 200 | **9x over** |
| cmd/pm/app/handler.go | 861 | 200 | **4x over** |
| cmd/kernel/transport/http.go | 475 | 200 | **2x over** |
| apps/ui/src/components/ChatPanel.tsx | 470 | 200 | **2x over** |
| cmd/orchestrator/transport/handler.go | 411 | 200 | **2x over** |
| cmd/implementation/transport/handler.go | 372 | 200 | **2x over** |
| apps/ui/src/components/ChatFooter.tsx | 343 | 200 | over |
| cmd/qa/app/orchestrator.go | 317 | 200 | over |
| cmd/implementation/app/handlers.go | 279 | 200 | over |
| apps/ui/src/App.tsx | ~781 | 200 | **4x over** |

Many other files are over 200 lines. The rulebook says new files must be ≤200; existing violations block the embedding strategy.

## Summary Comment Convention

Proposed format (language-appropriate):

```go
// impl.go: Implementation agent core logic. Plan fetching, edit generation (NEED protocol),
// validation, apply, rollback. Delegates to fetchPlan, fetchEdits, validateEditsPreApply.
```

```tsx
// App.tsx: Main Antikythera Engine layout. Renders header (Refresh, New Ticket, workspace selector),
// Board, CardDetail, ChatFooter, modals. Orchestrates workspace, mode, and card state.
```

Context would index `path + summary` instead of `path + first 2000 chars of code`. Semantic search would match intent.

## Context Service Changes

**Current:** `IndexPaths` stores `path + snippet` (first 2000 chars of file content). No embeddings on bootstrap.

**Proposed:**
1. When indexing a path, **extract the summary** — first block comment or docstring (first 2–5 lines after `//` or `/*` or `/**`), or fall back to first N chars if no clear summary.
2. **Store path + summary** for retrieval instead of path + code snippet.
3. Optionally **embed summaries** on bootstrap (would require HandleEmbed to embed each doc, or a new flow).

## Phased Approach

### Phase 1: Establish the convention
- Add summary comments to the 5–10 most critical files (App.tsx, impl.go entry points, etc.).
- Document the convention in rulebook or CONTRIBUTING.
- No Context changes yet; validate that summaries help humans reason.

### Phase 2: Context indexes summaries
- Extend `IndexPaths` or add `IndexPathsWithSummaries`: read each file, extract summary (regex/heuristic for `//` and `/*` blocks), store path + summary.
- Keep keyword fallback for queries that don’t match summaries.
- Test retrieval for "Remove Refresh button from header" → App.tsx.

### Phase 3: Refactor large files
- Break `impl.go` into focused packages: `impl/plan`, `impl/edits`, `impl/validate`, `impl/apply`.
- Split `handler.go` (PM), `http.go` (kernel), ChatPanel, ChatFooter, etc.
- Add summary to each new file.
- Enforce 200-line limit in CI or pre-commit.

### Phase 4: Full-file inclusion
- When retrieval returns a small file (e.g. <150 lines), include full content in the plan/edits prompt by default.
- Reduces NEED rounds for well-structured codebases.

## File Extraction Heuristic

```go
// ExtractSummary reads the first comment block (// or /* */) from file content.
// Falls back to first 200 chars if no clear block comment.
func extractSummary(content string, ext string) string {
    // For .go, .ts, .tsx: match // ... or /* ... */ at start
    // For .md: first paragraph
    // Return trimmed, max 300 chars
}
```

## Open Questions

1. **Summary extraction** — How to reliably get "what this file does" from varying comment styles (//, /* */, #, """)?
2. **Mixed indexing** — Index both summary and first N chars of code, or summary only? Summary-only is cleaner for "which file" but loses inline matches.
3. **Orchestration** — Who runs the refactor? Piecemeal by agent (risky) vs. dedicated human-led passes.

## Next Step

**Phase 1** is low-risk: add summary comments to App.tsx and impl.go (or their logical top-level sections) and document the convention. No structural refactor yet.

---

## Implementation Log (2025-02-27)

### Phase 4: Full-file inclusion ✅
- Added `gatherSmallFileContents(workspace, paths, maxLines, maxBytes)` — includes full content only for files with ≤150 lines.
- In minimal context mode, pre-loads small files from plan paths (retrieval results) before calling `fetchEdits`. Reduces NEED rounds when retrieval finds the right file.
- Threshold: 150 lines, 20KB total. NEED protocol remains for wrong-file or large-file cases.

### Phase 3: Refactor impl.go ✅
- Split `impl.go` (was 1837 lines) into focused files in package `app`:
  - `impl.go` (428): RunImplementation orchestration, types (SearchReplaceEdit, LLMTranscript, ImplResult).
  - `impl_load.go` (69): loadQAContext, loadPriorImplContext, loadPriorGitDiff.
  - `impl_paths.go` (285): Path extraction, filterEditsByAllowedPaths, gatherSmallFileContents, gatherFileContentsForPaths.
  - `impl_plan.go` (117): fetchPlan, queryContext.
  - `impl_tree.go` (124): buildDirTree, gatherContext.
  - `impl_edits.go` (390): fetchEdits, NEED protocol, parseEdits.
  - `impl_validate.go` (249): validateCodingLimits, validateEditsPreApply, fuzzyFindBlock.
  - `impl_apply.go` (280): resolveEditPath, applySearchReplaceEdits, rollback, build check.
- Each new file has a summary comment. Build verified.

### Phase 3 (cont.): Refactor PM handler.go (2025-02-28) ✅
- Split `cmd/pm/app/handler.go` (was 401 lines) into focused files:
  - `handler.go` (82): Handler struct, constructors, HandleAgentChatRequest, constants.
  - `pm_handler_chat.go` (137): HandleChatRequest, LLM gateway call, NEED protocol.
  - `pm_handler_intent.go` (115): executeChatIntent, extractJSONObject (create_card, delete_card, move_card).
  - `pm_handler_run.go` (198): HandleRunRequested, publishMoveToUnassigned.
- All PM app files now ≤200 lines. Build verified.

### Phase 3 (cont.): Refactor App.tsx (2025-02-28) ✅
- Split `apps/ui/src/App.tsx` (was 754 lines) into:
  - `App.tsx` (128): Main layout, composes AppHeader, Board, modals, ChatFooter.
  - `AppHeader.tsx` (89): Header with mode toggle, workspace, Refresh, New Ticket.
  - `appUtils.ts` (36): getCardIdsInWillNotImplement, cleanAgentSessionsForWNI, formatBoardSummary.
  - `useAppData.ts` (142): State, effects, handlers, orchestrates useBoardFetch and useSSE.
  - `useBoardFetch.ts` (113): fetchBoard logic, parse/merge agent chat from API response.
  - `appSSEHandler.ts` (195): createAppSSEHandler for Kanban/PM/Agent SSE events.
- All files ≤200 lines. UI build verified.

### Phase 3 (cont.): Refactor kernel http, ChatPanel, ChatFooter (2025-02-28) ✅
- Split `cmd/kernel/transport/http.go` (was 449 lines) into:
  - `http.go` (89): Handler type, NewHandler, Mux, corsHandler, allowedOrigins, version.
  - `kernel_http_metrics.go` (133): metricsRefresher, metricsHandler, metricsRefreshHandler.
  - `kernel_http_handlers.go` (142): settingsProxyHandler, llmReadyHandler, healthHandler, commandHandlerFunc, eventsHandlerFunc, readBody.
  - `kernel_http_workspace.go` (~125): ensureWorkspaceDir, workspaceHandler, boardHandler, workspacePickHandler.
- Split `apps/ui/src/components/ChatPanel.tsx` (was 458 lines) into:
  - `ChatPanel.tsx` (165): Main component, state, layout, form.
  - `ChatPanelHeader.tsx` (127): Header with title, STOP, End chat, expand, close.
  - `ChatPanelContent.tsx` (~165): Scrollable content, agent progress, messages.
  - `LLMTranscriptViewer.tsx` (~100): Expandable LLM transcript blocks.
  - `chatPanelUtils.tsx` (19): EXPAND_ICON, MINIMIZE_ICON, CLOSE_ICON.
  - `chatUtils.ts` (13): formatCardLabel, sessionKey (shared with ChatFooter).
- Split `apps/ui/src/components/ChatFooter.tsx` (was 327 lines) into:
  - `ChatFooter.tsx` (184): State, effects, composes ChatFooterTabs + ChatPanel.
  - `ChatFooterTabs.tsx` (153): Pill buttons and dropdown for engine + agent sessions.
- All kernel and UI files ≤200 lines. Builds verified.

### Phase 3 (cont.): Refactor impl_edits, impl_paths, impl_apply, impl_validate (2025-02-28) ✅
- Split `cmd/implementation/app/impl_edits.go` (was 373 lines) into:
  - `impl_edits.go` (~170): fetchEdits orchestration, prompt building, initial LLM call.
  - `impl_edits_need.go` (~190): stripMarkdownCodeBlock, extractNeedQuery, isPathLikeNeed, fetchNeedContent, parseEdits, runNeedProtocol, needRoundLLMCall, runNeedRecovery.
- Split `cmd/implementation/app/impl_paths.go` (was 281 lines) into:
  - `impl_paths.go` (~246): Path extraction, filterEditsByAllowedPaths, extractPathsFromTask, extractPathsFromPriorArtifact.
  - `impl_paths_gather.go` (~65): gatherSmallFileContents, gatherFileContentsForPaths.
- Split `cmd/implementation/app/impl_apply.go` (was 271 lines) into:
  - `impl_apply.go` (~177): resolveEditPath, applySearchReplaceEdits, editsToPaths, rollbackPaths.
  - `impl_apply_post.go` (~113): runPostApplyValidation, runBuildCheck, captureGitDiff, listChangedFiles.
- Split `cmd/implementation/app/impl_validate.go` (was 231 lines) into:
  - `impl_validate.go` (~191): validateCodingLimits, validateEditsPreApply, constants.
  - `impl_validate_fuzzy.go` (~65): normalizeLineForMatch, fuzzyFindBlock.
- Split `cmd/implementation/transport/handler.go` (was 359 lines) into:
  - `handler.go` (~185): Start, subscribe callback, ApplyPatch/PlanRequest, handleStopRun, handleAgentChatRequest, buildRunContext.
  - `handler_run.go` (~175): handleRunRequested, publishAgentEvent, publishLLMTranscript, replaceOrAppendArtifactSection, publishRunCompletedCardUpdates.
- Split `cmd/orchestrator/transport/handler.go` (was 411 lines) into:
  - `handler.go` (~240): Start, bootstrapUnassigned, onImplRunCompleted, onQARunCompleted, truncateForLog.
  - `handler_card.go` (~215): onCardCreated, onCardMoved, handleMoveToReadyForQA, handleMoveToProcessReview, handleMoveToReadyToDo, handleMoveToUnassigned.
- Split `cmd/context/storage/store.go` (was 273 lines) into:
  - `store.go` (~104): Store struct, NewStore, IndexPaths, IndexContent, AddEmbedding, Query, Result, DBPath.
  - `store_summary.go` (~80): extractSummary, indexExcludedPath.
  - `store_query.go` (~100): QueryWithEmbedding, sortResultsByScore, cosineSim.
- Split `apps/ui/src/CardDetail.tsx` (was 308 lines) into:
  - `CardDetail.tsx` (~120): Main component, state, overlay, composes CardDetailForm.
  - `CardDetailUtils.ts` (~42): parseSections, extractArtifactLinks.
  - `CardDetailForm.tsx` (~183): Form body, sections, artifact links, agent chat, agent type, status lights.
- Split `apps/ui/src/components/MetricsBadge.tsx` (was 253 lines) into:
  - `MetricsBadge.tsx` (~165): Main component, fetch, polling, layout.
  - `MetricsBadgeHelpers.tsx` (~95): Badge, getLatestEntry, getTrend, interfaces, constants.
- All files ≤200 lines. `go build ./...` and `pnpm --dir apps/ui build` verified.

### Phase 3 (cont.): Refactor orchestrator, settings, kanban handlers, impl handlers (2025-02-28) ✅
- Split `cmd/qa/app/orchestrator.go` (was 287 lines) into:
  - `orchestrator.go` (90): Orchestrator struct, Run, runArtifactVerification.
  - `orchestrator_reports.go` (149): writeArtifactVerificationReport, writeManifest, writeQAReport, writeImplementationAgentNote.
  - `orchestrator_playwright.go` (105): runPlaywright (for scripts/check-e2e).
- Split `cmd/llm/storage/settings.go` (was 249 lines) into:
  - `settings.go` (127): ProviderDefs, types, NewSettingsStore, Load, Save, Get, GetWithKeys.
  - `settings_operations.go` (132): Update, Resolve, FirstPaidModel, HasPaidProvider, PublicProviders.
- Split `cmd/kanban/transport/handlers.go` (was 217 lines) into:
  - `handlers.go` (40): BuildHandlers, strVal, mustParseStatusLights.
  - `handlers_card.go` (~125): buildCreateHandler, buildUpdateHandler, buildMoveHandler.
  - `handlers_board.go` (~105): buildSetMetaHandler, buildGetBoardHandler, buildDeleteCardsInColumnHandler, buildUpdateAgentChatHandler.
- Split `cmd/implementation/app/handlers.go` (was 260 lines) into:
  - `handlers.go` (124): Handlers struct, constructors, HandleApplyPatch, HandleAgentChat, HandlePlanRequest.
  - `handlers_document.go` (168): DocumentWork, LogVerboseRun, templateFS, implementationArtifacts.
- All resulting files ≤200 lines. `go build ./...` and `pnpm --dir apps/ui build` verified.

### Ticket quality: restore high-quality ticket format (2025-02-28) ✅

To match the previous engine ticket quality (Context/suspected cause, Suggested direction, specific ACs):

- **rulebook/ticket-template-and-definition-of-ready.md**: Added recommended sections **Context / suspected cause (for implementer)** and **Suggested implementation direction (non-binding)**. Added high-quality example (Kanban scrolling) with file paths, CSS selectors, DOM structure, and actionable guidance. Acceptance criteria guidance: use class names, behavior, layout—not generic "visible and verifiable".
- **rulebook/roles/pm.md**: Instruct PM to include Context/suspected cause and Suggested direction when codebase context available; ACs must be specific.
- **rulebook/roles/implementation.md**: Instruct Implementation to use Context/suspected cause and Suggested direction when present in the ticket.
- **cmd/pm/app/pm_handler_run.go**: PM refine flow now (1) queries codebase context (title + desc) in addition to PM chat, (2) passes both to LLM, (3) instructs PM to include Context/suspected cause and Suggested direction when it has codebase snippets, (4) discourages generic ACs ("visible and verifiable", "Basic smoke verification passes").
