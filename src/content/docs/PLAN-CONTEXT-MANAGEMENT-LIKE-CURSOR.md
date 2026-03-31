# Plan: Context Management Like Cursor

Make the engine's context retrieval behave more like Cursor's AI: structural reasoning, iterative exploration, reliable fallbacks, and full grounding in the codebase.

## Gap Analysis (Cursor vs Antikythera Engine)

| Capability | Cursor | Engine Today |
|------------|--------|-----------|
| **Structural reasoning** | Reads ChatFooter → sees import of ChatFooterTabs → opens child | Embeddings + keywords; import graph only expands helper→parent, not parent→child |
| **Cold start** | Grep, semantic search, file reads work without embeddings | Falls back to substring; 0 results when Context fails (http_error, all_filtered) |
| **Iterative exploration** | Search → refine → search again | Single retrieval pass; NEED requires LLM to explicitly output it |
| **Full file content** | Reads whole files | Snippets (80–200 chars); pre-load capped by size/count |
| **Literal search** | grep "Refresh" finds the only button | Relies on index containing "Refresh"; embeddings may miss |
| **Retrieval failure recovery** | N/A (always has access) | Logs cause, continues with extractPathsFromTask only |
| **Keyword weighting** | Leads with distinctive identifiers (Refresh) | Treats all keywords equally; "Footer" drowns out "Refresh" |

---

## 0. Distinctive Token Prioritization (Query De-Confusion)

**Problem:** "Remove Refresh button from Footer" — the user describes where they *see* it (footer = bottom of screen), not which component *contains* it (MetricsBadge). Retrieval locks onto "Footer" and returns ChatFooter, ChatFooterTabs. The word "Refresh" is the unique identifier (probably only one such button), but it gets down-weighted. If the user said "Remove Refresh from Metrics" we'd find it immediately. Users have no way to know the codebase structure.

**Root cause:** All keywords are treated equally. Location words (footer, header, sidebar, button) are generic and match many files. Literal identifiers (Refresh, Submit, specific labels) are distinctive and often unique. We need to **prioritize distinctive tokens** over location/container words.

**Files:** `cmd/implementation/app/impl_plan.go` (derivedRetrievalQueries, extractSearchQueryFromTask), `cmd/context/storage/store_query.go` (if query rewriting happens there)

### 0a. Classify keywords: distinctive vs location

- **Distinctive:** Button/link labels (Refresh, Submit, Save, Cancel), component names that appear in code (Metrics, MetricsBadge), aria-labels, specific strings. These are literal identifiers—few files contain them.
- **Location/container:** footer, header, sidebar, button, component, modal, tab—generic layout terms that many files match.
- Heuristic: distinctive = Title Case or CamelCase, or 4+ chars and not in a known location-word set.

### 0b. Lead retrieval with distinctive tokens

- In `derivedRetrievalQueries`, when building the keyword query:
  - Put distinctive tokens first: "Refresh Footer button" → "Refresh Footer" or even "Refresh" as the first/primary query
  - Run a query with *only* the most distinctive token early (e.g. "Refresh") to surface files that contain it regardless of "footer"
- Ensure we never run only "Footer" + "button" when "Refresh" is available—the literal identifier should drive at least one query

### 0c. Reorder merged results by distinctive-match

- After merging results from multiple queries, boost/reorder: paths whose snippets contain distinctive tokens rank above those that only match location words
- So MetricsBadge (contains "Refresh") ranks above ChatFooter (contains "footer") when "Refresh" is a task keyword

### 0d. Grep uses distinctive first

- When grep fallback runs, search for distinctive tokens first; only fall back to location words if no matches
- "Refresh" alone will find MetricsBadge; "footer" would require more context

---

## 1. Parent→Child Expansion (Import Graph Both Ways)

**Problem:** When retrieval finds `ChatFooter.tsx`, the target (Refresh button) may be in `ChatFooterTabs.tsx` which ChatFooter imports. Current import graph only expands helper/utils → their importers. We need the reverse: component → its imports.

**Files:** `cmd/context/storage/store.go`, `store_imports.go`, `store_query.go`

### 1a. Store `importsOf` (what each file imports)

- Add `importsOf map[string][]string` to Store (path → paths it imports)
- Populate during IndexPaths from `extractImports` (already returns imports per file)
- Keep `importedBy` for helper→parent expansion

### 1b. Expand results with imported children

- In `expandResultsWithImporters`, also expand component results: when result R has `importsOf[R]` non-empty, append those paths (with score penalty) so child components surface
- Apply to all component-like results (not just helpers), with a reasonable cap (e.g. max 3 children per parent)

---

## 2. Workspace Grep Fallback

**Problem:** When Context returns 0 results (http_error, empty_results, all_filtered), The engine has no code context. Cursor can always grep the workspace.

**Files:** `cmd/implementation/app/impl_plan.go`, new `impl_grep.go`

### 2a. Implement `grepWorkspace(workspace, pattern string) (paths []string, snippets map[string]string)`

- Shell out to `rg` (ripgrep) or `grep -r` if available; otherwise walk files and search
- Restrict to apps/, cmd/, pkg/; skip node_modules, dist, build
- Return paths and a short snippet (e.g. 1 line of context) per match
- Handle Windows (use `filepath.ToSlash` for paths)

### 2b. Trigger grep when Context fails

- In `queryContextWithCause`, when `len(merged) == 0` after fallback query retry:
  - Extract 1–2 distinctive keywords from the task (e.g. "Refresh", "footer")
  - Call `grepWorkspace(workspace, keyword)` for each
  - Build a minimal "ctx:" block from grep results (path + snippet)
  - Return that as snippets/paths so Implementation has *something*
- Set cause to e.g. "grep_fallback" so caller knows Context was unavailable

### 2c. Optional: Grep as supplemental

- Even when Context returns results, run grep for distinctive task keywords (e.g. "Refresh")
- Merge grep hits into results (deduped); ensures literal string matches always surface

---

## 3. Literal Token Boosting

**Problem:** "Refresh" is a unique button label. If the index omits it or embeddings don't match, retrieval fails. Cursor finds it via grep.

**Files:** `cmd/context/storage/store_summary.go`, `store_query.go`

### 3a. Strengthen extractIndexableTokens for button/label text

- Ensure `>Refresh<`, `>Submit<`, etc. are always extracted (current regex should cover; verify MetricsBadge, ChatFooterTabs, etc. get "Refresh" when present)
- Add explicit extraction for `children` text in JSX: `>{word}</` patterns with 2–30 char words
- Emit `buttons: Refresh Submit` in structural data so substring/embedding can match

### 3b. Literal-keyword query when retrieval is weak

- In `queryContextWithCause`, if merged results exist but none contain any task keyword (from `extractSearchQueryFromTask`):
  - Run a second Context query with just the most distinctive token (e.g. "Refresh")
  - Merge those results in; prioritizes literal matches

---

## 4. More Iterative NEED and Smarter Triggering

**Problem:** Cursor iterates until it finds the right file. The engine does one NEED round; the LLM must explicitly output "NEED: query". If it returns `[]` instead, we only have programmatic fallback when `isEmptyEditsResponse`.

**Files:** `cmd/implementation/app/impl_edits_need.go`, `impl.go`

### 4a. Proactive NEED when target not in loaded files

- `containsTarget` already triggers `fetchNeedContent` pre-edits
- Extend: when `containsTarget` is false, also consider running NEED *before* first `fetchEdits` if the task keywords suggest a specific element (e.g. "button", "Refresh")
- Log clearly when this fires

### 4b. NEED on empty edits with stronger guidance

- When LLM returns `[]` and `taskRequiresEdits`, the programmatic NEED already runs
- Add explicit prompt guidance: "If the provided file contents do not contain the element you need to change (e.g. the Refresh button), output NEED: <query> to search for the correct file. Do not return [] without trying NEED first."

### 4c. Increase NEED rounds for edit phase

- Current `maxNeedRounds = 3`; consider 4–5 when we detect "wrong file" (e.g. repair failed, containsTarget failed)
- Cap total to avoid infinite loops (e.g. 2 extra rounds after repair)

---

## 5. Richer Content for Edits Phase

**Problem:** Cursor reads full files. The engine sends snippets. When the LLM has the wrong file or a snippet that lacks the target, it can't produce correct edits.

**Files:** `cmd/implementation/app/impl.go`, `impl_plan.go`

### 5a. Ensure target-containing file gets full content

- When `gatherSmallFileContents` pre-loads files, include files that match task keywords even if slightly larger (e.g. up to 400 lines for files containing "Refresh" or other target tokens)
- Or: when retrieval returns paths, run `containsTarget` on each path's content; for paths that contain the target, always load full content (up to limit)

### 5b. Include sibling components when parent is in results

- When ChatFooter is in plan paths, automatically add ChatFooterTabs (and any other direct imports) to the file-content load set
- Uses `importsOf` from (1a); Implementation already has path list, we ensure we load those children

---

## 6. Post-Retrieval Validation (C.3 from Generalized Plan)

**File:** `cmd/implementation/app/impl_plan.go`

- After `queryContextWithCause` returns, extract target keywords from task
- If none of the top 3 retrieved paths' snippets contain any target keyword:
  - Log warning
  - Run fallback query (`extractSearchQueryFromTask` or literal keyword)
  - Merge fallback results into `retrievedPaths` and `retrievalBlock`
- Ensures we don't proceed to plan with irrelevant excerpts

---

## 7. Embedding Resilience

**Problem:** When embeddings are missing or Context is down, retrieval fails entirely. Substring fallback exists but can still return 0 if codeOnly filters everything.

**Files:** `cmd/context/storage/store_query.go`, `cmd/context/app/handlers.go`

### 7a. Never return 0 for codeOnly when code exists

- If `codeOnly` query returns 0 from embedding + substring, try one more pass with `codeOnly=false` (or a relaxed filter), then filter results client-side to code paths
- Ensures we don't lose results due to over-aggressive filtering

### 7b. Bootstrap embeddings eagerly

- On Context startup/index, prioritize embedding files under `apps/` (UI code) since UI tasks are common
- Document that indexing runs before serving; ensure `EmbedMissingCodePaths` completes for at least apps/ before first query

---

## 8. User-Facing Retrieval Diagnostics

**Problem:** User sees "implementation failed" but doesn't know retrieval returned 0 or wrong files.

**Files:** `cmd/implementation/app/impl.go`, UI (metrics/status display)

- `RetrievalWarning` already exists; ensure it's shown in the UI when present
- Add `RetrievalPaths` or similar to `ImplResult` so artifacts show which paths were used
- When grep fallback is used, include a clear message: "Context unavailable; used workspace search instead"

---

## Implementation Order

1. **0. Distinctive Token Prioritization** — Fixes "Footer drowns out Refresh"; lead with literal identifiers. Quick win, high impact.
2. **2. Workspace Grep Fallback** — Highest impact when Context fails; unblocks Implementation
3. **1. Parent→Child Expansion** — Fixes "footer has ChatFooter but button is in child" class of bugs
4. **6. Post-Retrieval Validation** — Catches bad retrieval before plan/edits
5. **3. Literal Token Boosting** — Ensures "Refresh" and similar always surface
6. **5. Richer Content** — Load children when parent in paths; full content for target files
7. **4. More Iterative NEED** — Stronger prompts and rounds
8. **7. Embedding Resilience** — Edge-case hardening
9. **8. User-Facing Diagnostics** — Visibility

---

## Risks and Mitigations

- **Distinctive vs location heuristic:** May misclassify (e.g. "Footer" as component name). Start with simple rules: Title Case / CamelCase = distinctive; lowercase common words (footer, header, button, modal) = location. Tune from real tickets.
- **Grep performance:** Large workspaces may be slow. Limit to code paths; consider `rg -l` (files only) first, then `rg -A1` for matches. Timeout after 5s.
- **Import explosion:** Expanding all imports could add many files. Cap children per parent (3) and total expansion (e.g. 10 extra paths).
- **NEED loops:** Cap extra rounds; track "already tried NEED for X" to avoid retrying same query.

---

## 9. Generalized Query Understanding (Understand & Adapt)

**Problem:** Current fixes are narrow: `footerHeaderMismatchPenalty`, `queryMentionsRefreshAndButton`, `literalButtonLabelBoost` each solve one case. The engine should *understand* task intent and *adapt* to any layout concept (sidebar, modal, nav bar, etc.) without adding new rules per concept.

**Principle:** Use LLM for intent extraction; use data-driven layout/region semantics; let the system extend without code changes.

### 9a. LLM query-intent extraction (optional pre-retrieval step)

- **When:** For queries with location/UI terms (footer, header, sidebar, modal, etc.), call a lightweight LLM before retrieval.
- **Input:** Raw task/query.
- **Output (structured):** `{ target_region: "footer"|"header"|"sidebar"|"modal"|null, target_element: "Refresh button", action: "remove"|"modify"|"add" }`
- **Use:** `target_region` → filter/penalize paths that contradict (see 9b). `target_element` → drive retrieval query (distinctive token).
- **Gate:** On by default. Use `HAL_DISABLE_QUERY_INTENT=1` to fall back to current heuristic.
- **Generalization:** Any region the LLM infers (e.g. "nav bar", "settings panel") maps to path semantics; no new code per concept.

### 9b. Data-driven layout region semantics

Replace hardcoded `queryPathLayoutMismatch` / `footerHeaderMismatchPenalty` with:

- **Region vocabulary:** `layoutRegions := map[string][]string` — each region (e.g. "footer") has path/content signals; each region has `contradicts: []string` (e.g. footer contradicts header).
- **Path → region at index time:** `getPathLayoutRegions(path, content) []string` — infer from path (ChatFooter→footer, AppHeader→header), content (bottom:, position:fixed+bottom), structural index. Store per-path or derive at query time.
- **Query → target region:** From `extractTaskKeywords` location list or from LLM (9a). Map "bottom"→footer, "top"→header, etc.
- **Scoring:** If `pathRegions` ∩ `contradicts(targetRegion)` ≠ ∅, apply penalty. Extensible: add "sidebar"↔"main" by editing the map.

**Files:** `cmd/context/storage/store_query.go`, `store_summary.go`, new `store_layout.go` or inline.

### 9c. Trust disambiguation as primary corrector

- **Pre-plan disambiguation is on by default** when we have excerpts and multiple paths. Use `HAL_DISABLE_PREPLAN_DISAMBIGUATE=1` to opt out.
- Disambiguation asks the LLM: "Which path(s) contain the element to change?" — it understands footer vs header from excerpts. No rule coding.
- Reduce reliance on scoring hacks when the LLM can explicitly pick the right file from excerpts.

### 9d. Migration from narrow rules

- Remove or generalize: `queryMentionsRefreshAndButton`, `literalButtonLabelBoost`, `queryPathLayoutMismatch`, `footerHeaderMismatchPenalty`.
- Replace with: (1) intent extraction or improved `extractTaskKeywords` for regions, (2) data-driven region contradiction table, (3) stronger disambiguation.

### Implementation order for §9

1. **9b** — Data-driven layout regions (replace footer/header hardcoding). Quick, extends to sidebar/modal.
2. **9c** — Enable disambiguation by default for UI tasks. Zero new rules.
3. **9a** — Optional LLM intent extraction for full generalization.
4. **9d** — Remove narrow rules once 9a–9c are stable.
